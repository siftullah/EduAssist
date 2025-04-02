from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tempfile
import shutil
import os

from .database.crud import Database
from .services.chat_service import ChatService
from .services.pdf_service import PDFService
from .schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationCreate,
    ConversationUpdate,
    Conversation
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize services
    app.state.chat_service = ChatService()
    app.state.pdf_service = PDFService()
    yield
    # Cleanup
    app.state.chat_service.close()
    app.state.pdf_service.close()

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

@app.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    chat_service = app.state.chat_service
    
    # First determine the type of query
    option = chat_service.determine_option(request.query, request.user_role, request.conversation_id)
    
    # Handle based on option
    if option == 1:
        response = chat_service.handle_normal_qa(request.query, request.user_role, request.conversation_id)
        return {"type": "normal_qa", "response": response}
    
    elif option == 2:
        response = chat_service.handle_rag_qa(
            request.query,
            request.user_role,
            request.user_id,
            request.current_url,
            request.conversation_id
        )
        return {"type": "rag_qa", "response": response}
    
    elif option == 3:
        reminder_data = chat_service.handle_reminder(
            request.query,
            request.user_role,
            request.user_id,
            request.conversation_id
        )
        return {"type": "reminder", "response": reminder_data}
    
    return {"type": "error", "response": "Invalid option determined"}

@app.post("/chat-with-pdf")
async def chat_with_pdf(
    attachment: UploadFile = File(...),
    user_id: str = Form(...),
    user_role: str = Form(...), 
    query: str = Form(...),
    conversation_id: int = Form(...)
):
    pdf_service = app.state.pdf_service
    
    try:
        # Process the file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            shutil.copyfileobj(attachment.file, tmp_file)
            tmp_path = tmp_file.name
        
        try:
            # Process the PDF
            pdf_chunks = pdf_service.process_pdf(tmp_path)
            
            # Handle the query
            response = pdf_service.handle_pdf_query(
                user_id,
                query,
                pdf_chunks,
                user_role,
                conversation_id
            )
            
            return {"type": "pdf_qa", "response": response}
            
        finally:
            # Clean up the temporary file
            os.unlink(tmp_path)
            
    except Exception as e:
        error_msg = f"Error processing PDF chat request: {str(e)}"
        return {"type": "error", "response": error_msg}

@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    db = Database()
    try:
        conversations = db.get_conversations(user_id)
        return {"conversations": conversations}
    finally:
        db.close()

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: int):
    db = Database()
    try:
        messages = db.get_conversation_messages(conversation_id)
        return {"messages": messages}
    finally:
        db.close()

@app.post("/conversations")
async def create_conversation(request: ConversationCreate):
    db = Database()
    try:
        conversation = db.create_conversation(request.user_id, request.name)
        if conversation:
            return conversation
        return {"error": "Failed to create conversation"}
    finally:
        db.close()

@app.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: int, request: ConversationUpdate):
    db = Database()
    try:
        if db.update_conversation(conversation_id, request.name):
            return {"message": "Conversation updated successfully"}
        return {"error": "Failed to update conversation"}
    finally:
        db.close()

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int):
    db = Database()
    try:
        if db.delete_conversation(conversation_id):
            return {"message": "Conversation deleted successfully"}
        return {"error": "Failed to delete conversation"}
    finally:
        db.close() 