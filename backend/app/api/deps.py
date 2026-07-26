"""
Shared FastAPI dependencies.

TODO: implement get_current_user, e.g.

    from fastapi import Depends, HTTPException, status
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from app.core.security import decode_access_token

    bearer_scheme = HTTPBearer()

    def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    ) -> dict:
        try:
            payload = decode_access_token(credentials.credentials)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return payload  # e.g. {"sub": user_id, "email": ...}
"""
