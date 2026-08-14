from fastapi import APIRouter, HTTPException

from app.schemas.document import Document
from app.services.document_service import get_documents,delete_document
from app.services.qdrant_service import delete_document_chunks
from pathlib import Path

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

UPLOAD_DIR = Path("uploads")

@router.get("/", response_model=list[Document])
def list_documents():
    return get_documents()

@router.delete("/{document_id}")
def remove_document(document_id: str):
    documents = get_documents()

    document = next(
        (
            document
            for document in documents
            if document["document_id"] == document_id
        ),
        None,
    )

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
    delete_document(document_id)

    return {
        "message": "Document deleted successfully.",
        "document_id": document_id,
    }