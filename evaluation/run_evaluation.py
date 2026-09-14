#!/usr/bin/env python3
import argparse
import json
import os
import re
import statistics
import tempfile
import time
from pathlib import Path

import fitz
import requests
from dotenv import load_dotenv
from google import genai


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "evaluation" / "questions.json"
DEFAULT_FIXTURE = (
    ROOT / "evaluation" / "fixtures" / "ai_applications.txt"
)
DEFAULT_OUTPUT = (
    ROOT / "evaluation" / "results" / "latest.json"
)
STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "use",
    "with",
}


def source_page_matches(
    source: dict,
    expected_pages: list[int],
) -> bool:
    page_start = source.get("page_start")
    page_end = source.get("page_end")

    if page_start is None or page_end is None:
        return False

    return any(
        page_start <= page <= page_end
        for page in expected_pages
    )


def retrieval_metrics(
    sources: list[dict],
    expected_pages: list[int],
) -> tuple[float, float]:
    for rank, source in enumerate(sources, start=1):
        if source_page_matches(source, expected_pages):
            return 1.0, 1.0 / rank

    return 0.0, 0.0


def keyword_coverage(
    answer: str,
    expected_keywords: list[str],
) -> float:
    if not expected_keywords:
        return 1.0

    normalized_answer = answer.casefold()
    matches = sum(
        keyword.casefold() in normalized_answer
        for keyword in expected_keywords
    )

    return matches / len(expected_keywords)


def lexical_groundedness(
    answer: str,
    sources: list[dict],
) -> float:
    answer_tokens = {
        token
        for token in re.findall(r"[a-z0-9]+", answer.casefold())
        if len(token) > 2 and token not in STOP_WORDS
    }
    source_tokens = set(
        re.findall(
            r"[a-z0-9]+",
            " ".join(
                source.get("content", "")
                for source in sources
            ).casefold(),
        )
    )

    if not answer_tokens:
        return 0.0

    return len(answer_tokens & source_tokens) / len(answer_tokens)


def parse_json_response(text: str) -> dict:
    text = text.strip()

    if text.startswith("```"):
        text = text.removeprefix("```json").removeprefix("```")
        text = text.removesuffix("```").strip()

    return json.loads(text)


def judge_answer(
    client,
    model: str,
    question: str,
    answer: str,
    sources: list[dict],
) -> tuple[float, float]:
    context = "\n\n".join(
        source["content"] for source in sources
    )
    prompt = f"""
Evaluate a RAG answer using only the question and retrieved context.

Return valid JSON:
{{"answer_relevance": 0.0, "faithfulness": 0.0}}

Scoring:
- answer_relevance: how directly and completely the answer addresses the question.
- faithfulness: whether every factual claim is supported by the retrieved context.
- Scores must be between 0.0 and 1.0.

Question:
{question}

Retrieved context:
{context}

Answer:
{answer}
"""
    response = client.models.generate_content(
        model=model,
        contents=prompt,
    )
    scores = parse_json_response(response.text)

    return (
        max(
            0.0,
            min(1.0, float(scores["answer_relevance"])),
        ),
        max(
            0.0,
            min(1.0, float(scores["faithfulness"])),
        ),
    )


def create_fixture_pdf(
    fixture_path: Path,
    output_path: Path,
) -> None:
    pages = fixture_path.read_text(
        encoding="utf-8"
    ).split("---PAGE---")

    with fitz.open() as document:
        for page_text in pages:
            page = document.new_page()
            page.insert_textbox(
                fitz.Rect(54, 54, 558, 788),
                page_text.strip(),
                fontsize=11,
                lineheight=1.35,
            )

        document.save(output_path)


def wait_for_document(
    base_url: str,
    document_id: str,
    timeout_seconds: int = 120,
) -> dict:
    deadline = time.monotonic() + timeout_seconds

    while time.monotonic() < deadline:
        response = requests.get(
            f"{base_url}/documents/",
            timeout=10,
        )
        response.raise_for_status()
        document = next(
            (
                item
                for item in response.json()
                if item["document_id"] == document_id
            ),
            None,
        )

        if document and document["status"] == "ready":
            return document

        if document and document["status"] == "failed":
            raise RuntimeError(
                document.get("error_message")
                or "Document processing failed."
            )

        time.sleep(1)

    raise TimeoutError("Document processing timed out.")


def prepare_document(
    base_url: str,
    filename: str,
    fixture_path: Path,
) -> tuple[dict, bool]:
    response = requests.get(
        f"{base_url}/documents/",
        timeout=10,
    )
    response.raise_for_status()
    existing = next(
        (
            item
            for item in response.json()
            if item["filename"] == filename
        ),
        None,
    )

    if existing:
        return (
            wait_for_document(
                base_url,
                existing["document_id"],
            ),
            False,
        )

    with tempfile.TemporaryDirectory() as directory:
        pdf_path = Path(directory) / filename
        create_fixture_pdf(fixture_path, pdf_path)

        with pdf_path.open("rb") as file:
            response = requests.post(
                f"{base_url}/upload/",
                files={
                    "file": (
                        filename,
                        file,
                        "application/pdf",
                    )
                },
                timeout=30,
            )

    response.raise_for_status()
    document = response.json()

    return (
        wait_for_document(
            base_url,
            document["document_id"],
        ),
        True,
    )


