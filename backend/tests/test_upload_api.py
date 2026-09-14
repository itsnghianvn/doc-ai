import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient


os.environ.setdefault("GEMINI_API_KEY", "test-key")

from app.main import app


class UploadApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch(
        "app.api.routes.upload.get_documents",
        return_value=[],
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
        "app.api.routes.upload.get_documents",
        return_value=[],
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
        "app.api.routes.upload.get_documents",
        return_value=[{"filename": "duplicate.pdf"}],
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


if __name__ == "__main__":
    unittest.main()
