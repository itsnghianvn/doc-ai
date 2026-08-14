from pathlib import Path
import uuid

import fitz

from .chunk_service import chunk_text


PREVIEW_LENGTH = 500


def save_pdf(file_path: Path) -> dict:
    """Read a PDF file and return document metadata."""

    document_id = str(uuid.uuid4())

    with fitz.open(file_path) as doc:
        pages = len(doc)

        text = "".join(page.get_text() for page in doc)

    chunks = chunk_text(text)
    preview = " ".join(text.split())

    return {
        "document_id": document_id,
        "filename": file_path.name,
        "pages": pages,
        "characters": len(text),
        "chunk_count": len(chunks),
        "chunks": chunks,
        "preview": preview[:PREVIEW_LENGTH],
    }