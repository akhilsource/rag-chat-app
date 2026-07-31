import clsx from "clsx";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-mist">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function isOrderedListItem(line: string): boolean {
  return /^\d+\.\s+/.test(line.trim());
}

function isBulletListItem(line: string): boolean {
  return /^[-*]\s+/.test(line.trim());
}

function stripListMarker(line: string): string {
  return line.trim().replace(/^(\d+\.|[-*])\s+/, "");
}

function splitInlineNumberedList(text: string): { intro?: string; items: string[] } | null {
  const firstItem = text.search(/\d+\.\s+/);
  if (firstItem === -1) return null;

  const intro = text.slice(0, firstItem).trim().replace(/:\s*$/, "");
  const listText = text.slice(firstItem).trim();
  const items = listText
    .split(/(?=\d+\.\s+)/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length < 2 || !items.every(isOrderedListItem)) {
    return null;
  }

  return { intro: intro || undefined, items };
}

function renderOrderedList(items: string[], key: string) {
  return (
    <ol key={key} className="list-decimal space-y-2 pl-5 marker:text-accent/80">
      {items.map((line, lineIndex) => (
        <li key={lineIndex} className="pl-1">
          {renderInline(stripListMarker(line))}
        </li>
      ))}
    </ol>
  );
}

function renderParagraph(block: string, key: string) {
  const inlineList = splitInlineNumberedList(block);
  if (inlineList) {
    return (
      <div key={key} className="space-y-3">
        {inlineList.intro ? <p>{renderInline(inlineList.intro)}</p> : null}
        {renderOrderedList(inlineList.items, `${key}-list`)}
      </div>
    );
  }

  const lines = block.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return null;

  const allOrdered = lines.every(isOrderedListItem);
  const allBullets = lines.every(isBulletListItem);

  if (allOrdered) {
    return renderOrderedList(lines, key);
  }

  if (allBullets) {
    return (
      <ul key={key} className="list-disc space-y-2 pl-5 marker:text-accent/80">
        {lines.map((line, lineIndex) => (
          <li key={lineIndex} className="pl-1">
            {renderInline(stripListMarker(line))}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="whitespace-pre-wrap">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className={clsx("space-y-3", className)}>
      {blocks.map((block, blockIndex) => renderParagraph(block.trim(), `block-${blockIndex}`))}
    </div>
  );
}
