import os
import unittest


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.db.database import Base, SessionLocal, engine, init_db
from app.services.document_service import (
    delete_document,
    get_document,
    get_document_by_filename,
    get_documents,
    save_document,
)


class DocumentServiceTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        init_db()
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_document_crud_uses_relational_store(self):
        saved = save_document(
            self.db,
            {
                "document_id": "document-123",
                "filename": "guide.pdf",
                "pages": 2,
                "characters": 1000,
                "chunk_count": 3,
                "preview": "A useful guide.",
            },
        )

        self.assertEqual(saved["status"], "ready")
        self.assertEqual(
            get_document(self.db, "document-123")["filename"],
            "guide.pdf",
        )
        self.assertEqual(
            get_document_by_filename(
                self.db,
                "guide.pdf",
            )["document_id"],
            "document-123",
        )
        self.assertEqual(len(get_documents(self.db)), 1)

        self.assertTrue(
            delete_document(self.db, "document-123")
        )
        self.assertIsNone(
            get_document(self.db, "document-123")
        )


if __name__ == "__main__":
    unittest.main()
