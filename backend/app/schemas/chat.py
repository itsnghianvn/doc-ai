from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints


QuestionText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=4000),
]
Identifier = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=128),
]
MessageContent = Annotated[
    str,
    StringConstraints(min_length=1, max_length=100_000),
]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: MessageContent


class ChatRequest(BaseModel):
    question: QuestionText
    document_id: Identifier
    conversation_id: Identifier | None = None
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


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