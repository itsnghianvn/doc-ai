from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.chat import Source


ConversationTitle = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
]


class ConversationCreate(BaseModel):
    title: ConversationTitle = "New conversation"


class ConversationUpdate(BaseModel):
    title: ConversationTitle


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
