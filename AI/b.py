from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from contextlib import asynccontextmanager
import chromadb
import os
from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import json
import requests
import sqlite3
from sqlite3 import Error
import tempfile
import shutil

if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = ""

SQLITE_DB_PATH = "conversations.db"
current_conversation_id = None
conversation_context = []
db_connection = None

def init_sqlite_db():
    global db_connection
    
    # Create database connection
    if not os.path.exists(SQLITE_DB_PATH):
        try:
            db_connection = sqlite3.connect(SQLITE_DB_PATH)
            cursor = db_connection.cursor()
            
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
                type TEXT CHECK(type IN ('normal_qa', 'rag_qa', 'reminder')) NOT NULL,
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

def load_conversation_context(conversation_id: int):
    global conversation_context, current_conversation_id, db_connection
    
    if conversation_id == current_conversation_id and conversation_context:
        return  # Context already loaded
        
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
    global db_connection

    try:
        cursor = db_connection.cursor()
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
        
        db_connection.commit()
        print(f"\n[SQLITE] Stored new message for conversation {conversation_id}\n")
        
        # Update local context
        if conversation_id == current_conversation_id:
            conversation_context.insert(0, {
                "sender": sender,
                "type": msg_type,
                "content": content,
                "created_at": datetime.now().isoformat()
            })
            
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to store message: {str(e)}\n")

SQLITE_DB_PATH = "conversations.db"

# System prompts
OPTION_SELECTOR_PROMPT = """You are an AI assistant for an educational platform. Based on the user's query, determine which type of assistance is needed:

1. Normal QA - For general questions and assistance
2. Discussions QA - For queries about past discussions or requiring context from previous posts
3. Setup Reminder/Notification - For setting up reminders or notifications

If query is something like "what was my previous conversation/queries with you", then it is usually 1.

If the query is something like "did my teacher announce any quiz?", then it is usually 2.

If the query is something like "summarize the discussions of yesterday", then it is usually 2.

My Previous Conversation with you (from newest to oldest):
{conversation_history}

Keep in mind the previous conversations while giving response

User Role: {user_role}
Current Query: {query}

Return ONLY the number (1, 2, or 3) that best matches the type of assistance needed. No other text."""

NORMAL_QA_PROMPT = """You are an educational assistant helping users in an educational platform. The user making this query has the role of {user_role}.

My Previous Conversations with you (from newest to oldest):
{conversation_history}

Keep in mind the previous conversations while giving response

If query is something like "what was my previous conversation/queries with you", then usually you should summarize my previous conversations with you

For faculty members:
- Provide guidance on teaching, course management, and student interaction
- Help with administrative tasks and platform features
- Offer suggestions for effective teaching methods

For students:
- Help with academic queries, study methods, and course-related questions
- Guide them on using platform features and submitting assignments
- Provide information about deadlines and course requirements

For administrators:
- Assist with platform management and system-related queries
- Help with user management and access control
- Provide guidance on administrative features

Provide helpful, accurate, and concise responses to their questions.
If the query involves sensitive information or actions that should be handled by administrators, politely redirect them.

Current Query: {query}

Provide your response:"""

