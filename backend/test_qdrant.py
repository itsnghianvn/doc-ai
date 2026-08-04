from pathlib import Path

from app.services.pdf_service import save_pdf
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import (
    create_collection,
    upsert_chunks,
    client,
)

# 1. Create collection
create_collection()

# 2. Read PDF file
result = save_pdf(Path("uploads/AI_essay_400_words.pdf"))

# 3. Get chunks
chunks = result["chunks"]

print(f"Chunks: {len(chunks)}")

# 4. Create embedding
embedding_service = EmbeddingService()
embedded_chunks = embedding_service.embed_chunks(chunks)

print("Embedding completed.")

# 5. Save in Qdrant
upsert_chunks(embedded_chunks)

# 6. Check collection
info = client.get_collection("documents")

print(f"Points in collection: {info.points_count}")