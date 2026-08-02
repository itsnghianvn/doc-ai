from pathlib import Path

import fitz

PREVIEW_LENGTH = 500


def save_pdf(file_path: Path) -> dict:
    """Read a PDF file and return basic metadata."""

    with fitz.open(file_path) as doc:
        text = "".join(page.get_text() for page in doc)
        preview = " ".join(text.split())

        return {
            "filename": file_path.name,
            "pages": len(doc),
            "characters": len(text),
            "preview": preview[:PREVIEW_LENGTH],
        }