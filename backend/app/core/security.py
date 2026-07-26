"""
JWT verification (and optional creation) for this API.

The Next.js frontend signs JWTs (see frontend/src/lib/auth/jwt.ts) after a
successful Firebase sign-in, using a shared secret (JWT_SECRET). This module
only needs to VERIFY those tokens on incoming requests.

TODO: implement using PyJWT, e.g.

    import jwt
    from app.core.config import settings

    def decode_access_token(token: str) -> dict:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

    def create_access_token(payload: dict) -> str:
        # only needed if the backend itself issues tokens too
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
"""
