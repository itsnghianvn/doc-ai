from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.qdrant_service import search_chunks
from app.services.query_rewrite_service import QueryRewriteService

class RAGService:

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.llm_service = LLMService()
        self.query_rewrite_service = QueryRewriteService()

    def build_context(self, chunks: list) -> str:
        return "\n\n".join(
            chunk.payload["content"]
            for chunk in chunks
        )

    def ask(
        self, 
        question: str, 
        document_id: str,
        history: list[dict] | None = None,
        ):

        
        rewritten_question = self.query_rewrite_service.rewrite(
            question=question,
            history=history,
        )

        query_embedding = self.embedding_service.embed(
            rewritten_question
        )

        search_results = search_chunks(query_embedding, document_id)
        if not search_results:
            return {
                "answer": "I don't know based on the provided document.",
                "sources": [],
            }

        context = self.build_context(search_results)

        answer = self.llm_service.generate_answer(
            question=question,
            context=context,
            history=history,
        )

        sources = [
            {
                "chunk_id": str(chunk.id),
                "score": chunk.score,
                "content": chunk.payload["content"],
                "start": chunk.payload["start"],
                "end": chunk.payload["end"],
                "page_start": chunk.payload.get("page_start"),
                "page_end": chunk.payload.get("page_end"),
            }
            for chunk in search_results
        ]

        return {
            "answer": answer,
            "sources": sources,
        }