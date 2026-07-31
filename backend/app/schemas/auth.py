"""Pydantic request/response schemas for auth routes."""

from pydantic import BaseModel, Field


class VerifyTokenRequest(BaseModel):
    token: str


class UserProfile(BaseModel):
    uid: str
    email: str | None = None
    display_name: str | None = None


class TokenResponse(BaseModel):
    """Returned by /auth/verify with the decoded claims."""

    valid: bool = True
    claims: dict = Field(default_factory=dict)
