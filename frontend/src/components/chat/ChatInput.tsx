"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask something about your documents…"
        disabled={disabled}
        className="flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-mist outline-none placeholder:text-mist/30 focus:border-accent/70 disabled:opacity-50"
      />
      <Button type="submit" disabled={disabled} className="px-6">
        Ask
      </Button>
    </form>
  );
}
