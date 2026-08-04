from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import search_chunks

embedding_service = EmbeddingService()

question = "How is AI used in healthcare?"

query_embedding = embedding_service.embed(question)

results = search_chunks(query_embedding)

for i, point in enumerate(results, start=1):
    print("=" * 50)
    print(f"Result {i}")
    print(f"Score: {point.score:.4f}")
    print(point.payload["content"])