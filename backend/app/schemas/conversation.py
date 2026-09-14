from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.chat import Source


class ConversationCreate(BaseModel):
    title: str = Field(
        default="New conversation",
        min_length=1,
        max_length=120,
    )


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class Conversation(BaseModel):
    conversation_id: str
    document_id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationMessage(BaseModel):
    message_id: str
    conversation_id: str
    role: str
    content: str
    sources: list[Source] | None = None
    created_at: datetime