RAG_QUERY_PROMPT = """You are an AI assistant helping to process discussion-related queries in an educational platform. Your task is to generate an efficient search query and determine appropriate metadata filters based on the user's query.

My Previous Conversation with you (from newest to oldest):
{conversation_history}

Keep in mind the previous conversations while giving response

Current URL: {current_url}
User Role: {user_role}
Current DateTime: {current_datetime}
Current Query: {query}

VECTOR STORE INFORMATION:
The vector store contains discussion posts where:
- Post content is embedded (text only)
- Each post has specific metadata fields for filtering

METADATA FIELDS:
1. classroom_id (nullable):
   - Only include if query specifically mentions or implies classroom context
   - Use "not_null" if query is about any classroom
   - Use specific ID if extracted from URL

2. forum_id (nullable):
   - Only include if query specifically mentions or implies forum context
   - Use "not_null" if query is about any forum
   - Use specific ID if extracted from URL

3. thread_id (non-nullable):
   - Only include if query is about a specific thread
   - Use specific ID if extracted from URL

4. created_at:
   - Only include for time-based queries
   - Use ISO timestamp range (e.g., "2024-03-20T00:00:00Z")
   - For "today": Use current date with time range 00:00:00Z to 23:59:59Z
   - For "yesterday": Use previous date with time range 00:00:00Z to 23:59:59Z
   - For "this week": Use last 7 days
   - For "last week": Use 7-14 days ago

5. user_role_type (nullable):
   - Only include if query specifically requires role-based filtering:
     * For students: Only include when query mentions "as TA" or similar
     * For faculty: Include when query is about their classrooms
   - Don't include for general queries

6. post_creator_role (non-nullable):
   - Only include if query specifically mentions posts from certain roles
   - Values: 'admin', 'faculty', or 'student'
   - Always include for queries about teacher/faculty announcements

COMMON QUERY PATTERNS:

For Students:
1. Quiz/Exam Related:
   "Have my teachers announced any quiz?"
   → Response:
   {{
       "search_query": "quiz test exam announcement schedule assessment",
       "filters": {{
           "classroom_id": "not_null",
           "post_creator_role": "faculty"
       }}
   }}

   "Have my teachers announced any quiz yesterday?"
   → Response:
   {{
       "search_query": "quiz test exam announcement schedule assessment",
       "filters": {{
           "classroom_id": "not_null",
           "post_creator_role": "faculty",
           "created_at": {{
               "start": "2024-03-20T00:00:00Z",
               "end": "2024-03-20T23:59:59Z"
           }}
       }}
   }}f

   "Any quiz announcements this week?"
   → Response:
   {{
       "search_query": "quiz test exam announcement schedule assessment",
       "filters": {{
           "classroom_id": "not_null",
           "post_creator_role": "faculty",
           "created_at": {{
               "start": "2024-03-14T00:00:00Z",
               "end": "2024-03-21T23:59:59Z"
           }}
       }}
   }}

2. Time-based queries:
   "Summarize important discussions of today"
   → Response:
   {{
       "search_query": "important discussions highlights key points",
       "filters": {{
           "created_at": {{
               "start": "2024-03-21T00:00:00Z",
               "end": "2024-03-21T23:59:59Z"
           }}
       }}
   }}

   "Summarize important discussions of previous week"
   → Response:
   {{
       "search_query": "important discussions highlights key points",
       "filters": {{
           "created_at": {{
               "start": "2024-03-14T00:00:00Z",
               "end": "2024-03-20T23:59:59Z"
           }}
       }}
   }}

3. Classroom queries:
   "Important stuff in my classrooms"
   → Response:
   {{
       "search_query": "important announcements updates key information",
       "filters": {{
           "classroom_id": "not_null"
       }}
   }}

   "Important stuff in classrooms where I am TA"
   → Response:
   {{
       "search_query": "important announcements updates key information",
       "filters": {{
           "classroom_id": "not_null",
           "user_role_type": "TA"
       }}
   }}

For Faculty:
1. Time-based queries (similar format as students)

2. Classroom queries:
   "Important stuff in my classrooms"
   → Response:
   {{
       "search_query": "important student discussions questions updates",
       "filters": {{
           "classroom_id": "not_null",
           "user_role_type": "faculty"
       }}
   }}

   "Important queries from students"
   → Response:
   {{
       "search_query": "student questions concerns important discussions",
       "filters": {{
           "classroom_id": "not_null",
           "user_role_type": "faculty",
           "post_creator_role": "student"
       }}
   }}

URL-based queries (for both roles):
"Summarize discussions of this classroom"
With URL: /faculty/classes/abc-123 or /student/classes/abc-123
→ Response:
{{
    "search_query": "discussions summary highlights key points",
    "filters": {{
        "classroom_id": "abc-123"
    }}
}}

"Summarize discussions of this forum"
With URL: /faculty/forums/xyz-789
→ Response:
{{
    "search_query": "discussions summary highlights key points",
    "filters": {{
        "forum_id": "xyz-789"
    }}
}}

"Summarize discussion of this thread"
With URL: /faculty/discussions/def-456
→ Response:
{{
    "search_query": "discussion summary key points",
    "filters": {{
        "thread_id": "def-456"
    }}
}}

URL PATTERNS AND EXTRACTION:
1. Forums: /[faculty|student]/forums/{{forum_id}}
   → Extract forum_id for filtering

2. Discussions: /[faculty|student]/discussions/{{thread_id}}
   → Extract thread_id for filtering

3. Announcements: /[faculty|student]/announcements/{{thread_id}}
   → Extract thread_id for filtering

4. Classroom Thread: /[faculty|student]/classes/{{classroom_id}}/{{thread_id}}
   → Extract both classroom_id and thread_id for filtering

5. Classroom: /[faculty|student]/classes/{{classroom_id}}
   → Extract classroom_id for filtering

IMPORTANT RULES:
1. For time-based queries, ALWAYS provide ISO format dates
2. For URL-based queries, ALWAYS extract and use the appropriate ID
3. DO NOT include filters unless specifically needed
4. For general queries without specific context, use NO filters
5. Generate optimized search queries with relevant keywords
6. For quiz/exam related queries:
   - ALWAYS include classroom_id: "not_null"
   - ALWAYS include post_creator_role: "faculty"
   - Include created_at if time is specified
7. RETURN ONLY THE JSON OBJECT - NO EXPLANATIONS OR MARKDOWN

Based on the provided query, user role, and current URL, generate ONLY a JSON response that will optimize the search results:"""

