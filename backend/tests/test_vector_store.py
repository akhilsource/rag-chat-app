"""Tests for the pgvector-backed vector store."""

from unittest.mock import MagicMock, patch

from langchain_core.documents import Document

from app.rag import vector_store


def test_similarity_search_returns_empty_when_doc_ids_empty():
    result = vector_store.similarity_search("hello", k=4, doc_ids=[])
    assert result == []


def test_add_documents_noops_on_empty_chunks():
    # Should return without touching the DB or embeddings
    vector_store.add_documents([], [])


def test_add_documents_persists_embeddings():
    chunks = [
        Document(
            page_content="hello world",
            metadata={"doc_id": "doc-1", "filename": "a.txt", "chunk_index": 0},
        )
    ]
    mock_embeddings = MagicMock()
    mock_embeddings.embed_documents.return_value = [[0.1] * 8]
    mock_db = MagicMock()
    mock_session_local = MagicMock(return_value=mock_db)

    with patch("app.rag.vector_store.SessionLocal", mock_session_local), patch(
        "app.rag.vector_store.get_embedding_model", return_value=mock_embeddings
    ):
        vector_store.add_documents(chunks, ids=["doc-1:0"])

    mock_embeddings.embed_documents.assert_called_once_with(["hello world"])
    mock_db.add_all.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()


def test_delete_by_doc_id():
    mock_result = MagicMock()
    mock_result.rowcount = 3
    mock_db = MagicMock()
    mock_db.execute.return_value = mock_result
    mock_session_local = MagicMock(return_value=mock_db)

    with patch("app.rag.vector_store.SessionLocal", mock_session_local):
        removed = vector_store.delete_by_doc_id("doc-1")

    assert removed == 3
    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()
