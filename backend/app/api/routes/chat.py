"""
Chat / RAG query routes.

Suggested endpoints:

    POST /chat/query    -> {question, session_id} -> {answer, sources}
    POST /chat/stream   -> same, but Server-Sent-Events / chunked streaming
    GET  /chat/history  -> list past messages for a session_id

TODO: implement, wiring into app.rag.chain.run_rag_chain(...)
"""
from fastapi import APIRouter

router = APIRouter()

# @router.post("/query")
# def query(request: ChatRequest, current_user: dict = Depends(get_current_user)):
#     return run_rag_chain(request.question, session_id=request.session_id)
