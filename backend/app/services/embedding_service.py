from google import genai

from app.core.config import settings


EMBEDDING_BATCH_SIZE = 100


class EmbeddingService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def embed(self, text: str) -> list[float]:
        response = self.client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=text,
        )

        return response.embeddings[0].values

    def embed_chunks(self, chunks: list[dict]) -> list[dict]:
        embedded_chunks = []

        for batch_start in range(
            0,
            len(chunks),
            EMBEDDING_BATCH_SIZE,
        ):
            batch = chunks[
                batch_start:batch_start + EMBEDDING_BATCH_SIZE
            ]
            response = self.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=[chunk["content"] for chunk in batch],
            )

            if len(response.embeddings) != len(batch):
                raise RuntimeError(
                    "Gemini returned an unexpected number of embeddings."
                )

            embedded_chunks.extend(
                {
                    **chunk,
                    "embedding": embedding.values,
                }
                for chunk, embedding in zip(
                    batch,
                    response.embeddings,
                    strict=True,
                )
            )

        return embedded_chunks