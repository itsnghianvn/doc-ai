from fastapi import APIRouter, Depends, HTTPException
from google.genai.errors import APIError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.conversation_service import (
    get_conversation,
    get_history,
    save_exchange,
)
from app.services.rag_service import RAGService


router = APIRouter()

rag = RAGService()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    history = [
        message.model_dump()
        for message in request.history
    ]

    if request.conversation_id:
        conversation = get_conversation(
            db,
            request.conversation_id,
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        if conversation["document_id"] != request.document_id:
            raise HTTPException(
                status_code=400,
                detail="Conversation does not belong to this document.",
            )

        history = get_history(
            db,
            request.conversation_id,
        )

    try:
        result = rag.ask(
            question=request.question,
            document_id=request.document_id,
            history=history,
        )
    except APIError as error:
        if error.code == 429:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini rate limit reached. "
                    "Please wait and try again."
                ),
            ) from error

        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini is temporarily unavailable. "
                "Please try again shortly."
            ),
        ) from error

    if request.conversation_id:
        save_exchange(
            db,
            request.conversation_id,
            request.question,
            result["answer"],
            result["sources"],
        )

    return result