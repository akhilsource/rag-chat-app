"""FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, chat, documents
from app.core.config import settings
from app.db.session import init_db
from app.services.rag_service import ensure_data_dirs

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_data_dirs()
    if settings.database_url:
        try:
            init_db()
            logger.info("Database tables initialized")
        except Exception as exc:
            logger.error("Failed to initialize database: %s", exc)
            raise
    else:
        logger.warning(
            "DATABASE_URL not set — session persistence and pgvector embeddings disabled"
        )
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])


@app.get("/health")
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}
