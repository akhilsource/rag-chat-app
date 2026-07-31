"""Business logic tying together app/rag/* for the API routes."""

from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.rag.chain import run_rag_chain
from app.rag.loader import load_document
from app.rag.splitter import split_documents
from app.rag.tavily import extract_url, tavily_configured
from app.rag.vector_store import add_documents, delete_by_doc_id
from app.schemas.chat import ChatResponse, SourceChunk
from app.schemas.document import DocumentMeta
from app.services import chat_service


def _require_openai_key() -> None:
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-..."):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured. Set it in .env to use RAG.",
        )


def _require_tavily_key() -> None:
    if not tavily_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TAVILY_API_KEY is not configured. Set it in .env to use web features.",
        )


def _document_to_meta(doc: Document) -> DocumentMeta:
    return DocumentMeta(
        id=doc.id,
        filename=doc.filename,
        num_chunks=doc.num_chunks,
        uploaded_at=doc.uploaded_at.isoformat(),
        status=doc.status,
        user_id=doc.user_id,
    )


def ingest_document(
    db: Session,
    file_path: str,
    user_id: str,
    filename: str | None = None,
) -> DocumentMeta:
    """Load, chunk, embed, and index an uploaded document."""
    _require_openai_key()
    path = Path(file_path)
    doc_id = str(uuid4())
    display_name = filename or path.name

    try:
        docs = load_document(str(path))
        chunks = split_documents(docs, doc_id=doc_id, filename=display_name)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document contains no extractable text.",
            )
        chunk_ids = [f"{doc_id}:{i}" for i in range(len(chunks))]
        add_documents(chunks, ids=chunk_ids)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {exc}",
        ) from exc

    row = Document(
        id=doc_id,
        user_id=user_id,
        filename=display_name,
        num_chunks=len(chunks),
        uploaded_at=datetime.now(timezone.utc),
        status="indexed",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _document_to_meta(row)


def ingest_url(db: Session, user_id: str, url: str) -> DocumentMeta:
    """Fetch a URL with Tavily Extract, then chunk and index it."""
    _require_openai_key()
    _require_tavily_key()

    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL must start with http:// or https://",
        )

    doc_id = str(uuid4())
    display_name = url.strip()

    try:
        docs = extract_url(display_name)
        chunks = split_documents(docs, doc_id=doc_id, filename=display_name)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL contained no extractable text.",
            )
        chunk_ids = [f"{doc_id}:{i}" for i in range(len(chunks))]
        add_documents(chunks, ids=chunk_ids)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest URL: {exc}",
        ) from exc

    row = Document(
        id=doc_id,
        user_id=user_id,
        filename=display_name,
        num_chunks=len(chunks),
        uploaded_at=datetime.now(timezone.utc),
        status="indexed",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _document_to_meta(row)


def list_documents(db: Session, user_id: str) -> list[DocumentMeta]:
    rows = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    return [_document_to_meta(row) for row in rows]


def delete_document(db: Session, user_id: str, doc_id: str) -> bool:
    row = db.get(Document, doc_id)
    if row is None or row.user_id != user_id:
        return False
    delete_by_doc_id(doc_id)
    db.delete(row)
    db.commit()
    return True


def answer_question(
    db: Session,
    user_id: str,
    session_id: str,
    question: str,
    *,
    use_web_search: bool = False,
    persist_user_message: bool = True,
) -> ChatResponse:
    """Answer a question using the RAG pipeline scoped to the session."""
    _require_openai_key()
    chat_service.get_session(db, user_id, session_id)
    doc_ids = chat_service.get_session_document_ids(db, session_id)
    prior_messages = chat_service.get_messages(db, session_id)
    history = [{"role": message.role, "content": message.content} for message in prior_messages]

    try:
        result = run_rag_chain(
            question,
            doc_ids=doc_ids,
            use_web_search=use_web_search,
            history=history,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer: {exc}",
        ) from exc

    answer = result["answer"]
    sources = [
        SourceChunk(content=doc.page_content, metadata=dict(doc.metadata))
        for doc in result["sources"]
    ]
    answer_found = bool(result.get("answer_found", True))
    suggest_web_search = bool(result.get("suggest_web_search", False))

    chat_service.append_messages(
        db,
        session_id,
        question,
        answer,
        sources,
        persist_user_message=persist_user_message,
    )
    return ChatResponse(
        answer=answer,
        sources=sources,
        session_id=session_id,
        answer_found=answer_found,
        suggest_web_search=suggest_web_search,
    )


def ensure_data_dirs() -> None:
    Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.vectorstore_dir).mkdir(parents=True, exist_ok=True)
