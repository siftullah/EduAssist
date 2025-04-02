import tempfile
import shutil
from typing import List
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..database.crud import Database
from ..utils.conversation import format_conversation_history

class PDFService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4")
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        self.db = Database()

    def process_pdf(self, file_path: str) -> List[Document]:
        # Load PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        return text_splitter.split_documents(documents)

    def handle_pdf_query(self, user_id: str, query: str, pdf_chunks: List[Document], user_role: str, conversation_id: int) -> str:
        # Create a temporary vector store for the PDF content
        pdf_vector_store = Chroma(
            collection_name="temp_pdf_collection",
            embedding_function=self.embeddings,
        )
        
        # Add the PDF chunks to the vector store
        pdf_vector_store.add_documents(pdf_chunks)
        
        try:
            # Search for relevant chunks
            results = pdf_vector_store.similarity_search(query, k=10)
            
            # Format context
            context = "\n\n".join([
                f"Content {i+1}:\n{doc.page_content}"
                for i, doc in enumerate(results)
            ])
            
            # Get response from LLM
            prompt = ChatPromptTemplate.from_template("""You are an AI assistant for students and faculty. Your role is to answer questions about a PDF document.
            Based on the provided content from the PDF and the user's query, provide a detailed and accurate response.
            
            User Role: {user_role}
            Current Query: {query}
            
            Relevant PDF Content:
            {context}
                                                      

            Pdf Content ends here.
            
            Instructions:
            1. Focus on answering the query using information from the PDF
            2. Be specific and cite relevant information from the PDF
            3. If the query cannot be fully answered with the provided content, acknowledge this
            4. Use a natural, conversational tone
            5. Organize the response in a clear, readable format
            6. If pdf content is not relevant to the query, say "I couldn't find any relevant information in the PDF." or some similar response.
            
            Provide your response:""")
            
            chain = prompt | self.llm
            result = chain.invoke({
                "query": query,
                "user_role": user_role,
                "context": context,
            })
            
            response = result.content.strip()
            
            # Store messages
            self.db.store_message(conversation_id, "human", "pdf_qa", query)
            self.db.store_message(conversation_id, "chatbot", "pdf_qa", response)

            pdf_vector_store.delete_collection()
            
            return response
        
        except Exception as e:
            return f"I apologize, but I encountered an error while processing your PDF chat request. Please try again later."

    def close(self):
        self.db.close() 