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
    score: float
    content: str
    start: int
    end: int


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]