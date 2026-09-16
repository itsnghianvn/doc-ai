import os
import unittest
from types import SimpleNamespace


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+pysqlite:///:memory:",
)

from app.services.reranking_service import RerankingService


class RerankingServiceTests(unittest.TestCase):
    @staticmethod
    def _chunk(chunk_id: str, score: float, content: str):
        return SimpleNamespace(
            id=chunk_id,
            score=score,
            payload={"content": content},
        )

    def test_rerank_combines_semantic_and_reranker_scores(self):
        service = object.__new__(RerankingService)
        service.client = SimpleNamespace(
            models=SimpleNamespace(
                generate_content=lambda **_: SimpleNamespace(
                    text=(
                        '{"scores": ['
                        '{"index": 0, "score": 0.2},'
                        '{"index": 1, "score": 0.9}'
                        "]}"
                    )
                )
            )
        )
        chunks = [
            self._chunk("first", 0.8, "Loosely related."),
            self._chunk("second", 0.7, "Direct answer."),
        ]

        ranked = service.rerank("What is the answer?", chunks)

        self.assertEqual(
            [item.chunk.id for item in ranked],
            ["second", "first"],
        )
        self.assertAlmostEqual(ranked[0].retrieval_score, 0.7)
        self.assertAlmostEqual(ranked[0].rerank_score, 0.9)
        self.assertGreater(ranked[0].score, ranked[1].score)

    def test_parse_scores_accepts_json_code_fence_and_clamps(self):
        scores = RerankingService._parse_scores(
            '```json\n{"scores": [{"index": 2, "score": 1.4}]}\n```'
        )

        self.assertEqual(scores, {2: 1.0})

    def test_fallback_keeps_vector_order_and_score(self):
        chunks = [
            self._chunk("first", 0.8, "First."),
            self._chunk("second", 0.7, "Second."),
        ]

        ranked = RerankingService.fallback(chunks)

        self.assertEqual(
            [item.chunk.id for item in ranked],
            ["first", "second"],
        )
        self.assertEqual(ranked[0].score, 0.8)
        self.assertIsNone(ranked[0].rerank_score)


if __name__ == "__main__":
    unittest.main()
