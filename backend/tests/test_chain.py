"""Unit tests for RAG chain helpers and web-search suggestion logic."""

from unittest.mock import MagicMock, patch

from langchain_core.documents import Document

from app.rag.chain import (
    _build_llm_messages,
    _build_retrieval_query,
    run_rag_chain,
)


def test_build_retrieval_query_includes_history_and_question():
    history = [
        {"role": "user", "content": "What is their latest role?"},
        {"role": "assistant", "content": "They are a Senior Engineer at Acme."},
    ]
    query = _build_retrieval_query("How do you rate it?", history)
    assert "What is their latest role?" in query
    assert "Senior Engineer at Acme" in query
    assert query.endswith("user: How do you rate it?")


def test_build_retrieval_query_without_history():
    assert _build_retrieval_query("How do you rate this resume?", None) == (
        "How do you rate this resume?"
    )


def test_build_llm_messages_includes_history_before_context_question():
    history = [{"role": "user", "content": "Summarize this resume."}]
    messages = _build_llm_messages("How do you rate it?", "Resume text here.", history)
    assert messages[0]["role"] == "system"
    assert "ratings" in messages[0]["content"].lower()
    assert messages[1] == {"role": "user", "content": "Summarize this resume."}
    assert "Resume text here." in messages[2]["content"]
    assert "How do you rate it?" in messages[2]["content"]


@patch("app.rag.chain.ChatOpenAI")
@patch("app.rag.chain.get_relevant_chunks")
def test_run_rag_chain_does_not_suggest_web_search_when_chunks_exist(mock_get_chunks, mock_llm_cls):
    mock_get_chunks.return_value = [
        Document(page_content="5 years Python experience.", metadata={"doc_id": "d1"})
    ]
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="I don't know.")
    mock_llm_cls.return_value = mock_llm

    result = run_rag_chain(
        "How do you rate it?",
        doc_ids=["d1"],
        history=[{"role": "user", "content": "Tell me about their skills."}],
    )

    assert result["suggest_web_search"] is False
    assert result["answer_found"] is False
    mock_get_chunks.assert_called_once()
    retrieval_query = mock_get_chunks.call_args.args[0]
    assert "Tell me about their skills." in retrieval_query
    assert "How do you rate it?" in retrieval_query


@patch("app.rag.chain.get_relevant_chunks")
def test_run_rag_chain_suggests_web_search_when_no_chunks(mock_get_chunks):
    mock_get_chunks.return_value = []

    result = run_rag_chain("How do you rate it?", doc_ids=["d1"])

    assert result["suggest_web_search"] is True
    assert result["answer_found"] is False


def test_run_rag_chain_suggests_web_search_when_no_documents():
    result = run_rag_chain("How do you rate it?", doc_ids=[])

    assert result["suggest_web_search"] is True
    assert result["answer_found"] is False
