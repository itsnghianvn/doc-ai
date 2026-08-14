from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct
import uuid
from qdrant_client.models import PointStruct, VectorParams, Distance

client = QdrantClient(
    host="localhost", 
    port=6333,
)

COLLECTION_NAME = "documents"

def create_collection():
    collections = client.get_collections().collections

    names = [collection.name for collection in collections]

    if COLLECTION_NAME not in names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=3072,
                distance=Distance.COSINE,
            ),
        )

        print(f"Collection '{COLLECTION_NAME}' created.")

    else:
        print(f"Collection '{COLLECTION_NAME}' already exists.")

def upsert_chunks(
    chunks: list[dict],
    document_id: str,
):
    points = []

    for chunk in chunks:
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=chunk["embedding"],
                payload={
                    "document_id": document_id,
                    "content": chunk["content"],
                    "start": chunk["start"],
                    "end": chunk["end"],
                },
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
    )

    print(f"Upserted {len(points)} chunks for document {document_id}.")

def search_chunks(
    query_embedding: list[float],
    document_id: str,
    limit: int = 5,
):
    search_result = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter={
            "must": [
                {
                    "key": "document_id",
                    "match": {
                        "value": document_id,
                    },
                }
            ]
        },
        limit=limit,
    )

    return search_result.points