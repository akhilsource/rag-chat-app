"""Pydantic request/response schemas for chat routes."""

from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    document_ids: list[str] = Field(default_factory=list)


class UpdateSessionDocumentsRequest(BaseModel):
    document_ids: list[str] = Field(default_factory=list)


class SessionSummary(BaseModel):
    id: str
    title: str | None
    document_ids: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str | None = None


class SessionListResponse(BaseModel):
    sessions: list[SessionSummary] = Field(default_factory=list)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    session_id: str = Field(..., min_length=1, max_length=128)
    use_web_search: bool = False
    persist_user_message: bool = True


class SourceChunk(BaseModel):
    content: str
    metadata: dict = Field(default_factory=dict)


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: list[SourceChunk] = Field(default_factory=list)
    created_at: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk] = Field(default_factory=list)
    session_id: str
    answer_found: bool = True
    suggest_web_search: bool = False


class ChatHistoryMessage(BaseModel):
    role: str
    content: str


class ChatHistoryResponse(BaseModel):
    session_id: str
    title: str | None = None
    document_ids: list[str] = Field(default_factory=list)
    messages: list[ChatHistoryMessage] = Field(default_factory=list)


class SessionDetailResponse(BaseModel):
    session: SessionSummary
    messages: list[ChatMessageOut] = Field(default_factory=list)
