"""
Vector database client: add / search / delete embedded chunks.

Default suggestion: FAISS persisted to app/data/vectorstore for a simple
local setup; swap for Chroma / Pinecone / pgvector for production.

TODO: implement, e.g.

    from langchain_community.vectorstores import FAISS
    from app.rag.embeddings import get_embedding_model
    from app.core.config import settings

    def load_or_create_vectorstore():
        ...

    def add_documents(chunks):
        ...

    def similarity_search(query: str, k: int = 4):
        ...
"""
