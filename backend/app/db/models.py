from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentModel(Base):
    __tablename__ = "documents"

    document_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
    )
    filename: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )
    pages: Mapped[int] = mapped_column(Integer)
    characters: Mapped[int] = mapped_column(Integer)
    chunk_count: Mapped[int] = mapped_column(Integer)
    preview: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20),
        default="ready",
        index=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    conversations: Mapped[list["ConversationModel"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ConversationModel(Base):
    __tablename__ = "conversations"

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.document_id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    document: Mapped[DocumentModel] = relationship(
        back_populates="conversations"
    )
    messages: Mapped[list["MessageModel"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="MessageModel.created_at",
    )


class MessageModel(Base):
    __tablename__ = "messages"

    message_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
    )
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey(
            "conversations.conversation_id",
            ondelete="CASCADE",
        ),
        index=True,
    )
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    sources: Mapped[list[dict] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )

    conversation: Mapped[ConversationModel] = relationship(
        back_populates="messages"
    )
