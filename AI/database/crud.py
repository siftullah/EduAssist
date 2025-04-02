import sqlite3
from sqlite3 import Error
from datetime import datetime
from typing import List, Dict, Optional
from .models import Conversation, Message
from ..config import SQLITE_DB_PATH

class Database:
    def __init__(self):
        self.connection = None
        self.init_db()

    def init_db(self):
        if not self.connection:
            try:
                self.connection = sqlite3.connect(SQLITE_DB_PATH)
                cursor = self.connection.cursor()
                
                # Create conversations table
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                ''')
                
                # Create messages table
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    sender TEXT CHECK(sender IN ('human', 'chatbot')) NOT NULL,
                    type TEXT CHECK(type IN ('normal_qa', 'rag_qa', 'reminder', 'pdf_qa')) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
                )
                ''')
                
                self.connection.commit()
                print("\n[SQLITE] Database initialized successfully\n")
                
            except Error as e:
                print(f"\n[SQLITE ERROR] {str(e)}\n")
                raise

    def load_conversation_context(self, conversation_id: int) -> List[Dict]:
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            SELECT sender, type, content, created_at 
            FROM messages 
            WHERE conversation_id = ? AND deleted_at IS NULL 
            ORDER BY created_at DESC
            ''', (conversation_id,))
            
            messages = cursor.fetchall()
            return [
                {
                    "sender": msg[0],
                    "type": msg[1],
                    "content": msg[2],
                    "created_at": msg[3]
                }
                for msg in messages
            ]
            
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to load conversation context: {str(e)}\n")
            return []

    def store_message(self, conversation_id: int, sender: str, msg_type: str, content: str):
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            INSERT INTO messages (conversation_id, sender, type, content)
            VALUES (?, ?, ?, ?)
            ''', (conversation_id, sender, msg_type, content))
            
            # Update conversation updated_at
            cursor.execute('''
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
            ''', (conversation_id,))
            
            self.connection.commit()
            print(f"\n[SQLITE] Stored new message for conversation {conversation_id}\n")
            
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to store message: {str(e)}\n")
            raise

    def get_conversations(self, user_id: str) -> List[Dict]:
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            SELECT id, name, created_at, updated_at
            FROM conversations
            WHERE user_id = ?
            ORDER BY updated_at DESC
            ''', (user_id,))
            
            conversations = cursor.fetchall()
            return [
                {
                    "id": conv[0],
                    "name": conv[1],
                    "created_at": conv[2],
                    "updated_at": conv[3]
                }
                for conv in conversations
            ]
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to fetch conversations: {str(e)}\n")
            return []

    def get_conversation_messages(self, conversation_id: int) -> List[Dict]:
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            SELECT id, sender, type, content, created_at
            FROM messages
            WHERE conversation_id = ? AND deleted_at IS NULL
            ORDER BY created_at ASC
            ''', (conversation_id,))
            
            messages = cursor.fetchall()
            return [
                {
                    "id": msg[0],
                    "sender": msg[1],
                    "type": msg[2],
                    "content": msg[3],
                    "timestamp": msg[4]
                }
                for msg in messages
            ]
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to fetch messages: {str(e)}\n")
            return []

    def create_conversation(self, user_id: str, name: str) -> Optional[Dict]:
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            INSERT INTO conversations (user_id, name)
            VALUES (?, ?)
            ''', (user_id, name))
            
            conversation_id = cursor.lastrowid
            self.connection.commit()
            
            return {
                "id": conversation_id,
                "name": name,
                "created_at": datetime.now().isoformat()
            }
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to create conversation: {str(e)}\n")
            return None

    def update_conversation(self, conversation_id: int, name: str) -> bool:
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
            UPDATE conversations
            SET name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            ''', (name, conversation_id))
            
            self.connection.commit()
            return True
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to update conversation: {str(e)}\n")
            return False

    def delete_conversation(self, conversation_id: int) -> bool:
        try:
            cursor = self.connection.cursor()
            # First mark all messages as deleted
            cursor.execute('''
            DELETE FROM messages
            WHERE conversation_id = ?
            ''', (conversation_id,))
            
            # Then delete the conversation
            cursor.execute('''
            DELETE FROM conversations
            WHERE id = ?
            ''', (conversation_id,))
            
            self.connection.commit()
            return True
        except Error as e:
            print(f"\n[SQLITE ERROR] Failed to delete conversation: {str(e)}\n")
            return False

    def close(self):
        if self.connection:
            self.connection.close() 