# RAG Chat App

A retrieval-augmented chat application: a **Next.js frontend** (fully built
signup/login UI, Firebase authentication, JWT session cookies) and a
**Python RAG backend** (FastAPI + LangChain, structure only — ready for you
to fill in the retrieval/generation logic).

```
rag-chat-app/
├── frontend/     # Next.js 14 (App Router) + TypeScript + Tailwind
└── backend/      # Python FastAPI + LangChain RAG service (skeleton)
```

## How auth works, end to end

1. **Sign up / log in** — the user fills in the interactive form on
   `/signup` or `/login`. This calls **Firebase Authentication** directly
   from the browser (email + password).
2. **Session exchange** — once Firebase confirms the sign-in, the frontend
   sends the Firebase ID token to `POST /api/auth/session`. That route
   verifies the token with the Firebase Admin SDK, then signs the app's
   **own JWT** and stores it in an `httpOnly` cookie.
3. **Route protection** — `frontend/src/middleware.ts` checks that JWT
   cookie on every request to `/chat/*`, redirecting signed-out users to
   `/login` and signed-in users away from the auth pages.
4. **Talking to the RAG backend** — the same JWT is sent as
   `Authorization: Bearer <token>` to the Python backend, which verifies it
   with the shared `JWT_SECRET` (see `backend/app/core/security.py`). The
   backend never talks to Firebase directly, so the auth provider can be
   swapped later without touching the RAG API.
5. **Signing out** — `POST /api/auth/logout` clears the cookie, and the
   client also signs out of the Firebase SDK.

## Getting started

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Firebase + JWT_SECRET
npm run dev                        # http://localhost:3000
```

You'll need a Firebase project (Authentication → Sign-in method → enable
Email/Password) for the client config, and a **service account key**
(Project settings → Service accounts → Generate new private key) for the
`FIREBASE_ADMIN_*` vars used by `lib/firebase/admin.ts`.

### Backend

```bash
# From repo root — start Postgres with pgvector
docker compose up -d db

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # same JWT_SECRET as the frontend; set DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

Embeddings are stored in Postgres via **pgvector** (not local FAISS files).
Use a pgvector-enabled Postgres image (see root `docker-compose.yml`).
After switching from FAISS, re-upload your documents.

## Design notes (frontend)

The auth pages use a parchment-on-near-black palette (`ink` / `paper` /
`teal` / `amber` in `tailwind.config.ts`), pairing a serif display face
(Fraunces) with Inter for UI text and JetBrains Mono for small labels — a
nod to research notebooks and highlighted source text. The signature visual
is the shimmering "citation strip" beside the auth card, standing in for
retrieved document snippets.
