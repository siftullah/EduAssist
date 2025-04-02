from typing import List, Dict

def format_conversation_history(messages: List[Dict]) -> str:
    if not messages:
        return "No previous messages"
        
    formatted_messages = []
    for msg in messages:
        sender = "User" if msg["sender"] == "human" else "Assistant"
        formatted_messages.append(f"{sender} ({msg['type']}): {msg['content']}")
    
    return "\n".join(formatted_messages) 