from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.services.pdf_service import save_pdf
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import upsert_chunks
from app.services.document_service import get_documents, save_document

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
embedding_service = EmbeddingService()


@router.post("/")
async def upload_pdf(file: UploadFile = File(...)):
    filename = file.filename or ""
    safe_filename = Path(filename).name

    if (
        not safe_filename
        or safe_filename != filename
        or Path(safe_filename).suffix.lower() != ".pdf"
    ):
        raise HTTPException(
            status_code=400,
            detail="A valid PDF filename is required.",
        )

    if file.content_type not in {
        "application/pdf",
        "application/octet-stream",
    }:
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    if any(
        document["filename"] == safe_filename
        for document in get_documents()
    ):
        raise HTTPException(
            status_code=409,
            detail="A document with this filename already exists.",
        )

    contents = await file.read(MAX_PDF_SIZE_BYTES + 1)

    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="PDF files must be 20 MB or smaller.",
        )

    if not contents.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    file_path = UPLOAD_DIR / safe_filename
    file_path.write_bytes(contents)

    try:
        document = save_pdf(file_path)

        embedded_chunks = embedding_service.embed_chunks(
            document["chunks"]
        )

        upsert_chunks(
            embedded_chunks,
            document_id=document["document_id"],
        )

        return save_document(document)
    except Exception:
        file_path.unlink(missing_ok=True)
        raise


@router.get("/{filename}")
async def get_pdf(filename: str):
    safe_filename = Path(filename).name

    if safe_filename != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF filename.",
        )

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF not found.",
        )

    if file_path.suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=file_path.name,
    )