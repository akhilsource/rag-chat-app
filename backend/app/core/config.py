"""
Centralized app settings, loaded from environment variables (.env).

TODO: implement using pydantic-settings, e.g.

    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        app_name: str = "RAG Chat API"
        environment: str = "development"
        backend_cors_origins: list[str] = ["http://localhost:3000"]

        jwt_secret: str
        jwt_algorithm: str = "HS256"
        jwt_expire_minutes: int = 60

        openai_api_key: str
        embedding_model: str = "text-embedding-3-small"
        chat_model: str = "gpt-4o-mini"

        vectorstore_dir: str = "./data/vectorstore"
        database_url: str | None = None

        class Config:
            env_file = ".env"

    settings = Settings()
"""