def request_chat_with_retry(
    base_url: str,
    payload: dict,
    retries: int = 3,
) -> dict:
    response = None

    for attempt in range(retries):
        response = requests.post(
            f"{base_url}/chat",
            json=payload,
            timeout=120,
        )

        if response.status_code < 500:
            response.raise_for_status()
            return response.json()

        if attempt < retries - 1:
            delay = 30 * (attempt + 1)
            print(
                f"Chat request failed with "
                f"HTTP {response.status_code}; "
                f"retrying in {delay}s."
            )
            time.sleep(delay)

    response.raise_for_status()
    raise RuntimeError("Chat request failed.")


def run_evaluation(args) -> dict:
    dataset = json.loads(
        args.dataset.read_text(encoding="utf-8")
    )
    document, created = prepare_document(
        args.base_url,
        dataset["document_filename"],
        args.fixture,
    )

    load_dotenv(ROOT / "backend" / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv(
        "GEMINI_GENERATION_MODEL",
        "gemini-3.5-flash",
    )
    judge_client = (
        genai.Client(api_key=api_key)
        if api_key and not args.skip_judge
        else None
    )
    results = []

    try:
        questions = dataset["questions"][:args.limit]

        for index, case in enumerate(questions):
            if index > 0 and args.request_delay > 0:
                time.sleep(args.request_delay)

            started = time.perf_counter()
            payload = request_chat_with_retry(
                args.base_url,
                {
                    "question": case["question"],
                    "document_id": document["document_id"],
                    "history": [],
                },
            )
            latency = time.perf_counter() - started
            recall, reciprocal_rank = retrieval_metrics(
                payload["sources"],
                case["expected_pages"],
            )
            keyword_score = keyword_coverage(
                payload["answer"],
                case["expected_keywords"],
            )
            lexical_score = lexical_groundedness(
                payload["answer"],
                payload["sources"],
            )
            relevance = keyword_score
            faithfulness = lexical_score
            judge_method = "deterministic_proxy"

            if judge_client:
                try:
                    relevance, faithfulness = judge_answer(
                        judge_client,
                        model,
                        case["question"],
                        payload["answer"],
                        payload["sources"],
                    )
                    judge_method = "gemini_judge"
                except Exception as error:
                    print(
                        f"Judge failed for {case['id']}: {error}"
                    )

            result = {
                "id": case["id"],
                "question": case["question"],
                "answer": payload["answer"],
                "source_pages": [
                    source.get("page_start")
                    for source in payload["sources"]
                ],
                "recall_at_k": recall,
                "reciprocal_rank": reciprocal_rank,
                "keyword_coverage": keyword_score,
                "lexical_groundedness": lexical_score,
                "answer_relevance": relevance,
                "faithfulness": faithfulness,
                "judge_method": judge_method,
                "latency_seconds": latency,
            }
            results.append(result)
            print(
                f"{case['id']}: recall={recall:.2f} "
                f"rr={reciprocal_rank:.2f} "
                f"relevance={relevance:.2f} "
                f"faithfulness={faithfulness:.2f}"
            )
    finally:
        if created and not args.keep_document:
            requests.delete(
                (
                    f"{args.base_url}/documents/"
                    f"{document['document_id']}"
                ),
                timeout=30,
            ).raise_for_status()

    summary = {
        "questions": len(results),
        "recall_at_k": statistics.mean(
            item["recall_at_k"] for item in results
        ),
        "mrr": statistics.mean(
            item["reciprocal_rank"] for item in results
        ),
        "answer_relevance": statistics.mean(
            item["answer_relevance"] for item in results
        ),
        "faithfulness": statistics.mean(
            item["faithfulness"] for item in results
        ),
        "average_latency_seconds": statistics.mean(
            item["latency_seconds"] for item in results
        ),
    }

    return {
        "document": {
            "filename": document["filename"],
            "pages": document["pages"],
            "chunks": document["chunk_count"],
        },
        "configuration": {
            "base_url": args.base_url,
            "judge_enabled": judge_client is not None,
            "judge_model": model if judge_client else None,
        },
        "summary": summary,
        "results": results,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate DocAI retrieval and answer quality."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
    )
    parser.add_argument(
        "--fixture",
        type=Path,
        default=DEFAULT_FIXTURE,
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
    )
    parser.add_argument(
        "--skip-judge",
        action="store_true",
        help="Use deterministic answer-quality proxies only.",
    )
    parser.add_argument(
        "--keep-document",
        action="store_true",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Evaluate only the first N questions.",
    )
    parser.add_argument(
        "--request-delay",
        type=float,
        default=30,
        help="Seconds between questions to respect model quotas.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = run_evaluation(args)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("\nSummary")
    print(json.dumps(report["summary"], indent=2))
    print(f"Report: {args.output}")


if __name__ == "__main__":
    main()
