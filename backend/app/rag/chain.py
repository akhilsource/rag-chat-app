"""End-to-end RAG chain: retrieve -> optional web search -> LLM -> answer."""

from langchain_core.documents import Document
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.rag.retriever import get_relevant_chunks
from app.rag.tavily import search_web, tavily_configured

_MAX_HISTORY_MESSAGES = 6

_SYSTEM_PROMPT = (
    "You are a helpful assistant. Answer using the provided context "
    "(uploaded documents and/or web results) and the conversation so far. "
    "You may give summaries, comparisons, ratings, and opinions when the user "
    "asks for them, as long as every point is grounded in the context. "
    "Do not invent facts such as employers, dates, skills, or credentials that "
    "are not supported by the context. "
    "If web results are present, use them for general knowledge and current "
    "facts even when uploaded documents are about something else. "
    "If the context truly lacks the information needed, say you don't know. "
    "When using web results, briefly mention the source title or URL. "
    "Format answers in clear Markdown: use numbered lists for multiple points, "
    "put a blank line between sections, and use **bold** for short labels."
)

_UNANSWERED_MARKERS = (
    "i don't know",
    "i do not know",
    "don't have enough",
    "do not have enough",
    "not enough information",
    "insufficient information",
    "couldn't find",
    "could not find",
    "no relevant",
    "cannot answer",
    "can't answer",
    "unable to answer",
)


def _format_context(chunks: list[Document]) -> str:
    parts: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        source = chunk.metadata.get("filename") or chunk.metadata.get("source_url") or "unknown"
        source_type = chunk.metadata.get("source_type", "document")
        label = "Web" if source_type in {"tavily_search", "url"} else "Doc"
        parts.append(f"[Source {i} · {label} · {source}]\n{chunk.page_content}")
    return "\n\n".join(parts)


def _looks_unanswered(answer: str) -> bool:
    lower = answer.lower().strip()
    if not lower:
        return True
    return any(marker in lower for marker in _UNANSWERED_MARKERS)


def _is_web_chunk(chunk: Document) -> bool:
    return chunk.metadata.get("source_type") in {"tavily_search", "url"}


def _build_retrieval_query(question: str, history: list[dict[str, str]] | None = None) -> str:
    """Combine recent chat turns with the current question for better doc retrieval."""
    if not history:
        return question

    parts: list[str] = []
    for msg in history[-_MAX_HISTORY_MESSAGES:]:
        role = msg.get("role", "").strip()
        content = msg.get("content", "").strip()
        if role in {"user", "assistant"} and content:
            parts.append(f"{role}: {content}")
    parts.append(f"user: {question.strip()}")
    return "\n".join(parts)


def _history_for_llm(
    history: list[dict[str, str]] | None,
    *,
    drop_unanswered: bool = False,
) -> list[dict[str, str]]:
    if not history:
        return []

    messages: list[dict[str, str]] = []
    for msg in history[-_MAX_HISTORY_MESSAGES:]:
        role = msg.get("role", "").strip()
        content = msg.get("content", "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        if drop_unanswered and role == "assistant" and _looks_unanswered(content):
            continue
        messages.append({"role": role, "content": content})
    return messages


def _build_llm_messages(
    question: str,
    context: str,
    history: list[dict[str, str]] | None = None,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": _SYSTEM_PROMPT}]
    messages.extend(history or [])
    messages.append(
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}",
        }
    )
    return messages


def _result(
    answer: str,
    sources: list[Document],
    *,
    answer_found: bool,
    suggest_web_search: bool = False,
) -> dict:
    return {
        "answer": answer,
        "sources": sources,
        "answer_found": answer_found,
        "suggest_web_search": suggest_web_search,
    }


def run_rag_chain(
    question: str,
    doc_ids: list[str],
    *,
    use_web_search: bool = False,
    history: list[dict[str, str]] | None = None,
) -> dict:
    """Retrieve document context, optionally search the web, then answer."""
    doc_chunks: list[Document] = []
    web_chunks: list[Document] = []
    retrieval_query = _build_retrieval_query(question, history)

    if doc_ids:
        doc_chunks.extend(get_relevant_chunks(retrieval_query, doc_ids=doc_ids))

    if use_web_search:
        if not tavily_configured():
            return _result(
                "Web search is enabled, but TAVILY_API_KEY is not configured "
                "on the backend.",
                [],
                answer_found=False,
            )
        try:
            # Use the clean question only — history pollutes Tavily badly.
            web_chunks.extend(search_web(question.strip(), max_results=5))
        except Exception as exc:
            if not doc_chunks:
                return _result(
                    f"Web search failed: {exc}",
                    [],
                    answer_found=False,
                )

    if not doc_ids and not use_web_search:
        return _result(
            "I couldn't find an answer in this topic's documents.",
            [],
            answer_found=False,
            suggest_web_search=True,
        )

    # Prefer web results when the user explicitly asked to search the web.
    if use_web_search and web_chunks:
        chunks = web_chunks + doc_chunks
    else:
        chunks = doc_chunks + web_chunks

    if not chunks:
        return _result(
            "I couldn't find relevant information in the available sources.",
            [],
            answer_found=False,
            suggest_web_search=not use_web_search,
        )

    context = _format_context(chunks)
    llm = ChatOpenAI(
        model=settings.chat_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )
    llm_history = _history_for_llm(history, drop_unanswered=use_web_search)
    messages = _build_llm_messages(question, context, llm_history)
    response = llm.invoke(messages)
    answer = response.content if isinstance(response.content, str) else str(response.content)
    unanswered = _looks_unanswered(answer)

    # Return web sources first in the response payload for clearer UI citations.
    sources = [c for c in chunks if _is_web_chunk(c)] + [
        c for c in chunks if not _is_web_chunk(c)
    ]
    return _result(
        answer,
        sources,
        answer_found=not unanswered,
        suggest_web_search=unanswered and not use_web_search,
    )
