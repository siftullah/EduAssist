from datetime import datetime
from typing import Optional

class Conversation:
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: str = "",
        name: str = "",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

class Message:
    def __init__(
        self,
        id: Optional[int] = None,
        conversation_id: int = 0,
        sender: str = "",
        type: str = "",
        content: str = "",
        created_at: Optional[datetime] = None,
        deleted_at: Optional[datetime] = None
    ):
        self.id = id
        self.conversation_id = conversation_id
        self.sender = sender
        self.type = type
        self.content = content
        self.created_at = created_at or datetime.now()
        self.deleted_at = deleted_at 