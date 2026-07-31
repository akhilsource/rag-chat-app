"""
Auth routes.

Firebase + the Next.js JWT session route handle sign-up/login.
These endpoints verify tokens and return the current user's profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from jwt import InvalidTokenError

from app.api.deps import get_current_user
from app.core.security import decode_access_token
from app.schemas.auth import TokenResponse, UserProfile, VerifyTokenRequest

router = APIRouter()


@router.post("/verify", response_model=TokenResponse)
def verify_token(body: VerifyTokenRequest) -> TokenResponse:
    """Validate a JWT and return its claims."""
    try:
        claims = decode_access_token(body.token)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    return TokenResponse(valid=True, claims=claims)


@router.get("/me", response_model=UserProfile)
def read_current_user(current_user: dict = Depends(get_current_user)) -> UserProfile:
    """Return the authenticated user's profile from JWT claims."""
    return UserProfile(
        uid=str(current_user.get("sub", "")),
        email=current_user.get("email"),
        display_name=current_user.get("name") or current_user.get("display_name"),
    )
