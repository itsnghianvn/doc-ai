import os
import unittest


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.db.database import Base, SessionLocal, engine, init_db
from app.services.conversation_service import (
    create_conversation,
    delete_conversation,
    get_history,
    list_conversations,
    list_messages,
    rename_conversation,
    save_exchange,
)
from app.services.document_service import save_document


class ConversationServiceTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        init_db()
        self.db = SessionLocal()
        save_document(
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

    def tearDown(self):
        self.db.close()

    def test_conversation_lifecycle_and_message_history(self):
        conversation = create_conversation(
            self.db,
            "document-123",
        )

        save_exchange(
            self.db,
            conversation["conversation_id"],
            "What is this guide about?",
            "It is a useful guide.",
            [],
        )

        conversations = list_conversations(
            self.db,
            "document-123",
        )
        messages = list_messages(
            self.db,
            conversation["conversation_id"],
        )

        self.assertEqual(len(conversations), 1)
        self.assertEqual(
            conversations[0]["title"],
            "What is this guide about?",
        )
        self.assertEqual(
            [message["role"] for message in messages],
            ["user", "assistant"],
        )
        self.assertEqual(
            get_history(
                self.db,
                conversation["conversation_id"],
            ),
            [
                {
                    "role": "user",
                    "content": "What is this guide about?",
                },
                {
                    "role": "assistant",
                    "content": "It is a useful guide.",
                },
            ],
        )

        renamed = rename_conversation(
            self.db,
            conversation["conversation_id"],
            "Guide overview",
        )
        self.assertEqual(renamed["title"], "Guide overview")

        self.assertTrue(
            delete_conversation(
                self.db,
                conversation["conversation_id"],
            )
        )
        self.assertEqual(
            list_conversations(self.db, "document-123"),
            [],
        )


if __name__ == "__main__":
    unittest.main()
