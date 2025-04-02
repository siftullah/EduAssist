from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    user_id: str
    user_role: str
    query: str
    current_url: str
    conversation_id: int

class PDFChatRequest(BaseModel):
    user_id: str
    user_role: str
    query: str
    conversation_id: int
    attachment: str  # This will be handled as UploadFile in the route

class ChatResponse(BaseModel):
    type: str
    response: str

class ConversationCreate(BaseModel):
    user_id: str
    name: str

class ConversationUpdate(BaseModel):
    name: str

class Message(BaseModel):
    id: Optional[int] = None
    sender: str
    type: str
    content: str
    timestamp: Optional[str] = None

class Conversation(BaseModel):
    id: Optional[int] = None
    name: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None 