RAG_RESPONSE_PROMPT = """You are an educational assistant helping with discussion-related queries in an educational platform. Your task is to first analyze the user's query and then carefully review the provided discussion posts.

My Previous Conversations with you (from newest to oldest):
{conversation_history}

Keep in mind the previous conversations while giving response

User Role: {user_role}
Current Query: {query}

TASK:
1. First, carefully analyze the user's query to understand what information they are looking for

2. Then, review the provided discussion posts (labeled as "Post X:") and determine if they are relevant to answering the query

3. If the posts ARE relevant:
   - Extract and summarize the key information that addresses the query
   - Present the information in a natural, conversational way
   - Focus on the most pertinent details
   - Make connections between related points
   - Add helpful context where appropriate

4. If the posts are NOT relevant:
   - Politely explain that the available posts don't contain information relevant to their query
   - Suggest what kind of information might be more helpful
   - DO NOT make up or invent information that isn't in the posts

RESPONSE STYLE:
- Be friendly and conversational
- Use natural transitions (e.g., "I noticed that...", "Interestingly...")
- Skip unnecessary details like timestamps unless relevant
- Only mention roles when they provide important context
- End with an invitation for follow-up questions
- Don't say stuff like provided posts etc etc. Rather talk like a human.

if query is about summarizing then,

Review the provided discussion posts and summarize them in a natural, engaging way. Each post is labeled with "Post X:" and includes content and metadata.

GUIDELINES:
1. Be Conversational:
   - Write as if you're having a friendly chat
   - Avoid overly formal structures or bullet points
   - Use natural transitions between topics
   - Feel free to express enthusiasm when appropriate

2. Keep it Flowing:
   - Start with a friendly opener
   - Connect related ideas naturally
   - Use phrases like "I noticed", "Interestingly", "By the way"
   - Wrap up with an inviting conclusion

3. Focus on What Matters:
   - Highlight interesting points without being too rigid
   - Don't list every detail - focus on what's most relevant
   - Skip timestamps unless they're crucial to the query
   - Mention roles only when they add important context

4. Make it Engaging:
   - Share insights and connections you notice
   - Point out interesting patterns or themes
   - Add helpful context when relevant
   - End with an invitation for further discussion

Context:
{context}

Remember: Only discuss information that is actually present in the posts. Do not invent or assume details that aren't there."""

REMINDER_PROMPT = """You are an assistant helping to set up reminders and notifications.
Parse the user's request and create a structured reminder AND a human-friendly response.

My Previous Conversation with you (from newest to oldest):
{conversation_history}

Keep in mind the previous conversations while giving response

You MUST return a valid JSON object with the following structure:
{{{{
    "reminder": {{{{
        "title": "Brief description",
        "description": "Detailed description",
        "due_date": "ISO datetime",
        "user_id": "user ID"
    }}}},
    "human_response": "A friendly message confirming the reminder details in natural language. Example: I've set up a reminder for your quiz on March 21st at 2:30 PM. I'll notify you about it!"
}}}}

User Role: {user_role}
User ID: {user_id}
Current DateTime: {current_datetime}
Current Query: {query}

Return ONLY the JSON object:"""

