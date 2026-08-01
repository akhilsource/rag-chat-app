"""pgvector vector store: add, search, delete embedded chunks."""

from langchain_core.documents import Document
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.chunk import DocumentChunk
from app.rag.embeddings import get_embedding_model


def _require_db() -> None:
    if SessionLocal is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. Set it to a Postgres URL with pgvector."
        )


def add_documents(chunks: list[Document], ids: list[str]) -> None:
    """Embed chunks and persist them in Postgres via pgvector."""
    if not chunks:
        return
    if len(chunks) != len(ids):
        raise ValueError("chunks and ids must have the same length")

    _require_db()
    embeddings = get_embedding_model().embed_documents(
        [chunk.page_content for chunk in chunks]
    )

    rows = [
        DocumentChunk(
            id=chunk_id,
            doc_id=str(chunk.metadata.get("doc_id", "")),
            filename=str(chunk.metadata.get("filename", "")),
            chunk_index=int(chunk.metadata.get("chunk_index", 0)),
            content=chunk.page_content,
            embedding=embedding,
        )
        for chunk_id, chunk, embedding in zip(ids, chunks, embeddings)
    ]

    db = SessionLocal()
    try:
        db.add_all(rows)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def similarity_search(
    query: str,
    k: int = 4,
    *,
    doc_ids: list[str] | None = None,
) -> list[Document]:
    """Return the top-k most similar chunks, optionally scoped to doc_ids."""
    _require_db()
    if doc_ids is not None and not doc_ids:
        return []

    query_embedding = get_embedding_model().embed_query(query)

    db = SessionLocal()
    try:
        stmt = select(DocumentChunk)
        if doc_ids is not None:
            stmt = stmt.where(DocumentChunk.doc_id.in_(doc_ids))
        stmt = stmt.order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(k)

        rows = db.execute(stmt).scalars().all()
        return [
            Document(
                page_content=row.content,
                metadata={
                    "doc_id": row.doc_id,
                    "filename": row.filename,
                    "chunk_index": row.chunk_index,
                },
            )
            for row in rows
        ]
    finally:
        db.close()


def delete_by_doc_id(doc_id: str) -> int:
    """Remove all chunks belonging to a document. Returns count removed."""
    _require_db()
    db = SessionLocal()
    try:
        result = db.execute(
            delete(DocumentChunk).where(DocumentChunk.doc_id == doc_id)
        )
        db.commit()
        return int(result.rowcount or 0)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
