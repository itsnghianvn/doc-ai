import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import fitz
from google.genai.errors import ServerError

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.schemas.chat import Source
from app.core.config import settings
from app.services import qdrant_service
from app.services.pdf_service import save_pdf
from app.services.rag_service import RAGService
from app.services.reranking_service import RankedChunk


class SourcePipelineTests(unittest.TestCase):
    def test_pdf_chunks_keep_page_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "two-pages.pdf"

            with fitz.open() as document:
                for page_number in (1, 2):
                    page = document.new_page()
                    text = (
                        f"Page {page_number} source content. "
                        + f"Unique page {page_number} paragraph. " * 20
                    )
                    page.insert_textbox(
                        fitz.Rect(50, 50, 550, 750),
                        text,
                        fontsize=10,
                    )
                document.save(pdf_path)

            result = save_pdf(pdf_path)
            chunks = result["chunks"]

            self.assertTrue(chunks)
            self.assertTrue(
                all(chunk["page_start"] is not None for chunk in chunks)
            )
            self.assertTrue(
                all(chunk["page_end"] is not None for chunk in chunks)
            )
            self.assertTrue(
                all(
                    chunk["page_start"] == chunk["page_end"]
                    for chunk in chunks
                )
            )
            self.assertTrue(
                all(
                    chunk["document_id"] == result["document_id"]
                    for chunk in chunks
                )
            )
            self.assertEqual(
                [chunk["chunk_index"] for chunk in chunks],
                list(range(len(chunks))),
            )

            covered_pages = {
                page
                for chunk in chunks
                for page in range(
                    chunk["page_start"],
                    chunk["page_end"] + 1,
                )
            }
            self.assertEqual(covered_pages, {1, 2})

    def test_qdrant_payload_keeps_navigation_metadata(self):
        chunks = [
            {
                "chunk_index": 3,
                "content": "A cited passage.",
                "start": 20,
                "end": 36,
                "page_start": 2,
                "page_end": 2,
                "embedding": [0.1, 0.2],
            }
        ]

        with patch.object(qdrant_service.client, "upsert") as upsert:
            qdrant_service.upsert_chunks(chunks, "document-123")

        point = upsert.call_args.kwargs["points"][0]
        self.assertEqual(point.payload["document_id"], "document-123")
        self.assertEqual(point.payload["chunk_index"], 3)
        self.assertEqual(point.payload["page_start"], 2)
        self.assertEqual(point.payload["page_end"], 2)

    def test_rag_sources_match_chunks_used_for_context(self):
        result_chunk = SimpleNamespace(
            id="point-1",
            score=0.91,
            payload={
                "document_id": "document-123",
                "chunk_index": 3,
                "content": "A cited passage.",
                "start": 20,
                "end": 36,
                "page_start": 2,
                "page_end": 2,
            },
        )

        service = object.__new__(RAGService)
        service.query_rewrite_service = SimpleNamespace(
            rewrite=lambda **_: "rewritten question"
        )
        service.embedding_service = SimpleNamespace(
            embed=lambda _: [0.1, 0.2]
        )
        service.reranking_service = SimpleNamespace(
            rerank=lambda *_: [
                RankedChunk(
                    chunk=result_chunk,
                    score=0.88,
                    retrieval_score=0.91,
                    rerank_score=0.86,
                )
            ],
        )
        service.llm_service = SimpleNamespace(
            generate_answer=lambda **_: "Grounded answer."
        )

        with patch(
            "app.services.rag_service.search_chunks",
            return_value=[result_chunk],
        ) as search:
            response = service.ask(
                question="What is on page two?",
                document_id="document-123",
            )

        search.assert_called_once_with(
            [0.1, 0.2],
            "document-123",
            limit=settings.RAG_RETRIEVAL_TOP_N,
            score_threshold=settings.RAG_RETRIEVAL_SCORE_THRESHOLD,
        )
        self.assertEqual(response["answer"], "Grounded answer.")
        self.assertEqual(
            response["sources"],
            [
                {
                    "chunk_id": "point-1",
                    "document_id": "document-123",
                    "chunk_index": 3,
                    "score": 0.88,
                    "retrieval_score": 0.91,
                    "rerank_score": 0.86,
                    "content": "A cited passage.",
                    "start": 20,
                    "end": 36,
                    "page_start": 2,
                    "page_end": 2,
                }
            ],
        )

    def test_rag_falls_back_when_query_rewriting_is_unavailable(
        self,
    ):
        def unavailable_rewrite(**_):
            raise ServerError(
                503,
                {
                    "error": {
                        "message": "Model busy.",
                        "status": "UNAVAILABLE",
                    }
                },
            )

        embedded_queries = []
        service = object.__new__(RAGService)
        service.query_rewrite_service = SimpleNamespace(
            rewrite=unavailable_rewrite
        )
        service.embedding_service = SimpleNamespace(
            embed=lambda query: (
                embedded_queries.append(query) or [0.1]
            )
        )

        with (
            patch(
                "app.services.rag_service.search_chunks",
                return_value=[],
            ),
            self.assertLogs(
                "app.services.rag_service",
                level="WARNING",
            ),
        ):
            response = service.ask(
                question="What about healthcare?",
                document_id="document-123",
                history=[
                    {
                        "role": "user",
                        "content": "Tell me about AI.",
                    }
                ],
            )

        self.assertEqual(
            embedded_queries,
            ["What about healthcare?"],
        )
        self.assertEqual(response["sources"], [])

    def test_source_schema_allows_missing_page_metadata(self):
        source = Source(
            chunk_id="point-1",
            document_id="document-123",
            score=0.8,
            retrieval_score=0.82,
            content="A source without a known page.",
            start=0,
            end=30,
        )

        self.assertIsNone(source.page_start)
        self.assertIsNone(source.page_end)


if __name__ == "__main__":
    unittest.main()