def format_conversation_history(messages: List[Dict]) -> str:
    if not messages:
        return "No previous messages"
        
    formatted_messages = []
    for msg in messages:
        sender = "User" if msg["sender"] == "human" else "Assistant"
        formatted_messages.append(f"{sender} ({msg['type']}): {msg['content']}")
    
    return "\n".join(formatted_messages)

llm = ChatOpenAI(model="gpt-4o")
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vector_store = None

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store, embeddings, db_connection

    # Initialize SQLite database
    if os.path.exists(SQLITE_DB_PATH):
        try:
            db_connection = sqlite3.connect(SQLITE_DB_PATH)
        except sqlite3.Error as e:
            print(f"\n[SQLITE ERROR] Failed to connect to database: {e}\n")
            raise Exception("Failed to initialize SQLite database")

    # Initialize vector store
    chromadb_client = chromadb.PersistentClient(path="./fypdb")
    chromadb_client.get_or_create_collection("discussion_posts")

    vector_store = Chroma(
        client=chromadb_client,
        collection_name="discussion_posts",
        embedding_function=embeddings,
    )

    yield

    # Close database connection
    if db_connection:
        db_connection.close()

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/initialize_db")
async def initialize_database():
    if os.path.exists(SQLITE_DB_PATH):
        return {"message": "Database already exists"}
    
    if init_sqlite_db():
        return {"message": "Database initialized successfully"}
    else:
        return {"error": "Failed to initialize database"}

def determine_option(query: str, user_role: str, conversation_id: int) -> int:
    # Format conversation history
    conversation_history = format_conversation_history(conversation_context)
    
    prompt = ChatPromptTemplate.from_template(OPTION_SELECTOR_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "conversation_history": conversation_history
    })
    option = int(result.content.strip())
    print(f"\n[OPTION SELECTION] Query: '{query}', Option: {option}\n")
    return option

def handle_normal_qa(query: str, user_role: str, conversation_id: int) -> str:
    print(f"\n[NORMAL QA] Query: '{query}', User Role: {user_role}\n")
    
    # Format conversation history
    conversation_history = format_conversation_history(conversation_context)
    
    prompt = ChatPromptTemplate.from_template(NORMAL_QA_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "conversation_history": conversation_history
    })
    
    response = result.content.strip()
    print(f"\n[NORMAL QA RESPONSE] {response[:200]}...\n")
    
    # Store messages
    store_message(conversation_id, "human", "normal_qa", query)
    store_message(conversation_id, "chatbot", "normal_qa", response)
    
    return response

