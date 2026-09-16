import logging

from google.genai.errors import APIError

from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.qdrant_service import search_chunks
from app.services.query_rewrite_service import QueryRewriteService
from app.services.reranking_service import RankedChunk, RerankingService


logger = logging.getLogger(__name__)

class RAGService:

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.llm_service = LLMService()
        self.query_rewrite_service = QueryRewriteService()
        self.reranking_service = RerankingService()

    def build_context(self, chunks: list[RankedChunk]) -> str:
        return "\n\n".join(
            (
                f"[Source {index}"
                f" | Page {item.chunk.payload.get('page_start', 'unknown')}]\n"
                f"{item.chunk.payload['content']}"
            )
            for index, item in enumerate(chunks, start=1)
        )

    def ask(
        self, 
        question: str, 
        document_id: str,
        history: list[dict] | None = None,
        ):

        
        try:
            rewritten_question = (
                self.query_rewrite_service.rewrite(
                    question=question,
                    history=history,
                )
            )
        except APIError:
            logger.warning(
                "Query rewriting failed; using original question.",
                exc_info=True,
            )
            rewritten_question = question

        query_embedding = self.embedding_service.embed(
            rewritten_question
        )

        search_results = search_chunks(
            query_embedding,
            document_id,
            limit=settings.RAG_RETRIEVAL_TOP_N,
            score_threshold=settings.RAG_RETRIEVAL_SCORE_THRESHOLD,
        )
        if not search_results:
            return {
                "answer": "I don't know based on the provided document.",
                "sources": [],
            }

        try:
            ranked_chunks = self.reranking_service.rerank(
                rewritten_question,
                search_results,
            )
        except Exception:
            logger.warning(
                "Reranking failed; using vector search order.",
                exc_info=True,
            )
            ranked_chunks = self.reranking_service.fallback(
                search_results
            )

        if not ranked_chunks:
            return {
                "answer": "I don't know based on the provided document.",
                "sources": [],
            }

        context = self.build_context(ranked_chunks)

        answer = self.llm_service.generate_answer(
            question=question,
            context=context,
            history=history,
        )

        sources = [
            {
                "chunk_id": str(ranked.chunk.id),
                "document_id": ranked.chunk.payload["document_id"],
                "chunk_index": ranked.chunk.payload.get("chunk_index"),
                "score": ranked.score,
                "retrieval_score": ranked.retrieval_score,
                "rerank_score": ranked.rerank_score,
                "content": ranked.chunk.payload["content"],
                "start": ranked.chunk.payload["start"],
                "end": ranked.chunk.payload["end"],
                "page_start": ranked.chunk.payload.get("page_start"),
                "page_end": ranked.chunk.payload.get("page_end"),
            }
            for ranked in ranked_chunks
            if ranked.score >= settings.RAG_RERANK_MIN_SCORE
        ]

        return {
            "answer": answer,
            "sources": sources,
        }