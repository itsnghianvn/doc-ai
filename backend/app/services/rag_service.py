from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.qdrant_service import search_chunks


class RAGService:

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.llm_service = LLMService()
    
    def build_context(self, chunks: list) -> str:
        return "\n\n".join(
            chunk.payload["content"]
            for chunk in chunks
        )

    def ask(self, question: str) -> str:

        query_embedding = self.embedding_service.embed(question)

        search_results = search_chunks(query_embedding)

        context = self.build_context(search_results)

        answer = self.llm_service.generate_answer(
            question=question,
            context=context,
        )

        return answer