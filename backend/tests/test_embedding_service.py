import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock


os.environ.setdefault("GEMINI_API_KEY", "test-key")

from app.services.embedding_service import EmbeddingService


class EmbeddingServiceTests(unittest.TestCase):
    def test_embeds_chunks_in_one_batch(self):
        service = object.__new__(EmbeddingService)
        embed_content = Mock(
            return_value=SimpleNamespace(
                embeddings=[
                    SimpleNamespace(values=[0.1, 0.2]),
                    SimpleNamespace(values=[0.3, 0.4]),
                ]
            )
        )
        service.client = SimpleNamespace(
            models=SimpleNamespace(
                embed_content=embed_content
            )
        )
        chunks = [
            {"content": "first", "chunk_index": 0},
            {"content": "second", "chunk_index": 1},
        ]

        embedded = service.embed_chunks(chunks)

        self.assertEqual(
            [chunk["embedding"] for chunk in embedded],
            [[0.1, 0.2], [0.3, 0.4]],
        )
        embed_content.assert_called_once()
        self.assertEqual(
            embed_content.call_args.kwargs["contents"],
            ["first", "second"],
        )


if __name__ == "__main__":
    unittest.main()
