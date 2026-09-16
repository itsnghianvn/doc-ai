import logging
from pathlib import Path

from app.db.database import SessionLocal
from app.services.document_service import (
    get_document_for_update,
    update_document,
)
from app.services.embedding_service import EmbeddingService
from app.services.pdf_service import save_pdf
from app.services.qdrant_service import (
    create_collection,
    delete_document_chunks,
    upsert_chunks,
)


logger = logging.getLogger(__name__)


def process_document(
    document_id: str,
    file_path: Path,
) -> None:
    """Extract and index a PDF outside the upload request."""

    vectors_written = False

    try:
        document = save_pdf(
            file_path,
            document_id=document_id,
        )

        if not document["chunks"]:
            raise ValueError(
                "No extractable text was found in the PDF."
            )

        embedded_chunks = EmbeddingService().embed_chunks(
            document["chunks"]
        )

        with SessionLocal() as db:
            current = get_document_for_update(db, document_id)
            if not current or current["status"] != "processing":
                return

            create_collection()
            upsert_chunks(
                embedded_chunks,
                document_id=document_id,
            )
            vectors_written = True

            update_document(
                db,
                document_id,
                pages=document["pages"],
                characters=document["characters"],
                chunk_count=document["chunk_count"],
                preview=document["preview"],
                status="ready",
                error_message=None,
            )
    except Exception as error:
        logger.exception(
            "Document processing failed for %s.",
            document_id,
        )

        if vectors_written:
            try:
                delete_document_chunks(document_id)
            except Exception:
                logger.exception(
                    "Failed to clean vectors for %s.",
                    document_id,
                )

        with SessionLocal() as db:
            update_document(
                db,
                document_id,
                status="failed",
                error_message=str(error)[:1000],
            )