def handle_rag_qa(query: str, user_role: str, user_id: str, current_url: str, conversation_id: int) -> str:
    print(f"\n[RAG PIPELINE START] Query: '{query}', User: {user_id}, Role: {user_role}, URL: {current_url}\n")
    
    # Add current datetime to the context
    current_time = datetime.now()
    
    # Format conversation history
    conversation_history = format_conversation_history(conversation_context)
    
    # First, get the search parameters from LLM
    prompt = ChatPromptTemplate.from_template(RAG_QUERY_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "current_url": current_url,
        "current_datetime": current_time.isoformat(),
        "conversation_history": conversation_history
    })
    
    print(f"\n[RAG QUERY PARAMETERS] LLM Response:\n{result.content}\n")
    
    try:
        # Clean the response to ensure it's valid JSON
        response_text = result.content.strip()
        # Remove any markdown code block markers if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        search_params = json.loads(response_text)
        print(f"\n[RAG PARSED PARAMETERS] {json.dumps(search_params, indent=2)}\n")
        
        if "search_query" not in search_params:
            print("\n[RAG ERROR] No search query in LLM response, using original query\n")
            search_params["search_query"] = query
            
        if "filters" not in search_params:
            print("\n[RAG ERROR] No filters in LLM response, using default filters\n")
            search_params["filters"] = {}
            
    except json.JSONDecodeError as e:
        print(f"\n[RAG JSON ERROR] Could not parse LLM response: {e}\n")
        # If JSON parsing fails, fall back to simple search
        search_params = {
            "search_query": query,
            "filters": {}
        }
    
    # Build the search filter
    filter_conditions = []
    
    # Always add user_id filter
    filter_conditions.append({"user_id": {"$eq": user_id}})
    
    # Add filters from search_params
    if "filters" in search_params:
        for key, value in search_params["filters"].items():
            if key == "created_at":
                # Handle date range filtering - split into separate conditions using string comparison
                if isinstance(value, dict):
                    if value.get("start"):
                        iso_str = value["start"].replace('Z', '+05:00')
                        start_unix = int(datetime.fromisoformat(iso_str).timestamp())
                        filter_conditions.append({"created_at": {"$gte": start_unix}})
                    if value.get("end"):
                        iso_str = value["end"].replace('Z', '+05:00')
                        end_unix = int(datetime.fromisoformat(iso_str).timestamp())
                        filter_conditions.append({"created_at": {"$lte": end_unix}})
            elif key != "user_id":  # Skip user_id as it's already in the filter
                if isinstance(value, str) and value.lower() == "not_null":
                    filter_conditions.append({key: {"$ne": ""}})
                elif isinstance(value, str) and value.lower() == "null":
                    filter_conditions.append({key: {"$eq": ""}})
                else:
                    filter_conditions.append({key: {"$eq": value}})
    
    # Only use $and if we have multiple conditions
    search_filter = filter_conditions[0] if len(filter_conditions) == 1 else {"$and": filter_conditions}
    
    print(f"\n[RAG SEARCH FILTER] {json.dumps(search_filter, indent=2)}\n")
    
    # Use the search query from parameters or fall back to original query
    search_query = search_params.get("search_query", query)
    print(f"\n[RAG SEARCH QUERY] '{search_query}'\n")
    
    try:
        # Perform the search with error handling
        results = vector_store.similarity_search(
            search_query,
            k=15,  # Increased to 15 as per requirements
            filter=search_filter
        )
        
        print(f"\n[RAG RESULTS] Found {len(results)} results\n")
        if results:
            for i, doc in enumerate(results):
                print(f"Result {i+1}:\nContent: {doc.page_content[:200]}...\nMetadata: {doc.metadata}\n")
        
        if not results:
            print("\n[RAG INFO] No results found\n")
            return "I couldn't find any quiz announcements from teachers yesterday."
        
        # Format context with post numbers and metadata
        context = "\n\n".join([
            f"Post {i+1}:\n{doc.page_content}\nMetadata: {doc.metadata}"
            for i, doc in enumerate(results)
        ])
        
        # Get final response from LLM with conversation context
        prompt = ChatPromptTemplate.from_template(RAG_RESPONSE_PROMPT)
        chain = prompt | llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "context": context,
            "conversation_history": conversation_history
        })
        
        response = result.content.strip()
        print(f"\n[RAG FINAL RESPONSE] {response[:200]}...\n")
        
        # Store messages
        store_message(conversation_id, "human", "rag_qa", query)
        store_message(conversation_id, "chatbot", "rag_qa", response)
        
        return response
        
    except Exception as e:
        print(f"\n[RAG ERROR] Search failed: {str(e)}\n")
        return f"I apologize, but I encountered an error while searching for relevant information. Error: {str(e)}"

