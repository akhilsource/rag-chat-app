# RAG Chat — Backend (Python)

This is the **file/folder structure only** for the Python RAG backend — every
module is stubbed with docstrings, expected function signatures and TODOs so
you (or Claude Code) can fill in the real logic next.

Suggested stack: **FastAPI + LangChain/LlamaIndex + a vector DB** (FAISS /
Chroma / Pinecone) + **PyJWT** for verifying the JWTs issued by the Next.js
frontend.

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
│   │   ├── vector_store.py     # Vector DB client (add / search / delete)
│   │   ├── retriever.py        # Retrieval logic (top-k, reranking, filters)
│   │   └── chain.py            # RAG chain: retrieve -> prompt -> LLM -> answer
│   ├── models/                 # ORM models (SQLAlchemy) if using a relational DB
│   │   ├── user.py
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
│   ├── uploads/                 # Raw uploaded documents
│   └── vectorstore/             # Persisted vector index (e.g. FAISS files)
├── tests/
│   ├── test_auth.py
│   └── test_chat.py
├── requirements.txt
├── .env.example
└── Dockerfile
```

## How auth ties to the frontend

The Next.js frontend handles **sign-up/login UI via Firebase Authentication**,
then exchanges the Firebase ID token for a **JWT session cookie** (see
`frontend/src/app/api/auth/session/route.ts`). That same JWT is sent as
`Authorization: Bearer <token>` on every request to this backend. This
backend never talks to Firebase directly — it only needs to **verify the
JWT** (see `app/core/security.py` + `app/api/deps.py`), so any frontend auth
provider can be swapped later without touching this API.

## Getting started (once implemented)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
