"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SessionSummary } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

interface TopicCardsProps {
  onSelectTopic: (sessionId: string) => void;
  onTopicCreated: (session: SessionSummary) => void;
}

export function TopicCards({ onSelectTopic, onTopicCreated }: TopicCardsProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    api.chat
      .listSessions()
      .then((res) => setSessions(res.sessions))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load topics"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateTopic() {
    setCreating(true);
    setError(null);
    try {
      const session = await api.chat.createSession(title.trim() || null, []);
      setSessions((prev) => [session, ...prev]);
      setShowNewTopic(false);
      setTitle("");
      onTopicCreated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative z-10 animate-rise">
      <div className="mb-8">
        <p className="label-caps">Your workspace</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-mist">
          Pick a topic
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Open a topic to upload documents and ask questions. Each topic keeps its own sources.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-[var(--danger-bg)] px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {showNewTopic && (
        <GlassCard sheen className="mb-6 max-w-md space-y-3 p-5">
          <p className="label-caps">New topic</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title (e.g. Q3 report)"
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-mist outline-none placeholder:text-mist/30 focus:border-accent/70"
          />
          <div className="flex gap-2">
            <Button type="button" loading={creating} onClick={handleCreateTopic}>
              Create topic
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowNewTopic(false)}>
              Cancel
            </Button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <p className="text-sm text-faint">Loading topics…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setShowNewTopic(true)}
            className="gloss-sheen glass-soft group flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-white/20 p-6 transition duration-300 hover:border-accent/50 hover:bg-white/[0.06]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] font-display text-2xl text-accent transition group-hover:scale-105">
              +
            </span>
            <span className="font-sans text-sm font-semibold text-mist/75 group-hover:text-mist">
              New topic
            </span>
          </button>

          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectTopic(session.id)}
              className="gloss-sheen glass group flex min-h-[168px] flex-col justify-between rounded-panel p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-accent/35"
            >
              <div>
                <p className="font-display text-xl font-semibold tracking-tight text-mist">
                  {session.title || "Untitled topic"}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {session.document_ids.length > 0
                    ? `${session.document_ids.length} document(s) linked`
                    : "No documents linked yet"}
                </p>
              </div>
              <p className="label-caps !text-mist/35 group-hover:!text-accent">Open topic →</p>
            </button>
          ))}
        </div>
      )}

      {!loading && sessions.length === 0 && !showNewTopic && (
        <p className="mt-5 text-sm text-faint">
          No topics yet. Click the + card to create your first one.
        </p>
      )}
    </div>
  );
}
