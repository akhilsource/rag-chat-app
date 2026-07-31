"""Pydantic request/response schemas for document ingestion routes."""

from pydantic import BaseModel, Field

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".pptx"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


class DocumentMeta(BaseModel):
    id: str
    filename: str
    num_chunks: int = 0
    uploaded_at: str
    status: str = "stored"
    user_id: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentMeta] = Field(default_factory=list)


class DocumentDeleteResponse(BaseModel):
    id: str
    deleted: bool


class UrlIngestRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=2000)
