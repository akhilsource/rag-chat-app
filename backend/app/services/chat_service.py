"""Chat session and message persistence."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatSession, SessionDocument
from app.models.document import Document
from app.models.user import User
from app.schemas.chat import (
    ChatMessageOut,
    SessionDetailResponse,
    SessionSummary,
    SourceChunk,
)


def ensure_user(
    db: Session,
    *,
    user_id: str,
    email: str | None,
    display_name: str | None,
) -> User:
    user = db.get(User, user_id)
    if user is None:
        user = User(
            id=user_id,
            email=email or "",
            display_name=display_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    changed = False
    if email and user.email != email:
        user.email = email
        changed = True
    if display_name and user.display_name != display_name:
        user.display_name = display_name
        changed = True
    if changed:
        db.commit()
        db.refresh(user)
    return user


def _validate_document_ids(db: Session, user_id: str, document_ids: list[str]) -> None:
    if not document_ids:
        return
    rows = (
        db.query(Document)
        .filter(Document.user_id == user_id, Document.id.in_(document_ids))
        .all()
    )
    owned = {row.id for row in rows}
    missing = set(document_ids) - owned
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Documents not found or not owned by user: {', '.join(sorted(missing))}",
        )


def _session_summary(session: ChatSession) -> SessionSummary:
    return SessionSummary(
        id=session.id,
        title=session.title,
        document_ids=[link.document_id for link in session.document_links],
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat() if session.updated_at else None,
    )


def create_session(
    db: Session,
    user_id: str,
    title: str | None,
    document_ids: list[str],
) -> SessionSummary:
    _validate_document_ids(db, user_id, document_ids)
    session = ChatSession(
        id=str(uuid4()),
        user_id=user_id,
        title=title or "New topic",
    )
    db.add(session)
    for doc_id in document_ids:
        db.add(SessionDocument(session_id=session.id, document_id=doc_id))
    db.commit()
    db.refresh(session)
    return _session_summary(session)


def list_sessions(db: Session, user_id: str) -> list[SessionSummary]:
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return [_session_summary(s) for s in sessions]


def get_session(db: Session, user_id: str, session_id: str) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def get_session_detail(db: Session, user_id: str, session_id: str) -> SessionDetailResponse:
    session = get_session(db, user_id, session_id)
    return SessionDetailResponse(
        session=_session_summary(session),
        messages=get_messages(db, session_id),
    )


def get_session_document_ids(db: Session, session_id: str) -> list[str]:
    links = db.query(SessionDocument).filter(SessionDocument.session_id == session_id).all()
    return [link.document_id for link in links]


def update_session_documents(
    db: Session,
    user_id: str,
    session_id: str,
    document_ids: list[str],
) -> SessionSummary:
    session = get_session(db, user_id, session_id)
    _validate_document_ids(db, user_id, document_ids)
    db.query(SessionDocument).filter(SessionDocument.session_id == session_id).delete()
    for doc_id in document_ids:
        db.add(SessionDocument(session_id=session_id, document_id=doc_id))
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return _session_summary(session)


def append_messages(
    db: Session,
    session_id: str,
    user_content: str,
    assistant_content: str,
    sources: list[SourceChunk],
    *,
    persist_user_message: bool = True,
) -> None:
    session = db.get(ChatSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if persist_user_message:
        db.add(
            ChatMessage(
                id=str(uuid4()),
                session_id=session_id,
                role="user",
                content=user_content,
                sources=None,
            )
        )
    db.add(
        ChatMessage(
            id=str(uuid4()),
            session_id=session_id,
            role="assistant",
            content=assistant_content,
            sources=[s.model_dump() for s in sources],
        )
    )
    session.updated_at = datetime.now(timezone.utc)
    db.commit()


def get_messages(db: Session, session_id: str) -> list[ChatMessageOut]:
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    result: list[ChatMessageOut] = []
    for row in rows:
        sources = [
            SourceChunk(**item) for item in (row.sources or []) if isinstance(item, dict)
        ]
        result.append(
            ChatMessageOut(
                id=row.id,
                role=row.role,
                content=row.content,
                sources=sources,
                created_at=row.created_at.isoformat(),
            )
        )
    return result
