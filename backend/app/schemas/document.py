from datetime import datetime

from pydantic import BaseModel


class Document(BaseModel):
    document_id: str
    filename: str
    pages: int
    characters: int
    chunk_count: int
    preview: str
    created_at: datetime