import os
import sqlite3
from sqlite3 import Error
from datetime import datetime
from typing import List, Dict

from config import SQLITE_DB_PATH

db_connection = None
current_conversation_id = None
conversation_context = []


def get_db_connection():
    global db_connection
    return db_connection


def init_sqlite_db():
    global db_connection

    if not os.path.exists(SQLITE_DB_PATH):
        try:
            db_connection = sqlite3.connect(SQLITE_DB_PATH)
            cursor = db_connection.cursor()

            cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')

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

            db_connection.commit()
            print("\n[SQLITE] Database initialized successfully\n")
            return True

        except Error as e:
            print(f"\n[SQLITE ERROR] {str(e)}\n")
            return False


def connect_existing_db():
    global db_connection

    if os.path.exists(SQLITE_DB_PATH):
        try:
            db_connection = sqlite3.connect(SQLITE_DB_PATH)
            return True
        except sqlite3.Error as e:
            print(f"\n[SQLITE ERROR] Failed to connect to database: {e}\n")
            return False
    return False


def load_conversation_context(conversation_id: int):
    global conversation_context, current_conversation_id, db_connection

    if conversation_id == current_conversation_id and conversation_context:
        return

    try:
        cursor = db_connection.cursor()
        cursor.execute('''
        SELECT sender, type, content, created_at
        FROM messages
        WHERE conversation_id = ? AND deleted_at IS NULL
        ORDER BY created_at DESC
        ''', (conversation_id,))

        messages = cursor.fetchall()
        conversation_context = [
            {
                "sender": msg[0],
                "type": msg[1],
                "content": msg[2],
                "created_at": msg[3]
            }
            for msg in messages
        ]
        current_conversation_id = conversation_id
        print(f"\n[SQLITE] Loaded {len(conversation_context)} messages for conversation {conversation_id}\n")

    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to load conversation context: {str(e)}\n")
        conversation_context = []


def store_message(conversation_id: int, sender: str, msg_type: str, content: str):
    global db_connection, conversation_context, current_conversation_id

    try:
        cursor = db_connection.cursor()
        cursor.execute('''
        INSERT INTO messages (conversation_id, sender, type, content)
        VALUES (?, ?, ?, ?)
        ''', (conversation_id, sender, msg_type, content))

        cursor.execute('''
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', (conversation_id,))

        db_connection.commit()
        print(f"\n[SQLITE] Stored new message for conversation {conversation_id}\n")

        if conversation_id == current_conversation_id:
            conversation_context.insert(0, {
                "sender": sender,
                "type": msg_type,
                "content": content,
                "created_at": datetime.now().isoformat()
            })

    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to store message: {str(e)}\n")


def get_conversation_context() -> List[Dict]:
    return conversation_context
