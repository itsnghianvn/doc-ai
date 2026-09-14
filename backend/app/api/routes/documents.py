from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.document import Document
from app.services.document_service import (
    delete_document,
    get_document,
    get_documents,
)
from app.services.qdrant_service import delete_document_chunks

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

UPLOAD_DIR = Path("uploads")

@router.get("/", response_model=list[Document])
def list_documents(db: Session = Depends(get_db)):
    return get_documents(db)

@router.delete("/{document_id}")
def remove_document(
    document_id: str,
    db: Session = Depends(get_db),
):
    document = get_document(db, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # 1. Delete vectors from Qdrant
    delete_document_chunks(document_id)

    # 2. Delete PDF
    file_path = UPLOAD_DIR / document["filename"]

    if file_path.exists():
        file_path.unlink()

    # 3. Delete metadata
    delete_document(db, document_id)

    return {
        "message": "Document deleted successfully.",
        "document_id": document_id,
    }