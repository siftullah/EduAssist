from datetime import datetime
import json
import requests
from typing import Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
import chromadb

from ..database.crud import Database
from ..utils.prompts import (
    OPTION_SELECTOR_PROMPT,
    NORMAL_QA_PROMPT,
    RAG_QUERY_PROMPT,
    RAG_RESPONSE_PROMPT,
    REMINDER_PROMPT
)
from ..utils.conversation import format_conversation_history
from ..config import VECTOR_STORE_PATH, COLLECTION_NAME, API_HOST, API_PORT

class ChatService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4")
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        self.db = Database()
        self.vector_store = None
        self._init_vector_store()

    def _init_vector_store(self):
        chromadb_client = chromadb.PersistentClient(path=VECTOR_STORE_PATH)
        chromadb_client.get_or_create_collection(COLLECTION_NAME)

        self.vector_store = Chroma(
            client=chromadb_client,
            collection_name=COLLECTION_NAME,
            embedding_function=self.embeddings,
        )

    def determine_option(self, query: str, user_role: str, conversation_id: int) -> int:
        conversation_history = format_conversation_history(
            self.db.load_conversation_context(conversation_id)
        )
        
        prompt = ChatPromptTemplate.from_template(OPTION_SELECTOR_PROMPT)
        chain = prompt | self.llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "conversation_history": conversation_history
        })
        return int(result.content.strip())

    def handle_normal_qa(self, query: str, user_role: str, conversation_id: int) -> str:
        conversation_history = format_conversation_history(
            self.db.load_conversation_context(conversation_id)
        )
        
        prompt = ChatPromptTemplate.from_template(NORMAL_QA_PROMPT)
        chain = prompt | self.llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "conversation_history": conversation_history
        })
        
        response = result.content.strip()
        
        # Store messages
        self.db.store_message(conversation_id, "human", "normal_qa", query)
        self.db.store_message(conversation_id, "chatbot", "normal_qa", response)
        
        return response

    def handle_rag_qa(self, query: str, user_role: str, user_id: str, current_url: str, conversation_id: int) -> str:
        current_time = datetime.now()
        conversation_history = format_conversation_history(
            self.db.load_conversation_context(conversation_id)
        )
        
        # Get search parameters
        prompt = ChatPromptTemplate.from_template(RAG_QUERY_PROMPT)
        chain = prompt | self.llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "current_url": current_url,
            "current_datetime": current_time.isoformat(),
            "conversation_history": conversation_history
        })
        
        try:
            response_text = result.content.strip()
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            search_params = json.loads(response_text)
            
            if "search_query" not in search_params:
                search_params["search_query"] = query
                
            if "filters" not in search_params:
                search_params["filters"] = {}
                
        except json.JSONDecodeError:
            search_params = {
                "search_query": query,
                "filters": {}
            }
        
        # Build search filter
        filter_conditions = [{"user_id": {"$eq": user_id}}]
        
        if "filters" in search_params:
            for key, value in search_params["filters"].items():
                if key == "created_at":
                    if isinstance(value, dict):
                        if value.get("start"):
                            iso_str = value["start"].replace('Z', '+05:00')
                            start_unix = int(datetime.fromisoformat(iso_str).timestamp())
                            filter_conditions.append({"created_at": {"$gte": start_unix}})
                        if value.get("end"):
                            iso_str = value["end"].replace('Z', '+05:00')
                            end_unix = int(datetime.fromisoformat(iso_str).timestamp())
                            filter_conditions.append({"created_at": {"$lte": end_unix}})
                elif key != "user_id":
                    if isinstance(value, str) and value.lower() == "not_null":
                        filter_conditions.append({key: {"$ne": ""}})
                    elif isinstance(value, str) and value.lower() == "null":
                        filter_conditions.append({key: {"$eq": ""}})
                    else:
                        filter_conditions.append({key: {"$eq": value}})
        
        search_filter = filter_conditions[0] if len(filter_conditions) == 1 else {"$and": filter_conditions}
        search_query = search_params.get("search_query", query)
        
        try:
            results = self.vector_store.similarity_search(
                search_query,
                k=15,
                filter=search_filter
            )
            
            if not results:
                return "I couldn't find any relevant information."
            
            context = "\n\n".join([
                f"Post {i+1}:\n{doc.page_content}\nMetadata: {doc.metadata}"
                for i, doc in enumerate(results)
            ])
            
            prompt = ChatPromptTemplate.from_template(RAG_RESPONSE_PROMPT)
            chain = prompt | self.llm
            result = chain.invoke({
                "query": query,
                "user_role": user_role,
                "context": context,
                "conversation_history": conversation_history
            })
            
            response = result.content.strip()
            
            # Store messages
            self.db.store_message(conversation_id, "human", "rag_qa", query)
            self.db.store_message(conversation_id, "chatbot", "rag_qa", response)
            
            return response
            
        except Exception as e:
            return f"I apologize, but I encountered an error while searching for relevant information. Error: {str(e)}"

    def handle_reminder(self, query: str, user_role: str, user_id: str, conversation_id: int) -> Dict:
        current_time = datetime.now().isoformat()
        conversation_history = format_conversation_history(
            self.db.load_conversation_context(conversation_id)
        )
        
        prompt = ChatPromptTemplate.from_template(REMINDER_PROMPT)
        chain = prompt | self.llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "user_id": user_id,
            "current_datetime": current_time,
            "conversation_history": conversation_history
        })
        
        try:
            response_text = result.content.strip()
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            parsed_data = json.loads(response_text)
            
            # Make API call to create reminder
            try:
                response = requests.post(
                    f"http://{API_HOST}:{API_PORT}/api/reminders",
                    json=parsed_data["reminder"],
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in (200, 201):
                    # Store messages
                    self.db.store_message(conversation_id, "human", "reminder", query)
                    self.db.store_message(conversation_id, "chatbot", "reminder", parsed_data["human_response"])
                    return {"type": "success", "response": parsed_data["human_response"]}
                else:
                    error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
                    self.db.store_message(conversation_id, "human", "reminder", query)
                    self.db.store_message(conversation_id, "chatbot", "reminder", error_msg)
                    return {"type": "error", "response": error_msg}
                    
            except requests.RequestException:
                error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
                self.db.store_message(conversation_id, "human", "reminder", query)
                self.db.store_message(conversation_id, "chatbot", "reminder", error_msg)
                return {"type": "error", "response": error_msg}
                
        except (json.JSONDecodeError, KeyError):
            error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
            self.db.store_message(conversation_id, "human", "reminder", query)
            self.db.store_message(conversation_id, "chatbot", "reminder", error_msg)
            return {"type": "error", "response": error_msg}

    def close(self):
        self.db.close() 