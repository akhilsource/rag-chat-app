"""Chat / RAG query routes."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user_db
from app.schemas.chat import (
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    CreateSessionRequest,
    SessionDetailResponse,
    SessionListResponse,
    SessionSummary,
    UpdateSessionDocumentsRequest,
)
from app.services import chat_service, rag_service

router = APIRouter()


@router.post("/sessions", response_model=SessionSummary)
def create_session(
    body: CreateSessionRequest,
    auth: tuple = Depends(get_current_user_db),
) -> SessionSummary:
    db, _, user_id = auth
    return chat_service.create_session(db, user_id, body.title, body.document_ids)


@router.get("/sessions", response_model=SessionListResponse)
def list_sessions(auth: tuple = Depends(get_current_user_db)) -> SessionListResponse:
    db, _, user_id = auth
    return SessionListResponse(sessions=chat_service.list_sessions(db, user_id))


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    auth: tuple = Depends(get_current_user_db),
) -> SessionDetailResponse:
    db, _, user_id = auth
    return chat_service.get_session_detail(db, user_id, session_id)


@router.patch("/sessions/{session_id}/documents", response_model=SessionSummary)
def update_session_documents(
    session_id: str,
    body: UpdateSessionDocumentsRequest,
    auth: tuple = Depends(get_current_user_db),
) -> SessionSummary:
    db, _, user_id = auth
    return chat_service.update_session_documents(
        db, user_id, session_id, body.document_ids
    )


@router.post("/query", response_model=ChatResponse)
def query(
    request: ChatRequest,
    auth: tuple = Depends(get_current_user_db),
) -> ChatResponse:
    db, _, user_id = auth
    return rag_service.answer_question(
        db,
        user_id,
        request.session_id,
        request.question,
        use_web_search=request.use_web_search,
        persist_user_message=request.persist_user_message,
    )


@router.get("/history", response_model=ChatHistoryResponse)
def history(
    session_id: str = Query(..., description="Chat session id"),
    auth: tuple = Depends(get_current_user_db),
) -> ChatHistoryResponse:
    db, _, user_id = auth
    detail = chat_service.get_session_detail(db, user_id, session_id)
    messages = [
        ChatHistoryMessage(role=m.role, content=m.content) for m in detail.messages
    ]
    return ChatHistoryResponse(
        session_id=session_id,
        title=detail.session.title,
        document_ids=detail.session.document_ids,
        messages=messages,
    )
