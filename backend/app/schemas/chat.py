"""
Pydantic request/response schemas for chat routes.

TODO: implement, e.g.

    from pydantic import BaseModel

    class ChatRequest(BaseModel):
        question: str
        session_id: str | None = None

    class SourceChunk(BaseModel):
        content: str
        metadata: dict

    class ChatResponse(BaseModel):
        answer: str
        sources: list[SourceChunk] = []
"""
