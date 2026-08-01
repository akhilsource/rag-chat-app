import clsx from "clsx";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";

interface MessageSource {
  title: string;
  url?: string;
  kind: "web" | "doc";
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: MessageSource[];
}

export function MessageBubble({ role, content, sources = [] }: MessageBubbleProps) {
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
          <>
            <MarkdownMessage content={content} />
            {sources.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-2">
                <p className="label-caps !text-mist/35 mb-1.5">Sources</p>
                <ul className="space-y-1">
                  {sources.map((source) => (
                    <li key={`${source.kind}-${source.url ?? source.title}`} className="truncate text-xs text-mist/55">
                      <span className="mr-1.5 text-mist/35">
                        {source.kind === "web" ? "Web" : "Doc"}
                      </span>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent/90 hover:underline"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <span>{source.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
