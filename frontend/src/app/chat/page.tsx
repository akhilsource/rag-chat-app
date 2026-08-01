"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { TopicCards } from "@/components/chat/TopicCards";
import { TopicDocuments } from "@/components/chat/TopicDocuments";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ChatMessageOut, SessionSummary } from "@/lib/api";

export default function ChatPage() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessageOut[]>([]);

  const loadSession = useCallback(async (sessionId: string) => {
    const detail = await api.chat.getSession(sessionId);
    setActiveSessionId(sessionId);
    setActiveSession(detail.session);
    setSessionMessages(detail.messages);
  }, []);

  function handleTopicCreated(session: SessionSummary) {
    loadSession(session.id);
  }

  function handleBackToTopics() {
    setActiveSessionId(null);
    setActiveSession(null);
    setSessionMessages([]);
  }

  function handleDocumentsUpdated(documentIds: string[]) {
    setActiveSession((prev) => (prev ? { ...prev, document_ids: documentIds } : prev));
  }

  return (
    <div className="app-shell px-6 py-8">
      <AppHeader
        title={user?.name ? `Hi, ${user.name}` : "Your workspace"}
        subtitle={
          activeSession
            ? "Upload sources and ask questions inside this topic."
            : "Choose a topic to get started."
        }
        showSignOut
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl">
        {!activeSessionId || !activeSession ? (
          <TopicCards onSelectTopic={loadSession} onTopicCreated={handleTopicCreated} />
        ) : (
          <div className="animate-rise space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mb-3"
                  onClick={handleBackToTopics}
                >
                  ← All topics
                </Button>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-mist">
                  {activeSession.title || "Untitled topic"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {activeSession.document_ids.length} source(s) linked
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
              <div className="lg:sticky lg:top-6 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
                <TopicDocuments
                  sessionId={activeSessionId}
                  linkedDocumentIds={activeSession.document_ids}
                  onDocumentsUpdated={handleDocumentsUpdated}
                />
              </div>
              <ChatWindow sessionId={activeSessionId} initialMessages={sessionMessages} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
