import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from google.genai.errors import ClientError, ServerError


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.main import app


class ChatApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        document_patcher = patch(
            "app.api.routes.chat.get_document",
            return_value={
                "document_id": "document-123",
                "status": "ready",
            },
        )
        document_patcher.start()
        self.addCleanup(document_patcher.stop)
        self.request = {
            "question": "What is this document about?",
            "document_id": "document-123",
            "history": [],
        }

    @patch(
        "app.api.routes.chat.rag.ask",
        side_effect=ServerError(
            503,
            {
                "error": {
                    "message": "Model is busy.",
                    "status": "UNAVAILABLE",
                }
            },
        ),
    )
    def test_returns_cors_safe_service_unavailable(self, _):
        response = self.client.post(
            "/chat",
            json=self.request,
            headers={"Origin": "http://localhost:3000"},
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            (
                "Gemini is temporarily unavailable. "
                "Please try again shortly."
            ),
        )
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://localhost:3000",
        )

    @patch(
        "app.api.routes.chat.get_document",
        return_value=None,
    )
    def test_rejects_unknown_document(self, _):
        response = self.client.post(
            "/chat",
            json=self.request,
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["detail"],
            "Document not found.",
        )

    @patch(
        "app.api.routes.chat.get_document",
        return_value={
            "document_id": "document-123",
            "status": "processing",
        },
    )
    def test_rejects_document_that_is_still_processing(self, _):
        response = self.client.post(
            "/chat",
            json=self.request,
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json()["detail"],
            "Document is still processing.",
        )

    def test_rejects_blank_question(self):
        response = self.client.post(
            "/chat",
            json={
                **self.request,
                "question": "   ",
            },
        )

        self.assertEqual(response.status_code, 422)

    @patch(
        "app.api.routes.chat.rag.ask",
        side_effect=ClientError(
            429,
            {
                "error": {
                    "message": "Quota exceeded.",
                    "status": "RESOURCE_EXHAUSTED",
                }
            },
        ),
    )
    def test_returns_rate_limit_response(self, _):
        response = self.client.post(
            "/chat",
            json=self.request,
        )

        self.assertEqual(response.status_code, 429)
        self.assertIn(
            "rate limit",
            response.json()["detail"].lower(),
        )


if __name__ == "__main__":
    unittest.main()
