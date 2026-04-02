import pandas as pd
from uuid import uuid4
from langchain_core.documents import Document
from langchain_chroma import Chroma


def get_vector_counts(vector_store: Chroma):
    try:
        results = vector_store.get()

        if not results or not results.get('metadatas'):
            return {"message": "No documents found in the vector store"}

        metadatas = results['metadatas']
        combination_counts = {}

        for metadata in metadatas:
            key = (
                metadata.get('user_id', ''),
                metadata.get('classroom_id', ''),
                metadata.get('forum_id', ''),
                metadata.get('thread_id', ''),
                metadata.get('user_role_type', ''),
                metadata.get('created_at', 0),
                metadata.get('post_id', ''),
                metadata.get('post_creator_role', '')
            )
            combination_counts[key] = combination_counts.get(key, 0) + 1

        formatted_counts = []
        for key, count in sorted(combination_counts.items(), key=lambda x: x[1], reverse=True):
            formatted_counts.append({
                "user_id": key[0],
                "classroom_id": key[1],
                "forum_id": key[2],
                "thread_id": key[3],
                "user_role_type": key[4],
                "created_at": key[5],
                "post_id": key[6],
                "post_creator_role": key[7],
                "description_count": count
            })

        return {
            "total_unique_combinations": len(combination_counts),
            "combinations": formatted_counts
        }

    except Exception as e:
        return {"error": str(e)}


async def load_posts_from_excel(vector_store: Chroma):
    if vector_store is None:
        return {"error": "Vector store is not initialized."}

    try:
        df = pd.read_excel("posts_data.xlsx")

        required_columns = [
            "user_id", "classroom_id", "forum_id", "thread_id",
            "created_at", "user_role_type", "description", "post_id", "post_creator_role"
        ]
        if not all(col in df.columns for col in required_columns):
            return {"error": f"Excel file must contain columns: {', '.join(required_columns)}"}

        documents = []
        uuids = []
        failed_rows = []

        for idx, row in df.iterrows():
            created_at_unix = int(row["created_at"])

            doc = Document(
                page_content=str(row["description"]),
                metadata={
                    "user_id": str(row["user_id"]),
                    "classroom_id": str(row["classroom_id"]) if pd.notna(row["classroom_id"]) else "",
                    "forum_id": str(row["forum_id"]) if pd.notna(row["forum_id"]) else "",
                    "thread_id": str(row["thread_id"]),
                    "created_at": created_at_unix,
                    "user_role_type": str(row["user_role_type"]) if pd.notna(row["user_role_type"]) else "",
                    "post_id": str(row["post_id"]),
                    "post_creator_role": str(row["post_creator_role"]) if pd.notna(row["post_creator_role"]) else ""
                }
            )
            documents.append(doc)
            uuids.append(str(uuid4()))

        if not documents:
            return {"error": "No valid rows to add. Check 'created_at' formats.", "details": failed_rows}

        max_batch_size = 5461
        for i in range(0, len(documents), max_batch_size):
            batch_documents = documents[i:i + max_batch_size]
            batch_uuids = uuids[i:i + max_batch_size]
            vector_store.add_documents(
                documents=batch_documents,
                ids=batch_uuids
            )

        return {
            "message": f"{len(documents)} posts added successfully.",
            "skipped_rows": failed_rows if failed_rows else "None"
        }

    except FileNotFoundError:
        return {"error": "posts_data.xlsx file not found."}
    except Exception as e:
        return {"error": str(e)}


async def edit_vector_data(data: dict, vector_store: Chroma):
    try:
        required_fields = [
            "user_id", "classroom_id", "forum_id", "thread_id",
            "created_at", "user_role_type", "post_id", "new_description", "post_creator_role"
        ]

        if not all(field in data for field in required_fields):
            return {"error": f"Missing required fields. Required fields: {', '.join(required_fields)}"}

        metadata_filter = {
            "$and": [
                {"user_id": {"$eq": str(data["user_id"])}},
                {"classroom_id": {"$eq": str(data["classroom_id"]) if data["classroom_id"] else ""}},
                {"forum_id": {"$eq": str(data["forum_id"]) if data["forum_id"] else ""}},
                {"thread_id": {"$eq": str(data["thread_id"])}},
                {"created_at": {"$eq": int(data["created_at"])}},
                {"user_role_type": {"$eq": str(data["user_role_type"]) if data["user_role_type"] else ""}},
                {"post_id": {"$eq": str(data["post_id"])}},
                {"post_creator_role": {"$eq": str(data["post_creator_role"]) if data["post_creator_role"] else ""}}
            ]
        }

        results = vector_store.get(where=metadata_filter)

        if not results or not results.get('ids') or len(results['ids']) == 0:
            return {"error": "No matching documents found with the provided metadata"}

        updated_docs = []
        updated_ids = []

        for i, old_id in enumerate(results['ids']):
            doc = Document(
                page_content=str(data["new_description"]),
                metadata={
                    "user_id": str(data["user_id"]),
                    "classroom_id": str(data["classroom_id"]) if data["classroom_id"] else "",
                    "forum_id": str(data["forum_id"]) if data["forum_id"] else "",
                    "thread_id": str(data["thread_id"]),
                    "created_at": int(data["created_at"]),
                    "user_role_type": str(data["user_role_type"]) if data["user_role_type"] else "",
                    "post_id": str(data["post_id"]),
                    "post_creator_role": str(data["post_creator_role"]) if data["post_creator_role"] else ""
                }
            )
            updated_docs.append(doc)
            updated_ids.append(old_id)

        vector_store.delete(ids=updated_ids)
        vector_store.add_documents(
            documents=updated_docs,
            ids=updated_ids
        )

        return {
            "message": f"Successfully updated {len(updated_ids)} documents",
            "updated_ids": updated_ids
        }

    except Exception as e:
        return {"error": str(e)}


def simple_chat(llm):
    try:
        response = llm.invoke("Hello, how are you?")
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}
