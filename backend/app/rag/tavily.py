"""Tavily web search and URL extraction helpers."""

import httpx
from langchain_core.documents import Document

from app.core.config import settings

TAVILY_SEARCH_URL = "https://api.tavily.com/search"
TAVILY_EXTRACT_URL = "https://api.tavily.com/extract"


def tavily_configured() -> bool:
    key = settings.tavily_api_key.strip()
    return bool(key) and not key.startswith("tvly-...")


def search_web(query: str, max_results: int = 5) -> list[Document]:
    """Run a Tavily search and return results as LangChain Documents."""
    if not tavily_configured():
        raise ValueError("TAVILY_API_KEY is not configured.")

    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "max_results": max_results,
        "include_answer": False,
        "search_depth": "basic",
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(TAVILY_SEARCH_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    documents: list[Document] = []
    for item in data.get("results", []):
        content = (item.get("content") or "").strip()
        url = item.get("url") or "web"
        title = item.get("title") or url
        if not content:
            continue
        documents.append(
            Document(
                page_content=content,
                metadata={
                    "filename": title,
                    "source_url": url,
                    "source_type": "tavily_search",
                    "doc_id": "web",
                },
            )
        )
    return documents


def extract_url(url: str) -> list[Document]:
    """Extract page text from a URL using Tavily Extract."""
    if not tavily_configured():
        raise ValueError("TAVILY_API_KEY is not configured.")

    payload = {
        "api_key": settings.tavily_api_key,
        "urls": [url],
    }
    with httpx.Client(timeout=45.0) as client:
        response = client.post(TAVILY_EXTRACT_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    results = data.get("results") or []
    if not results:
        failed = data.get("failed_results") or []
        detail = failed[0].get("error") if failed else "No content extracted"
        raise ValueError(f"Could not extract URL: {detail}")

    documents: list[Document] = []
    for item in results:
        content = (item.get("raw_content") or item.get("content") or "").strip()
        page_url = item.get("url") or url
        if not content:
            continue
        documents.append(
            Document(
                page_content=content,
                metadata={
                    "source": page_url,
                    "source_url": page_url,
                    "source_type": "url",
                    "filename": page_url,
                },
            )
        )

    if not documents:
        raise ValueError("Extracted page contained no usable text.")

    return documents
