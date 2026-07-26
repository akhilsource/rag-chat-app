"use client";

import { FormEvent, useState } from "react";
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
        className="flex-1 rounded-md border border-paper/15 bg-paper/[0.06] px-4 py-2.5 font-sans text-sm text-paper placeholder:text-paper/35 outline-none focus:border-amber"
      />
      <Button type="submit" disabled={disabled} className="w-auto px-6">
        Ask
      </Button>
    </form>
  );
}
