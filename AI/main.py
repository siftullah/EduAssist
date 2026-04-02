import os
import shutil
import tempfile
from datetime import datetime
from contextlib import asynccontextmanager

import chromadb
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from sqlite3 import Error

from config import LLM_MODEL, EMBEDDINGS_MODEL, SQLITE_DB_PATH, CHROMA_DB_PATH, CHROMA_COLLECTION_NAME
from database.sqlite_db import init_sqlite_db, connect_existing_db, load_conversation_context, get_db_connection
from schemas.models import ChatRequest
from services.chat_service import (
    determine_option,
    handle_normal_qa,
    handle_rag_qa,
    handle_reminder,
    handle_pdf_query,
    process_pdf,
)
from services.vector_service import (
    load_posts_from_excel,
    edit_vector_data,
    get_vector_counts,
    simple_chat,
)

llm = ChatOpenAI(model=LLM_MODEL)
embeddings = OpenAIEmbeddings(model=EMBEDDINGS_MODEL)
vector_store = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store

    # Initialize SQLite database
    if os.path.exists(SQLITE_DB_PATH):
        connect_existing_db()

    # Initialize vector store
    chromadb_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    chromadb_client.get_or_create_collection(CHROMA_COLLECTION_NAME)

    vector_store = Chroma(
        client=chromadb_client,
        collection_name=CHROMA_COLLECTION_NAME,
        embedding_function=embeddings,
    )

    yield

    # Close database connection
    db_conn = get_db_connection()
    if db_conn:
        db_conn.close()


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.get("/initialize_db")
async def initialize_database():
    if os.path.exists(SQLITE_DB_PATH):
        return {"message": "Database already exists"}

    if init_sqlite_db():
        return {"message": "Database initialized successfully"}
    else:
        return {"error": "Failed to initialize database"}


@app.get("/get-counts")
def get_counts():
    return get_vector_counts(vector_store)


@app.get("/load-posts/")
async def load_posts():
    return await load_posts_from_excel(vector_store)


@app.get("/chat")
def chat_simple():
    return simple_chat(llm)


@app.post("/edit-data")
async def edit_data(data: dict):
    return await edit_vector_data(data, vector_store)


@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"\n[API REQUEST] User: {request.user_id}, Role: {request.user_role}, Query: '{request.query}', URL: {request.current_url}\n")

    load_conversation_context(request.conversation_id)

    option = determine_option(request.query, request.user_role, request.conversation_id)

    if option == 1:
        print(f"\n[API SELECTED] Normal QA\n")
        response = handle_normal_qa(request.query, request.user_role, request.conversation_id)
        return {"type": "normal_qa", "response": response}

    elif option == 2:
        print(f"\n[API SELECTED] RAG QA\n")
        response = handle_rag_qa(
            request.query,
            request.user_role,
            request.user_id,
            request.current_url,
            request.conversation_id,
            vector_store
        )
        return {"type": "rag_qa", "response": response}

    elif option == 3:
        print(f"\n[API SELECTED] Reminder\n")
        reminder_data = handle_reminder(
            request.query,
            request.user_role,
            request.user_id,
            request.conversation_id
        )
        return {"type": "reminder", "response": reminder_data}

    print(f"\n[API ERROR] Invalid option: {option}\n")
    return {"error": "Invalid option determined"}


@app.post("/chat-with-pdf")
async def chat_with_pdf(
    attachment: UploadFile = File(...),
    user_id: str = Form(...),
    user_role: str = Form(...),
    query: str = Form(...),
    conversation_id: int = Form(...)
):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            shutil.copyfileobj(attachment.file, tmp_file)
            tmp_path = tmp_file.name

        try:
            pdf_chunks = process_pdf(tmp_path)
            load_conversation_context(conversation_id)

            response = handle_pdf_query(
                user_id,
                query,
                pdf_chunks,
                user_role,
                conversation_id
            )

            return {"type": "pdf_qa", "response": response}

        finally:
            os.unlink(tmp_path)

    except Exception as e:
        error_msg = f"Error processing PDF chat request: {str(e)}"
        print(f"\n[PDF CHAT ERROR] {error_msg}\n")
        return {"type": "error", "response": error_msg}


@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
        db_connection = get_db_connection()
        cursor = db_connection.cursor()
        cursor.execute('''
        SELECT id, name, created_at, updated_at
        FROM conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC
        ''', (user_id,))

        conversations = cursor.fetchall()
        return {
            "conversations": [
                {
                    "id": conv[0],
                    "name": conv[1],
                    "created_at": conv[2],
                    "updated_at": conv[3]
                }
                for conv in conversations
            ]
        }
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to fetch conversations: {str(e)}\n")
        return {"error": "Failed to fetch conversations"}


@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: int):
    try:
        db_connection = get_db_connection()
        cursor = db_connection.cursor()
        cursor.execute('''
        SELECT id, sender, type, content, created_at
        FROM messages
        WHERE conversation_id = ? AND deleted_at IS NULL
        ORDER BY created_at ASC
        ''', (conversation_id,))

        messages = cursor.fetchall()
        return {
            "messages": [
                {
                    "id": msg[0],
                    "sender": msg[1],
                    "type": msg[2],
                    "content": msg[3],
                    "timestamp": msg[4]
                }
                for msg in messages
            ]
        }
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to fetch messages: {str(e)}\n")
        return {"error": "Failed to fetch messages"}


@app.post("/conversations")
async def create_conversation(request: dict):
    try:
        db_connection = get_db_connection()
        cursor = db_connection.cursor()
        cursor.execute('''
        INSERT INTO conversations (user_id, name)
        VALUES (?, ?)
        ''', (request["user_id"], request["name"]))

        conversation_id = cursor.lastrowid
        db_connection.commit()

        return {
            "id": conversation_id,
            "name": request["name"],
            "created_at": datetime.now().isoformat()
        }
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to create conversation: {str(e)}\n")
        return {"error": "Failed to create conversation"}


@app.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: int, request: dict):
    try:
        db_connection = get_db_connection()
        cursor = db_connection.cursor()
        cursor.execute('''
        UPDATE conversations
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', (request["name"], conversation_id))

        db_connection.commit()
        return {"message": "Conversation updated successfully"}
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to update conversation: {str(e)}\n")
        return {"error": "Failed to update conversation"}


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int):
    try:
        db_connection = get_db_connection()
        cursor = db_connection.cursor()
        cursor.execute('''
        delete from messages
        where conversation_id = ?
        ''', (conversation_id,))

        cursor.execute('''
        delete from conversations
        where id = ?
        ''', (conversation_id,))

        db_connection.commit()
        return {"message": "Conversation deleted successfully"}
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to delete conversation: {str(e)}\n")
        return {"error": "Failed to delete conversation"}
