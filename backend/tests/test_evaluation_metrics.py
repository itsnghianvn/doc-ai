import unittest
from unittest.mock import Mock, patch

from evaluation.run_evaluation import (
    keyword_coverage,
    lexical_groundedness,
    request_chat_with_retry,
    retrieval_metrics,
)


class EvaluationMetricsTests(unittest.TestCase):
    def test_retrieval_metrics_use_first_matching_page(self):
        sources = [
            {"page_start": 1, "page_end": 1},
            {"page_start": 3, "page_end": 3},
        ]

        recall, reciprocal_rank = retrieval_metrics(
            sources,
            [3],
        )

        self.assertEqual(recall, 1.0)
        self.assertEqual(reciprocal_rank, 0.5)

    def test_retrieval_metrics_report_miss(self):
        recall, reciprocal_rank = retrieval_metrics(
            [{"page_start": None, "page_end": None}],
            [2],
        )

        self.assertEqual(recall, 0.0)
        self.assertEqual(reciprocal_rank, 0.0)

    def test_keyword_coverage_is_fraction_of_expected_terms(self):
        score = keyword_coverage(
            "The system detects fraud in real time.",
            ["fraud", "real time", "medical images"],
        )

        self.assertAlmostEqual(score, 2 / 3)

    def test_lexical_groundedness_ignores_common_words(self):
        score = lexical_groundedness(
            "Models detect fraud quickly.",
            [{"content": "Models detect fraud in real time."}],
        )

        self.assertAlmostEqual(score, 0.75)

    @patch("evaluation.run_evaluation.time.sleep")
    @patch("evaluation.run_evaluation.requests.post")
    def test_chat_request_retries_rate_limit(
        self,
        post,
        sleep,
    ):
        rate_limited = Mock(
            status_code=429,
            headers={"Retry-After": "1"},
        )
        success = Mock(
            status_code=200,
            headers={},
        )
        success.json.return_value = {"answer": "ok"}
        post.side_effect = [rate_limited, success]

        result = request_chat_with_retry(
            "http://backend",
            {"question": "test"},
        )

        self.assertEqual(result, {"answer": "ok"})
        self.assertEqual(post.call_count, 2)
        sleep.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
