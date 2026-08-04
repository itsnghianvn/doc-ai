from app.services.embedding_service import EmbeddingService

service = EmbeddingService()

chunks = [
    {
        "id": 1,
        "content": "Artificial Intelligence is transforming healthcare."
    },
    {
        "id": 2,
        "content": "Machine learning improves customer recommendations."
    }
]

results = service.embed_chunks(chunks)

print(len(results))
print(results[0]["id"])
print(len(results[0]["embedding"]))