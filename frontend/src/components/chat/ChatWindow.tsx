"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ChatMessageOut } from "@/lib/api";

interface MessageSource {
  title: string;
  url?: string;
  kind: "web" | "doc";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: MessageSource[];
}

interface ChatWindowProps {
  sessionId: string | null;
  initialMessages?: ChatMessageOut[];
}

function sourceLabel(metadata: Record<string, unknown>): MessageSource {
  const sourceType = String(metadata.source_type ?? "document");
  const title = String(metadata.filename ?? metadata.source_url ?? "Source");
  const url =
    typeof metadata.source_url === "string" && metadata.source_url.startsWith("http")
      ? metadata.source_url
      : undefined;
  return {
    title,
    url,
    kind: sourceType === "tavily_search" || sourceType === "url" ? "web" : "doc",
  };
}

function toUiMessages(messages: ChatMessageOut[]): Message[] {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: (m.sources ?? []).map((s) => sourceLabel(s.metadata)),
  }));
}

function uniqueSources(sources: MessageSource[]): MessageSource[] {
  const seen = new Set<string>();
  const out: MessageSource[] = [];
  for (const source of sources) {
    const key = `${source.kind}:${source.url ?? source.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source);
  }
  return out.slice(0, 6);
}

export function ChatWindow({ sessionId, initialMessages = [] }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingWebSearch, setPendingWebSearch] = useState<string | null>(null);
  const [searchingWeb, setSearchingWeb] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPendingWebSearch(null);
    if (!sessionId) {
      setMessages([
        {
          role: "assistant",
          content: "Select a topic to upload documents and start chatting.",
        },
      ]);
      return;
    }
    if (initialMessages.length > 0) {
      setMessages(toUiMessages(initialMessages));
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Ask a question about this topic's documents.",
        },
      ]);
    }
  }, [sessionId, initialMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, pendingWebSearch]);

  async function handleSend(question: string) {
    if (!sessionId || loading || pendingWebSearch) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    setSearchingWeb(false);
    try {
      const response = await api.chat.query(question, sessionId, {
        useWebSearch: false,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: uniqueSources(response.sources.map((s) => sourceLabel(s.metadata))),
        },
      ]);
      if (response.suggest_web_search) {
        setPendingWebSearch(question);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Is the backend running on port 8000?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleWebSearch(accept: boolean) {
    if (!sessionId || !pendingWebSearch) return;
    const question = pendingWebSearch;
    setPendingWebSearch(null);
    if (!accept) return;

    setLoading(true);
    setSearchingWeb(true);
    try {
      const response = await api.chat.query(question, sessionId, {
        useWebSearch: true,
        persistUserMessage: false,
      });
      // Replace the previous "I don't know" instead of stacking another one.
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].role === "assistant") {
            next[i] = {
              role: "assistant",
              content: response.answer,
              sources: uniqueSources(response.sources.map((s) => sourceLabel(s.metadata))),
            };
            return next;
          }
        }
        return [
          ...next,
          {
            role: "assistant",
            content: response.answer,
            sources: uniqueSources(response.sources.map((s) => sourceLabel(s.metadata))),
          },
        ];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Web search failed. Is the backend running on port 8000?",
        },
      ]);
    } finally {
      setLoading(false);
      setSearchingWeb(false);
    }
  }

  return (
    <GlassCard sheen className="flex h-[min(70vh,720px)] flex-col gap-4 overflow-hidden p-5">
      <div className="shrink-0">
        <p className="label-caps">Chat</p>
        <p className="mt-1 text-sm text-muted">
          Answers are grounded in this topic&apos;s sources.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/8 bg-black/25 p-4"
      >
        {messages.map((m, i) => (
          <MessageBubble
            key={`${m.role}-${i}`}
            role={m.role}
            content={m.content}
            sources={m.sources}
          />
        ))}
        {pendingWebSearch && (
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
            <p className="text-sm text-mist/90">
              No answer found in your documents. Search the web?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleWebSearch(true)}>
                Yes, search web
              </Button>
              <Button type="button" variant="soft" onClick={() => void handleWebSearch(false)}>
                No thanks
              </Button>
            </div>
          </div>
        )}
        {loading && (
          <p className="label-caps animate-pulse-soft !text-mist/40">
            {searchingWeb ? "Searching the web…" : "Retrieving…"}
          </p>
        )}
      </div>

      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          disabled={loading || !sessionId || Boolean(pendingWebSearch)}
        />
      </div>
    </GlassCard>
  );
}
