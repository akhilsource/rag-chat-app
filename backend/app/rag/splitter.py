"""Chunking strategy for loaded documents."""

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(
    docs: list[Document],
    *,
    doc_id: str,
    filename: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[Document]:
    """Split documents into chunks and attach doc metadata to each chunk."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunks = splitter.split_documents(docs)
    for i, chunk in enumerate(chunks):
        chunk.metadata["doc_id"] = doc_id
        chunk.metadata["filename"] = filename
        chunk.metadata["chunk_index"] = i
    return chunks
