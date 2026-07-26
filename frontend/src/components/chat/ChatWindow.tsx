"use client";

import { useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Upload a document (once ingestion is wired up on the backend) and ask me anything about it.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend(question: string) {
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response = await api.chat.query(question);
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "The backend isn't reachable yet — this is just the frontend shell for now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-paper/10 bg-black/20 p-5">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
            Retrieving…
          </p>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
