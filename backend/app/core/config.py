"""Centralized app settings, loaded from environment variables (.env)."""

from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_cors_origins(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "RAG Chat API"
    environment: str = "development"
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    jwt_secret: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    tavily_api_key: str = ""

    vectorstore_dir: str = "./data/vectorstore"
    uploads_dir: str = "./data/uploads"
    database_url: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        return _parse_cors_origins(self.backend_cors_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
