// Client-side API wrapper. Calls Next.js proxy routes so the httpOnly
// session cookie is forwarded server-side as a Bearer token to the backend.

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, options);

  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail ?? data.error ?? message;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export interface DocumentMeta {
  id: string;
  filename: string;
  num_chunks: number;
  uploaded_at: string;
  status: string;
  user_id?: string;
}

export interface SessionSummary {
  id: string;
  title: string | null;
  document_ids: string[];
  created_at: string;
  updated_at: string | null;
}

export interface ChatMessageOut {
  id: string;
  role: string;
  content: string;
  sources: { content: string; metadata: Record<string, unknown> }[];
  created_at: string;
}

export interface SessionDetail {
  session: SessionSummary;
  messages: ChatMessageOut[];
}

export interface ChatQueryResponse {
  answer: string;
  sources: { content: string; metadata: Record<string, unknown> }[];
  session_id: string;
  answer_found: boolean;
  suggest_web_search: boolean;
}

export const api = {
  chat: {
    query: (
      question: string,
      sessionId: string,
      options: { useWebSearch?: boolean; persistUserMessage?: boolean } = {},
    ) =>
      request<ChatQueryResponse>("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          session_id: sessionId,
          use_web_search: options.useWebSearch ?? false,
          persist_user_message: options.persistUserMessage ?? true,
        }),
      }),
    createSession: (title: string | null, documentIds: string[]) =>
      request<SessionSummary>("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, document_ids: documentIds }),
      }),
    listSessions: () =>
      request<{ sessions: SessionSummary[] }>("/api/chat/sessions"),
    getSession: (sessionId: string) =>
      request<SessionDetail>(`/api/chat/sessions/${sessionId}`),
    updateSessionDocuments: (sessionId: string, documentIds: string[]) =>
      request<SessionSummary>(`/api/chat/sessions/${sessionId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: documentIds }),
      }),
  },
  documents: {
    upload: async (file: File): Promise<DocumentMeta> => {
      const form = new FormData();
      form.append("file", file);
      return request<DocumentMeta>("/api/documents/upload", {
        method: "POST",
        body: form,
      });
    },
    ingestUrl: (url: string) =>
      request<DocumentMeta>("/api/documents/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }),
    list: () =>
      request<{ documents: DocumentMeta[] }>("/api/documents/list"),
  },
};
