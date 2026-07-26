import clsx from "clsx";

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
          "max-w-[75%] rounded-lg px-4 py-2.5 font-sans text-sm leading-relaxed",
          isUser
            ? "bg-teal text-paper"
            : "border border-paper/10 bg-paper/[0.06] text-paper/90"
        )}
      >
        {content}
      </div>
    </div>
  );
}
