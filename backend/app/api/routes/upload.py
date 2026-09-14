from pathlib import Path
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.document import Document
from app.services.document_processing_service import (
    process_document,
)
from app.services.document_service import (
    get_document_by_filename,
    save_document,
)

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024


@router.post(
    "/",
    response_model=Document,
    status_code=202,
)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
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

    if get_document_by_filename(db, safe_filename):
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
    document_id = str(uuid.uuid4())

    try:
        document = save_document(
            db,
            {
                "document_id": document_id,
                "filename": safe_filename,
                "pages": 0,
                "characters": 0,
                "chunk_count": 0,
                "preview": "",
                "status": "processing",
            },
        )

        background_tasks.add_task(
            process_document,
            document_id,
            file_path,
        )

        return document
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