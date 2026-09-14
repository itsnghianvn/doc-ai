import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    ConversationModel,
    MessageModel,
    utc_now,
)


def _conversation_to_dict(
    conversation: ConversationModel,
) -> dict:
    return {
        "conversation_id": conversation.conversation_id,
        "document_id": conversation.document_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
    }


def _message_to_dict(message: MessageModel) -> dict:
    return {
        "message_id": message.message_id,
        "conversation_id": message.conversation_id,
        "role": message.role,
        "content": message.content,
        "sources": message.sources,
        "created_at": message.created_at,
    }


def create_conversation(
    db: Session,
    document_id: str,
    title: str = "New conversation",
) -> dict:
    conversation = ConversationModel(
        conversation_id=str(uuid.uuid4()),
        document_id=document_id,
        title=title.strip() or "New conversation",
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return _conversation_to_dict(conversation)


def get_conversation(
    db: Session,
    conversation_id: str,
) -> dict | None:
    conversation = db.get(
        ConversationModel,
        conversation_id,
    )

    return (
        _conversation_to_dict(conversation)
        if conversation
        else None
    )


def list_conversations(
    db: Session,
    document_id: str,
) -> list[dict]:
    conversations = db.scalars(
        select(ConversationModel)
        .where(ConversationModel.document_id == document_id)
        .order_by(ConversationModel.updated_at.desc())
    ).all()

    return [
        _conversation_to_dict(conversation)
        for conversation in conversations
    ]


def rename_conversation(
    db: Session,
    conversation_id: str,
    title: str,
) -> dict | None:
    conversation = db.get(
        ConversationModel,
        conversation_id,
    )
    if not conversation:
        return None

    conversation.title = title.strip()
    conversation.updated_at = utc_now()
    db.commit()
    db.refresh(conversation)

    return _conversation_to_dict(conversation)


def delete_conversation(
    db: Session,
    conversation_id: str,
) -> bool:
    conversation = db.get(
        ConversationModel,
        conversation_id,
    )
    if not conversation:
        return False

    db.delete(conversation)
    db.commit()

    return True


def list_messages(
    db: Session,
    conversation_id: str,
) -> list[dict]:
    messages = db.scalars(
        select(MessageModel)
        .where(
            MessageModel.conversation_id == conversation_id
        )
        .order_by(MessageModel.created_at)
    ).all()

    return [_message_to_dict(message) for message in messages]


def get_history(
    db: Session,
    conversation_id: str,
) -> list[dict]:
    return [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in list_messages(db, conversation_id)
    ]


def save_exchange(
    db: Session,
    conversation_id: str,
    question: str,
    answer: str,
    sources: list[dict],
) -> None:
    conversation = db.get(
        ConversationModel,
        conversation_id,
    )
    if not conversation:
        raise ValueError("Conversation not found.")

    db.add_all(
        [
            MessageModel(
                message_id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="user",
                content=question,
            ),
            MessageModel(
                message_id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=answer,
                sources=sources,
            ),
        ]
    )

    if conversation.title == "New conversation":
        conversation.title = question.strip()[:120]

    conversation.updated_at = utc_now()
    db.commit()
