"""Document ingestion routes for the RAG knowledge base."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user_db
from app.core.config import settings
from app.schemas.document import (
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_BYTES,
    DocumentDeleteResponse,
    DocumentListResponse,
    DocumentMeta,
    UrlIngestRequest,
)
from app.services import rag_service

router = APIRouter()


@router.post("/url", response_model=DocumentMeta, status_code=status.HTTP_201_CREATED)
def ingest_url(
    body: UrlIngestRequest,
    auth: tuple = Depends(get_current_user_db),
) -> DocumentMeta:
    """Ingest a web page via Tavily Extract and index it like an uploaded file."""
    db, _, user_id = auth
    return rag_service.ingest_url(db, user_id, body.url)


@router.post("/upload", response_model=DocumentMeta, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    auth: tuple = Depends(get_current_user_db),
) -> DocumentMeta:
    """Accept a file upload, chunk it, and store embeddings in FAISS."""
    db, _, user_id = auth
    rag_service.ensure_data_dirs()

    original_name = file.filename or "upload.bin"
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{suffix}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB",
        )

    dest = Path(settings.uploads_dir) / f"{uuid4()}{suffix}"
    dest.write_bytes(content)

    return rag_service.ingest_document(db, str(dest), user_id, filename=original_name)


@router.get("/list", response_model=DocumentListResponse)
def list_documents(auth: tuple = Depends(get_current_user_db)) -> DocumentListResponse:
    """List ingested documents for the current user."""
    db, _, user_id = auth
    return DocumentListResponse(documents=rag_service.list_documents(db, user_id))


@router.delete("/{doc_id}", response_model=DocumentDeleteResponse)
def delete_document(
    doc_id: str,
    auth: tuple = Depends(get_current_user_db),
) -> DocumentDeleteResponse:
    """Remove a document and its vectors from the index."""
    db, _, user_id = auth
    deleted = rag_service.delete_document(db, user_id, doc_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} not found",
        )
    return DocumentDeleteResponse(id=doc_id, deleted=True)
