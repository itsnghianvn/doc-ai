from google import genai

from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def embed(self, text: str) -> list[float]:
        response = self.client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
        )

        return response.embeddings[0].values

    def embed_chunks(self, chunks: list[dict]) -> list[dict]:
        embedded_chunks = []

        for chunk in chunks:
            embedding = self.embed(chunk["content"])

            embedded_chunks.append({
                **chunk,
                "embedding": embedding,
            })

        return embedded_chunks