from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import DocumentModel


def _to_dict(document: DocumentModel) -> dict:
    return {
        "document_id": document.document_id,
        "filename": document.filename,
        "pages": document.pages,
        "characters": document.characters,
        "chunk_count": document.chunk_count,
        "preview": document.preview,
        "status": document.status,
        "error_message": document.error_message,
        "created_at": document.created_at,
    }


def save_document(db: Session, document: dict) -> dict:
    record = DocumentModel(
        document_id=document["document_id"],
        filename=document["filename"],
        pages=document["pages"],
        characters=document["characters"],
        chunk_count=document["chunk_count"],
        preview=document["preview"],
        status=document.get("status", "ready"),
        error_message=document.get("error_message"),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return _to_dict(record)


def update_document(
    db: Session,
    document_id: str,
    **values,
) -> dict | None:
    record = db.get(DocumentModel, document_id)
    if not record:
        return None

    for field, value in values.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return _to_dict(record)


def get_documents(db: Session) -> list[dict]:
    documents = db.scalars(
        select(DocumentModel).order_by(
            DocumentModel.created_at.desc()
        )
    ).all()

    return [_to_dict(document) for document in documents]


def get_document(
    db: Session,
    document_id: str,
) -> dict | None:
    document = db.get(DocumentModel, document_id)

    return _to_dict(document) if document else None


def get_document_for_update(
    db: Session,
    document_id: str,
) -> dict | None:
    document = db.scalar(
        select(DocumentModel)
        .where(DocumentModel.document_id == document_id)
        .with_for_update()
    )

    return _to_dict(document) if document else None


def get_document_by_filename(
    db: Session,
    filename: str,
) -> dict | None:
    document = db.scalar(
        select(DocumentModel).where(
            DocumentModel.filename == filename
        )
    )

    return _to_dict(document) if document else None


def delete_document(db: Session, document_id: str) -> bool:
    document = db.get(DocumentModel, document_id)
    if not document:
        return False

    db.delete(document)
    db.commit()

    return True
