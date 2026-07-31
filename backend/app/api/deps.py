"""Shared FastAPI dependencies."""

from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.services.chat_service import ensure_user

bearer_scheme = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL is not configured",
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Return decoded JWT claims for the authenticated user."""
    try:
        payload = decode_access_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def get_current_user_db(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> tuple[Session, dict, str]:
    """Ensure user row exists and return db, claims, and user_id."""
    user_id = str(current_user["sub"])
    ensure_user(
        db,
        user_id=user_id,
        email=current_user.get("email"),
        display_name=current_user.get("name") or current_user.get("display_name"),
    )
    return db, current_user, user_id

