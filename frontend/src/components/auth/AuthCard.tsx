import { ReactNode } from "react";

interface AuthCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Shared visual frame for the login/signup pages.
 *
 * Signature element: a vertical "citation strip" — a column of short
 * highlighted marks that shimmer at staggered intervals, standing in for
 * retrieved document snippets feeding a RAG answer. It's the one place
 * this design takes a visual risk; everything else stays quiet.
 */
export function AuthCard({ eyebrow, title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink bg-grain-overlay px-6 py-12">
      {/* Ambient citation strip, left side, hidden on small screens */}
      <div className="pointer-events-none absolute left-10 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:left-24">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-[3px] rounded-full bg-amber animate-shimmer"
            style={{
              width: `${28 + ((i * 17) % 40)}px`,
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-3xl font-medium text-paper">{title}</h1>
          <p className="mt-2 font-sans text-sm text-paper/60">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-paper/10 bg-paper p-7 shadow-2xl shadow-black/40">
          {children}
        </div>

        <div className="mt-6 text-center font-sans text-sm text-paper/50">{footer}</div>
      </div>
    </div>
  );
}
