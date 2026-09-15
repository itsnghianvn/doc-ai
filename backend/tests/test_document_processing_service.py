import os
import unittest
from pathlib import Path
from unittest.mock import patch


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.db.database import Base, SessionLocal, engine, init_db
from app.services.document_processing_service import (
    process_document,
)
from app.services.document_service import (
    delete_document,
    get_document,
    save_document,
)


class DocumentProcessingServiceTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        init_db()

        with SessionLocal() as db:
            save_document(
                db,
                {
                    "document_id": "document-123",
                    "filename": "guide.pdf",
                    "pages": 0,
                    "characters": 0,
                    "chunk_count": 0,
                    "preview": "",
                    "status": "processing",
                },
            )

    @patch(
        "app.services.document_processing_service.upsert_chunks"
    )
    @patch(
        "app.services.document_processing_service.create_collection"
    )
    @patch(
        "app.services.document_processing_service.EmbeddingService"
    )
    @patch(
        "app.services.document_processing_service.save_pdf"
    )
    def test_processing_transitions_document_to_ready(
        self,
        save_pdf,
        embedding_service,
        _,
        upsert_chunks,
    ):
        chunks = [{"content": "Document text."}]
        save_pdf.return_value = {
            "pages": 2,
            "characters": 1000,
            "chunk_count": 1,
            "preview": "Document text.",
            "chunks": chunks,
        }
        embedding_service.return_value.embed_chunks.return_value = [
            {**chunks[0], "embedding": [0.1]}
        ]

        process_document(
            "document-123",
            Path("guide.pdf"),
        )

        with SessionLocal() as db:
            document = get_document(db, "document-123")

        self.assertEqual(document["status"], "ready")
        self.assertEqual(document["pages"], 2)
        self.assertIsNone(document["error_message"])
        upsert_chunks.assert_called_once()

    @patch(
        "app.services.document_processing_service.save_pdf",
        side_effect=ValueError("Unreadable PDF"),
    )
    def test_processing_transitions_document_to_failed(self, _):
        with self.assertLogs(
            "app.services.document_processing_service",
            level="ERROR",
        ):
            process_document(
                "document-123",
                Path("guide.pdf"),
            )

        with SessionLocal() as db:
            document = get_document(db, "document-123")

        self.assertEqual(document["status"], "failed")
        self.assertEqual(
            document["error_message"],
            "Unreadable PDF",
        )

    @patch(
        "app.services.document_processing_service.upsert_chunks"
    )
    @patch(
        "app.services.document_processing_service.create_collection"
    )
    @patch(
        "app.services.document_processing_service.EmbeddingService"
    )
    @patch(
        "app.services.document_processing_service.save_pdf"
    )
    def test_deleted_document_is_not_indexed(
        self,
        save_pdf,
        embedding_service,
        create_collection,
        upsert_chunks,
    ):
        chunk = {"content": "Document text."}
        save_pdf.return_value = {
            "pages": 1,
            "characters": 14,
            "chunk_count": 1,
            "preview": "Document text.",
            "chunks": [chunk],
        }

        def delete_during_embedding(_):
            with SessionLocal() as db:
                delete_document(db, "document-123")
            return [{**chunk, "embedding": [0.1]}]

        embedding_service.return_value.embed_chunks.side_effect = (
            delete_during_embedding
        )

        process_document(
            "document-123",
            Path("guide.pdf"),
        )

        create_collection.assert_not_called()
        upsert_chunks.assert_not_called()


if __name__ == "__main__":
    unittest.main()
