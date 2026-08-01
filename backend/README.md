# RAG Chat — Backend (Python)

This is the **file/folder structure only** for the Python RAG backend — every
module is stubbed with docstrings, expected function signatures and TODOs so
you (or Claude Code) can fill in the real logic next.

Suggested stack: **FastAPI + LangChain + Postgres/pgvector** + **PyJWT** for
verifying the JWTs issued by the Next.js frontend.

## Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, CORS, router mounting
│   ├── core/
│   │   ├── config.py           # Settings (env vars) via pydantic-settings
│   │   └── security.py         # JWT create/verify, password hashing
│   ├── api/
│   │   ├── deps.py             # Shared FastAPI dependencies (get_current_user)
│   │   └── routes/
│   │       ├── auth.py         # /auth/register /auth/login /auth/verify
│   │       ├── chat.py         # /chat/query  /chat/stream  /chat/history
│   │       └── documents.py    # /documents/upload /documents/list /documents/delete
│   ├── rag/
│   │   ├── loader.py           # Load PDFs / docs / URLs into raw text
│   │   ├── splitter.py         # Chunking strategy
│   │   ├── embeddings.py       # Embedding model wrapper
│   │   ├── vector_store.py     # pgvector store (add / search / delete)
│   │   ├── retriever.py        # Retrieval logic (top-k, filters)
│   │   └── chain.py            # RAG chain: retrieve -> prompt -> LLM -> answer
│   ├── models/                 # ORM models (SQLAlchemy)
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── chunk.py            # Embedded chunks (pgvector)
│   │   └── chat.py
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── chat.py
│   │   └── document.py
│   ├── db/
│   │   ├── base.py             # Declarative base / metadata
│   │   └── session.py          # DB engine + session factory
│   ├── services/
│   │   ├── auth_service.py      # Business logic for auth
│   │   └── rag_service.py       # Business logic tying rag/* together
│   └── utils/
│       └── logger.py
├── data/
│   └── uploads/                 # Raw uploaded documents
├── tests/
│   ├── test_auth.py
│   └── test_chat.py
├── requirements.txt
├── .env.example
└── Dockerfile
```

Embeddings live in Postgres via **pgvector** (table `document_chunks`). Run
Postgres with the extension enabled — for local/dev use the root
`docker-compose.yml` (`pgvector/pgvector:pg16`).

## How auth ties to the frontend

The Next.js frontend handles **sign-up/login UI via Firebase Authentication**,
then exchanges the Firebase ID token for a **JWT session cookie** (see
`frontend/src/app/api/auth/session/route.ts`). That same JWT is sent as
`Authorization: Bearer <token>` on every request to this backend. This
backend never talks to Firebase directly — it only needs to **verify the
JWT** (see `app/core/security.py` + `app/api/deps.py`), so any frontend auth
provider can be swapped later without touching this API.

## Getting started

```bash
# From repo root — Postgres with pgvector
docker compose up -d db

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set OPENAI_API_KEY, JWT_SECRET, DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

`DATABASE_URL` must point at Postgres with **pgvector** (the extension is
created on startup). Re-upload documents after switching from FAISS — old
local index files are not migrated.
