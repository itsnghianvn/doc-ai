import os
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.main import app


class UploadApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        Path("uploads/valid.pdf").unlink(missing_ok=True)

    @patch(
        "app.api.routes.upload.get_document_by_filename",
        return_value=None,
    )
    def test_rejects_file_with_invalid_pdf_signature(self, _):
        response = self.client.post(
            "/upload/",
            files={
                "file": (
                    "not-a-pdf.pdf",
                    b"plain text",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "The uploaded file is not a valid PDF.",
        )

    @patch(
        "app.api.routes.upload.get_document_by_filename",
        return_value=None,
    )
    def test_rejects_oversized_pdf(self, _):
        with patch(
            "app.api.routes.upload.MAX_PDF_SIZE_BYTES",
            5,
        ):
            response = self.client.post(
                "/upload/",
                files={
                    "file": (
                        "large.pdf",
                        b"%PDF-1.7",
                        "application/pdf",
                    )
                },
            )

        self.assertEqual(response.status_code, 413)

    @patch(
        "app.api.routes.upload.get_document_by_filename",
        return_value={"filename": "duplicate.pdf"},
    )
    def test_rejects_duplicate_filename(self, _):
        response = self.client.post(
            "/upload/",
            files={
                "file": (
                    "duplicate.pdf",
                    b"%PDF-1.7",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json()["detail"],
            "A document with this filename already exists.",
        )

    @patch("app.api.routes.upload.process_document")
    @patch(
        "app.api.routes.upload.save_document",
        return_value={
            "document_id": "document-123",
            "filename": "valid.pdf",
            "pages": 0,
            "characters": 0,
            "chunk_count": 0,
            "preview": "",
            "status": "processing",
            "error_message": None,
            "created_at": datetime.now(timezone.utc),
        },
    )
    @patch(
        "app.api.routes.upload.get_document_by_filename",
        return_value=None,
    )
    def test_accepts_pdf_and_returns_processing(
        self,
        _,
        __,
        process_document,
    ):
        response = self.client.post(
            "/upload/",
            files={
                "file": (
                    "valid.pdf",
                    b"%PDF-1.7",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(
            response.json()["status"],
            "processing",
        )
        process_document.assert_called_once()


if __name__ == "__main__":
    unittest.main()
