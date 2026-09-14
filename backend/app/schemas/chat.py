from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    document_id: str
    history: list[ChatMessage] = Field(default_factory=list)


class Source(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int | None = None
    score: float
    retrieval_score: float
    rerank_score: float | None = None
    content: str
    start: int
    end: int
    page_start: int | None = None
    page_end: int | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]