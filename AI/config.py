import os

# OpenAI API Key
if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = ""

# Database settings
SQLITE_DB_PATH = "conversations.db"

# Vector store settings
VECTOR_STORE_PATH = "./fypdb"
COLLECTION_NAME = "discussion_posts"

# API settings
API_HOST = "localhost"
API_PORT = 3000 