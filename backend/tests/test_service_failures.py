import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from qdrant_client.http.exceptions import ResponseHandlingException
from sqlalchemy.exc import OperationalError


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.main import app


class ServiceFailureTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch(
        "app.api.routes.documents.get_documents",
        side_effect=OperationalError(
            "SELECT documents",
            {},
            ConnectionError("database unavailable"),
        ),
    )
    def test_database_failure_returns_service_unavailable(self, _):
        response = self.client.get(
            "/documents/",
            headers={"Origin": "http://localhost:3000"},
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn(
            "database",
            response.json()["detail"].lower(),
        )
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://localhost:3000",
        )

    @patch(
        "app.api.routes.documents.delete_document_chunks",
        side_effect=ResponseHandlingException(
            ConnectionError("qdrant unavailable")
        ),
    )
    @patch(
        "app.api.routes.documents.get_document_for_update",
        return_value={
            "document_id": "document-123",
            "filename": "document.pdf",
        },
    )
    def test_qdrant_failure_returns_service_unavailable(
        self,
        _,
        __,
    ):
        response = self.client.delete(
            "/documents/document-123"
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn(
            "search",
            response.json()["detail"].lower(),
        )


if __name__ == "__main__":
    unittest.main()
