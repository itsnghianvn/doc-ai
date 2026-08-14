import json
from datetime import datetime, timezone
from pathlib import Path


DATA_FILE = Path("app/data/documents.json")


def _load_documents() -> list[dict]:
    if not DATA_FILE.exists():
        return []

    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def _save_documents(documents: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            documents,
            file,
            ensure_ascii=False,
            indent=2,
        )


def save_document(document: dict) -> dict:
    documents = _load_documents()

    document_record = {
        "document_id": document["document_id"],
        "filename": document["filename"],
        "pages": document["pages"],
        "characters": document["characters"],
        "chunk_count": document["chunk_count"],
        "preview": document["preview"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    documents.append(document_record)
    _save_documents(documents)

    return document_record


def get_documents() -> list[dict]:
    return _load_documents()


def get_document(document_id: str) -> dict | None:
    documents = _load_documents()

    return next(
        (
            document
            for document in documents
            if document["document_id"] == document_id
        ),
        None,
    )

def delete_document(document_id: str) -> bool:
    documents = _load_documents()

    document = next(
        (
            document
            for document in documents
            if document["document_id"] == document_id
        ),
        None,
    )

    if document is None:
        return False

    filtered_documents = [
        item
        for item in documents
        if item["document_id"] != document_id
    ]

    _save_documents(filtered_documents)

    return True