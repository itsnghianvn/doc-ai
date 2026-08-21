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

        page_texts = []

        for page_number, page in enumerate(doc, start=1):
            text = page.get_text()

            page_texts.append(
                {
                    "page": page_number,
                    "text": text,
                }
            )

    full_text = ""
    page_ranges = []

    for page_data in page_texts:
        page_number = page_data["page"]
        text = page_data["text"]

        start = len(full_text)
        full_text += text
        end = len(full_text)

        page_ranges.append(
            {
                "page": page_number,
                "start": start,
                "end": end,
            }
        )

    chunks = chunk_text(full_text)

    for chunk in chunks:
        chunk_start = chunk["start"]
        chunk_end = chunk["end"]

        overlapping_pages = [
            page_range["page"]
            for page_range in page_ranges
            if (
                chunk_start < page_range["end"]
                and chunk_end > page_range["start"]
            )
        ]

        if overlapping_pages:
            chunk["page_start"] = min(overlapping_pages)
            chunk["page_end"] = max(overlapping_pages)
        else:
            chunk["page_start"] = None
            chunk["page_end"] = None

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