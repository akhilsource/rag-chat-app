"""
Auth routes.

Since Firebase + the Next.js JWT session route already handle sign-up/login,
this file's job is usually just to VERIFY a token and return the current
user's profile — but it's stubbed out in case you want the backend to also
own a users table.

Suggested endpoints:

    POST /auth/verify   -> validate the JWT, return decoded user claims
    GET  /auth/me        -> return the current user's profile (requires auth)

TODO: implement using FastAPI APIRouter + app.api.deps.get_current_user
"""
from fastapi import APIRouter

router = APIRouter()

# @router.get("/me")
# def read_current_user(current_user: dict = Depends(get_current_user)):
#     return current_user
