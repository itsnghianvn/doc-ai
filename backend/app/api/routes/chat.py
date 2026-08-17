from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import RAGService


router = APIRouter()

rag = RAGService()


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = rag.ask(
        question=request.question,
        document_id=request.document_id,
        history=[
            message.model_dump()
            for message in request.history
        ],
    )

    return result