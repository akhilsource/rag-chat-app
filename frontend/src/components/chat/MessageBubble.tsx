import clsx from "clsx";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-b from-accent to-accent-dim text-void shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
            : "border border-white/10 bg-white/[0.05] text-mist/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <MarkdownMessage content={content} />
        )}
      </div>
    </div>
  );
}
