import os

if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = ""

# Model Configuration
LLM_MODEL = "gpt-4o"
EMBEDDINGS_MODEL = "text-embedding-3-large"

# Database Configuration
SQLITE_DB_PATH = "conversations.db"
CHROMA_DB_PATH = "./fypdb"
CHROMA_COLLECTION_NAME = "discussion_posts"

# API Configuration
REMINDER_API_URL = "http://localhost:3000/api/reminders"
