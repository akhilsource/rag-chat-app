"""JWT verification (and optional creation) for this API."""

from datetime import datetime, timedelta, timezone

import jwt
from jwt import InvalidTokenError

from app.core.config import settings


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT issued by the frontend (or this API)."""
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )


def create_access_token(payload: dict, expires_minutes: int | None = None) -> str:
    """Create a JWT. Useful for local testing when the frontend is not running."""
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.jwt_expire_minutes
    )
    to_encode["exp"] = expire
    return jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


class TokenError(InvalidTokenError):
    """Raised when a token is missing required claims or is otherwise invalid."""
