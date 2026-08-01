"""Database engine + session factory."""

from collections.abc import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base

engine = None
SessionLocal = None

if settings.database_url:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    @event.listens_for(engine, "connect")
    def _register_pgvector(dbapi_connection, _connection_record) -> None:
        from pgvector.psycopg2 import register_vector

        try:
            register_vector(dbapi_connection)
        except Exception:
            # Extension may not exist yet; init_db creates it on startup.
            pass


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create pgvector extension and tables if they do not exist."""
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
