"""
FastAPI application entrypoint.

Wires together:
- CORS (so the Next.js frontend on a different origin can call this API)
- Route modules (auth, chat, documents)
- Startup/shutdown hooks (e.g. load vector store, warm up embeddings)

TODO: implement.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from app.core.config import settings
# from app.api.routes import auth, chat, documents

app = FastAPI(title="RAG Chat API")

# TODO: restrict allow_origins to settings.BACKEND_CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: mount routers, e.g.
# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(chat.router, prefix="/chat", tags=["chat"])
# app.include_router(documents.router, prefix="/documents", tags=["documents"])


@app.get("/health")
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}
