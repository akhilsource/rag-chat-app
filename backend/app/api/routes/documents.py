"""
Document ingestion routes for the RAG knowledge base.

Suggested endpoints:

    POST   /documents/upload  -> accept file(s), load + chunk + embed + store
    GET    /documents/list    -> list ingested documents for the current user
    DELETE /documents/{id}    -> remove a document + its vectors

TODO: implement, wiring into app.rag.loader / splitter / embeddings / vector_store
"""
from fastapi import APIRouter

router = APIRouter()
