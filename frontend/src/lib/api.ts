// Thin fetch wrapper for calling the Python RAG backend.
// The session JWT lives in an httpOnly cookie, so browser calls to our own
// Next.js API routes forward it automatically. For calls made straight from
// the browser to the Python backend's own origin, pass the token explicitly.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request to ${path} failed with ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface ChatQueryResponse {
  answer: string;
  sources: { content: string; metadata: Record<string, unknown> }[];
}

export const api = {
  chat: {
    query: (question: string, token?: string) =>
      request<ChatQueryResponse>("/chat/query", {
        method: "POST",
        body: JSON.stringify({ question }),
        token,
      }),
  },
  documents: {
    list: (token?: string) => request<{ id: string; filename: string }[]>("/documents/list", { token }),
  },
};