def handle_reminder(query: str, user_role: str, user_id: str, conversation_id: int) -> Dict:
    print(f"\n[REMINDER] Query: '{query}', User: {user_id}, Role: {user_role}\n")
    
    current_time = datetime.now().isoformat()
    
    # Format conversation history
    conversation_history = format_conversation_history(conversation_context)
    
    prompt = ChatPromptTemplate.from_template(REMINDER_PROMPT)
    chain = prompt | llm
    result = chain.invoke({
        "query": query,
        "user_role": user_role,
        "user_id": user_id,
        "current_datetime": current_time,
        "conversation_history": conversation_history
    })
    
    print(f"\n[REMINDER LLM RESPONSE] {result.content}\n")
    
    try:
        # Clean the response to ensure it's valid JSON
        response_text = result.content.strip()
        # Remove any markdown code block markers if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        parsed_data = json.loads(response_text)
        print(f"\n[REMINDER PARSED] {json.dumps(parsed_data, indent=2)}\n")
        
        # Make API call to create reminder
        try:
            response = requests.post(
                "http://localhost:3000/api/reminders",
                json=parsed_data["reminder"],
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200 or response.status_code == 201:
                print("\n[REMINDER API] Successfully created reminder\n")
                # Store messages
                store_message(conversation_id, "human", "reminder", query)
                store_message(conversation_id, "chatbot", "reminder", parsed_data["human_response"])
                return {"type": "success", "response": parsed_data["human_response"]}
            else:
                print(f"\n[REMINDER API ERROR] Status code: {response.status_code}\n")
                error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
                store_message(conversation_id, "human", "reminder", query)
                store_message(conversation_id, "chatbot", "reminder", error_msg)
                return {"type": "error", "response": error_msg}
                
        except requests.RequestException as e:
            print(f"\n[REMINDER API ERROR] Failed to make API call: {str(e)}\n")
            error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
            store_message(conversation_id, "human", "reminder", query)
            store_message(conversation_id, "chatbot", "reminder", error_msg)
            return {"type": "error", "response": error_msg}
            
    except json.JSONDecodeError as e:
        print(f"\n[REMINDER JSON ERROR] {e}\n")
        error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
        store_message(conversation_id, "human", "reminder", query)
        store_message(conversation_id, "chatbot", "reminder", error_msg)
        return {"type": "error", "response": error_msg}
    except KeyError as e:
        print(f"\n[REMINDER FORMAT ERROR] Missing required field: {e}\n")
        error_msg = "Sorry, I can't schedule a reminder for you right now. Please try again later."
        store_message(conversation_id, "human", "reminder", query)
        store_message(conversation_id, "chatbot", "reminder", error_msg)
        return {"type": "error", "response": error_msg}

def process_pdf(file_path: str) -> List[Document]:
    # Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    splits = text_splitter.split_documents(documents)
    return splits

def handle_pdf_query(user_id: str, query: str, pdf_chunks: List[Document], user_role: str, conversation_id: int) -> str:
    # Create a temporary vector store for the PDF content
    pdf_vector_store = Chroma(
        collection_name="temp_pdf_collection",
        embedding_function=embeddings,
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
        
        chain = prompt | llm
        result = chain.invoke({
            "query": query,
            "user_role": user_role,
            "context": context,
        })
        
        response = result.content.strip()
        
        # Store messages
        store_message(conversation_id, "human", "pdf_qa", query)
        store_message(conversation_id, "chatbot", "pdf_qa", response)

        pdf_vector_store.delete_collection()
        
        return response
    
    except Exception as e:
        print(f"\n[PDF CHAT ERROR] {str(e)}\n")
        return f"I apologize, but I encountered an error while processing your PDF chat request. Please try again later."

@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"\n[API REQUEST] User: {request.user_id}, Role: {request.user_role}, Query: '{request.query}', URL: {request.current_url}\n")
    
    # Load conversation context
    load_conversation_context(request.conversation_id)
    
    # First determine the type of query
    option = determine_option(request.query, request.user_role, request.conversation_id)
    
    # Handle based on option
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
            request.conversation_id
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
        # Process the file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            shutil.copyfileobj(attachment.file, tmp_file)
            tmp_path = tmp_file.name
        
        try:
            # Process the PDF
            pdf_chunks = process_pdf(tmp_path)
            
            # Load conversation context
            load_conversation_context(conversation_id)
            
            # Handle the query
            response = handle_pdf_query(
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
        print(f"\n[PDF CHAT ERROR] {error_msg}\n")
        return {"type": "error", "response": error_msg}

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
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
        cursor = db_connection.cursor()
        # First mark all messages as deleted
        cursor.execute('''
        delete from messages
        where conversation_id = ?
        ''', (conversation_id,))
        
        # Then delete the conversation
        cursor.execute('''
        delete from conversations
        where id = ?
        ''', (conversation_id,))
        
        db_connection.commit()
        return {"message": "Conversation deleted successfully"}
    except Error as e:
        print(f"\n[SQLITE ERROR] Failed to delete conversation: {str(e)}\n")
        return {"error": "Failed to delete conversation"}