"use client";

import { useAuth } from "@/context/AuthContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink bg-grain-overlay px-6 py-8">
      <header className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
            RAG Chat
          </p>
          <h1 className="font-display text-xl text-paper">
            {user?.name ? `Hi, ${user.name}` : "Your workspace"}
          </h1>
        </div>
        <Button variant="ghost" className="w-auto px-4" onClick={handleLogout}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1">
        <ChatWindow />
      </main>
    </div>
  );
}
