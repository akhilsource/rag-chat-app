"""FAISS vector store: add, search, delete embedded chunks."""

from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.core.config import settings
from app.rag.embeddings import get_embedding_model

_INDEX_DIR = "faiss_index"


def _index_path() -> Path:
    return Path(settings.vectorstore_dir) / _INDEX_DIR


def _index_exists() -> bool:
    path = _index_path()
    return path.exists() and any(path.iterdir())


def load_or_create_vectorstore() -> FAISS | None:
    """Load persisted FAISS index, or None if no index exists yet."""
    if not _index_exists():
        return None
    return FAISS.load_local(
        str(_index_path()),
        get_embedding_model(),
        allow_dangerous_deserialization=True,
    )


def save_vectorstore(store: FAISS) -> None:
    path = _index_path()
    path.mkdir(parents=True, exist_ok=True)
    store.save_local(str(path))


def add_documents(chunks: list[Document], ids: list[str]) -> None:
    """Embed chunks and persist them in the FAISS index."""
    if not chunks:
        return

    store = load_or_create_vectorstore()
    if store is None:
        store = FAISS.from_documents(chunks, get_embedding_model(), ids=ids)
    else:
        store.add_documents(chunks, ids=ids)
    save_vectorstore(store)


def similarity_search(query: str, k: int = 4) -> list[Document]:
    """Return the top-k most similar chunks for a query."""
    store = load_or_create_vectorstore()
    if store is None:
        return []
    return store.similarity_search(query, k=k)


def delete_by_doc_id(doc_id: str) -> int:
    """Remove all chunks belonging to a document. Returns count removed."""
    store = load_or_create_vectorstore()
    if store is None:
        return 0

    ids_to_delete = [
        doc_id_key
        for doc_id_key, doc in store.docstore._dict.items()
        if doc.metadata.get("doc_id") == doc_id
    ]
    if not ids_to_delete:
        return 0

    store.delete(ids_to_delete)
    save_vectorstore(store)
    return len(ids_to_delete)
