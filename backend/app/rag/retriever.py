"""Retrieval logic on top of the vector store."""

from langchain_core.documents import Document

from app.rag.vector_store import similarity_search


def get_relevant_chunks(
    query: str,
    doc_ids: list[str],
    k: int = 4,
) -> list[Document]:
    """Return top-k relevant chunks scoped to the given document ids."""
    if not doc_ids:
        return []
    return similarity_search(query, k=k, doc_ids=doc_ids)
