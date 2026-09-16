from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.conversation import (
    Conversation,
    ConversationCreate,
    ConversationMessage,
    ConversationUpdate,
    ConversationWithDocument,
)
from app.services.conversation_service import (
    create_conversation,
    delete_conversation,
    get_conversation,
    list_all_conversations,
    list_conversations,
    list_messages,
    rename_conversation,
)
from app.services.document_service import get_document


router = APIRouter(tags=["Conversations"])


@router.get(
    "/conversations",
    response_model=list[ConversationWithDocument],
)
def get_all_conversations(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return list_all_conversations(db, limit=limit)


@router.get(
    "/documents/{document_id}/conversations",
    response_model=list[Conversation],
)
def get_document_conversations(
    document_id: str,
    db: Session = Depends(get_db),
):
    if not get_document(db, document_id):
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return list_conversations(db, document_id)


@router.post(
    "/documents/{document_id}/conversations",
    response_model=Conversation,
    status_code=201,
)
def add_conversation(
    document_id: str,
    request: ConversationCreate,
    db: Session = Depends(get_db),
):
    if not get_document(db, document_id):
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return create_conversation(
        db,
        document_id,
        request.title,
    )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=Conversation,
)
def update_conversation(
    conversation_id: str,
    request: ConversationUpdate,
    db: Session = Depends(get_db),
):
    conversation = rename_conversation(
        db,
        conversation_id,
        request.title,
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return conversation


@router.delete("/conversations/{conversation_id}")
def remove_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    if not delete_conversation(db, conversation_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return {
        "message": "Conversation deleted successfully.",
        "conversation_id": conversation_id,
    }


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ConversationMessage],
)
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    if not get_conversation(db, conversation_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return list_messages(db, conversation_id)
