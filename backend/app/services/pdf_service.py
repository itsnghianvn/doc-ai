from pathlib import Path
import fitz
from .chunk_service import chunk_text

PREVIEW_LENGTH = 500


def save_pdf(file_path: Path) -> dict:
    """Read a PDF file and return basic metadata."""

    with fitz.open(file_path) as doc:
        text = "".join(page.get_text() for page in doc)
        chunks = chunk_text(text)
        preview = " ".join(text.split())

        return {
            "filename": file_path.name,
            "pages": len(doc),
            "characters": len(text),
            "chunk_count": len(chunks),
            "chunks": chunks,
            "preview": preview[:PREVIEW_LENGTH],
        }