import json
import os
import tempfile
import shutil
import requests
from typing import List, Dict
from datetime import datetime

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from config import LLM_MODEL, EMBEDDINGS_MODEL, REMINDER_API_URL
from database.sqlite_db import store_message, get_conversation_context
from utils.helpers import format_conversation_history
from utils.prompts import (
    OPTION_SELECTOR_PROMPT,
    NORMAL_QA_PROMPT,
    RAG_QUERY_PROMPT,
    RAG_RESPONSE_PROMPT,
    REMINDER_PROMPT,
    PDF_QA_PROMPT,
)

llm = ChatOpenAI(model=LLM_MODEL)
embeddings = OpenAIEmbeddings(model=EMBEDDINGS_MODEL)


def determine_option(query: str, user_role: str, conversation_id: int) -> int:
    conversation_history = format_conversation_history(get_conversation_context())

    prompt = ChatPromptTemplate.from_template(OPTION_SELECTOR_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "conversation_history": conversation_history
    })

    option = int(result.content.strip())
    print(f"\n[OPTION SELECTION] Query: '{query}', Option: {option}\n")
    return option


def handle_normal_qa(query: str, user_role: str, conversation_id: int) -> str:
    print(f"\n[NORMAL QA] Query: '{query}', User Role: {user_role}\n")

    conversation_history = format_conversation_history(get_conversation_context())

    prompt = ChatPromptTemplate.from_template(NORMAL_QA_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "conversation_history": conversation_history
    })

    response = result.content.strip()
    print(f"\n[NORMAL QA RESPONSE] {response[:200]}...\n")

    store_message(conversation_id, "human", "normal_qa", query)
    store_message(conversation_id, "chatbot", "normal_qa", response)

    return response


def handle_rag_qa(query: str, user_role: str, user_id: str, current_url: str, conversation_id: int, vector_store: Chroma) -> str:
    print(f"\n[RAG PIPELINE START] Query: '{query}', User: {user_id}, Role: {user_role}, URL: {current_url}\n")

    current_time = datetime.now()
    conversation_history = format_conversation_history(get_conversation_context())

    prompt = ChatPromptTemplate.from_template(RAG_QUERY_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "current_url": current_url,
        "current_datetime": current_time.isoformat(),
        "conversation_history": conversation_history
    })

    print(f"\n[RAG QUERY PARAMETERS] LLM Response:\n{result.content}\n")

    try:
        response_text = result.content.strip()
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        search_params = json.loads(response_text)
        print(f"\n[RAG PARSED PARAMETERS] {json.dumps(search_params, indent=2)}\n")

        if "search_query" not in search_params:
            print("\n[RAG ERROR] No search query in LLM response, using original query\n")
            search_params["search_query"] = query

        if "filters" not in search_params:
            print("\n[RAG ERROR] No filters in LLM response, using default filters\n")
            search_params["filters"] = {}

    except json.JSONDecodeError as e:
        print(f"\n[RAG JSON ERROR] Could not parse LLM response: {e}\n")
        search_params = {
            "search_query": query,
            "filters": {}
        }

    # Build the search filter
    filter_conditions = []
    filter_conditions.append({"user_id": {"$eq": user_id}})

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

    print(f"\n[RAG SEARCH FILTER] {json.dumps(search_filter, indent=2)}\n")

    search_query = search_params.get("search_query", query)
    print(f"\n[RAG SEARCH QUERY] '{search_query}'\n")

    try:
        results = vector_store.similarity_search(
            search_query,
            k=15,
            filter=search_filter
        )

        print(f"\n[RAG RESULTS] Found {len(results)} results\n")
        if results:
            for i, doc in enumerate(results):
                print(f"Result {i+1}:\nContent: {doc.page_content[:200]}...\nMetadata: {doc.metadata}\n")

        if not results:
            print("\n[RAG INFO] No results found\n")
            return "I couldn't find any quiz announcements from teachers yesterday."

        context = "\n\n".join([
            f"Post {i+1}:\n{doc.page_content}\nMetadata: {doc.metadata}"
            for i, doc in enumerate(results)
        ])

        prompt = ChatPromptTemplate.from_template(RAG_RESPONSE_PROMPT)
        chain = prompt | llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "context": context,
            "conversation_history": conversation_history
        })

        response = result.content.strip()
        print(f"\n[RAG FINAL RESPONSE] {response[:200]}...\n")

        store_message(conversation_id, "human", "rag_qa", query)
        store_message(conversation_id, "chatbot", "rag_qa", response)

        return response

    except Exception as e:
        print(f"\n[RAG ERROR] Search failed: {str(e)}\n")
        return f"I apologize, but I encountered an error while searching for relevant information. Error: {str(e)}"


