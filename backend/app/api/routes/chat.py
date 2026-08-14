from fastapi import APIRouter, Depends

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

router = APIRouter()
rag = RAGService()

@router.post("/chat", response_model=ChatResponse)

def chat(request: ChatRequest):
    answer = rag.ask(
        question=request.question,
        document_id=request.document_id,)
    return ChatResponse(answer=answer)
    