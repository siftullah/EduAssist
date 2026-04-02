from pydantic import BaseModel
from fastapi import UploadFile


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
    attachment: UploadFile