def handle_reminder(query: str, user_role: str, user_id: str, conversation_id: int) -> Dict:
    print(f"\n[REMINDER] Query: '{query}', User: {user_id}, Role: {user_role}\n")

    current_time = datetime.now().isoformat()
    conversation_history = format_conversation_history(get_conversation_context())

    prompt = ChatPromptTemplate.from_template(REMINDER_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "user_id": user_id,
        "current_datetime": current_time,
        "conversation_history": conversation_history
    })

    print(f"\n[REMINDER LLM RESPONSE] {result.content}\n")

    try:
        response_text = result.content.strip()
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        parsed_data = json.loads(response_text)
        print(f"\n[REMINDER PARSED] {json.dumps(parsed_data, indent=2)}\n")

        try:
            response = requests.post(
                REMINDER_API_URL,
                json=parsed_data["reminder"],
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200 or response.status_code == 201:
                print("\n[REMINDER API] Successfully created reminder\n")
                store_message(conversation_id, "human", "reminder", query)
                store_message(conversation_id, "chatbot", "reminder", parsed_data["human_response"])
                return {"type": "success", "response": parsed_data["human_response"]}
            else:
                print(f"\n[REMINDER API ERROR] Status code: {response.status_code}\n")
                error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
                store_message(conversation_id, "human", "reminder", query)
                store_message(conversation_id, "chatbot", "reminder", error_msg)
                return {"type": "error", "response": error_msg}

        except requests.RequestException as e:
            print(f"\n[REMINDER API ERROR] Failed to make API call: {str(e)}\n")
            error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
            store_message(conversation_id, "human", "reminder", query)
            store_message(conversation_id, "chatbot", "reminder", error_msg)
            return {"type": "error", "response": error_msg}

    except json.JSONDecodeError as e:
        print(f"\n[REMINDER JSON ERROR] {e}\n")
        error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
        store_message(conversation_id, "human", "reminder", query)
        store_message(conversation_id, "chatbot", "reminder", error_msg)
        return {"type": "error", "response": error_msg}
    except KeyError as e:
        print(f"\n[REMINDER FORMAT ERROR] Missing required field: {e}\n")
        error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
        store_message(conversation_id, "human", "reminder", query)
        store_message(conversation_id, "chatbot", "reminder", error_msg)
        return {"type": "error", "response": error_msg}


def process_pdf(file_path: str) -> List[Document]:
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )

    splits = text_splitter.split_documents(documents)
    return splits


def handle_pdf_query(user_id: str, query: str, pdf_chunks: List[Document], user_role: str, conversation_id: int) -> str:
    pdf_vector_store = Chroma(
        collection_name="temp_pdf_collection",
        embedding_function=embeddings,
    )

    pdf_vector_store.add_documents(pdf_chunks)

    try:
        results = pdf_vector_store.similarity_search(query, k=10)

        context = "\n\n".join([
            f"Content {i+1}:\n{doc.page_content}"
            for i, doc in enumerate(results)
        ])

        prompt = ChatPromptTemplate.from_template(PDF_QA_PROMPT)

        chain = prompt | llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "context": context,
        })

        response = result.content.strip()

        store_message(conversation_id, "human", "pdf_qa", query)
        store_message(conversation_id, "chatbot", "pdf_qa", response)

        pdf_vector_store.delete_collection()

        return response

    except Exception as e:
        print(f"\n[PDF CHAT ERROR] {str(e)}\n")
        return f"I apologize, but I encountered an error while processing your PDF chat request. Please try again later."
