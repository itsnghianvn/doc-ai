from pathlib import Path
import uuid

import fitz

from .chunk_service import chunk_text, normalize_text


PREVIEW_LENGTH = 500


def save_pdf(
    file_path: Path,
    document_id: str | None = None,
) -> dict:
    """Read a PDF file and return document metadata."""

    document_id = document_id or str(uuid.uuid4())

    full_text = ""
    chunks = []

    with fitz.open(file_path) as doc:
        pages = len(doc)

        for page_number, page in enumerate(doc, start=1):
            page_text = normalize_text(page.get_text())
            if not page_text:
                continue

            if full_text:
                full_text += "\n\n"

            page_start = len(full_text)
            full_text += page_text

            page_chunks = chunk_text(
                page_text,
                page_number=page_number,
                start_offset=page_start,
                chunk_index_start=len(chunks),
            )

            for chunk in page_chunks:
                chunk["document_id"] = document_id

            chunks.extend(page_chunks)

    preview = " ".join(full_text.split())

    return {
        "document_id": document_id,
        "filename": file_path.name,
        "pages": pages,
        "characters": len(full_text),
        "chunk_count": len(chunks),
        "chunks": chunks,
        "preview": preview[:PREVIEW_LENGTH],
    }