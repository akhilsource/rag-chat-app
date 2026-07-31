import clsx from "clsx";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  sheen?: boolean;
  soft?: boolean;
}

export function GlassCard({ children, className, sheen = false, soft = false }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "rounded-panel",
        soft ? "glass-soft" : "glass",
        sheen && "gloss-sheen",
        className,
      )}
    >
      {children}
    </div>
  );
}
