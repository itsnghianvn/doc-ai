from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Document(BaseModel):
    document_id: str
    filename: str
    pages: int = Field(ge=0)
    characters: int = Field(ge=0)
    chunk_count: int = Field(ge=0)
    preview: str
    status: Literal["processing", "ready", "failed"] = "ready"
    error_message: str | None = None
    created_at: datetime