import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface AuthCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 py-12">
      <div className="relative z-10 w-full max-w-md animate-rise">
        <div className="mb-8 text-center">
          <p className="label-caps">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-mist">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        <GlassCard sheen className="p-7">
          {children}
        </GlassCard>

        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
      </div>
    </div>
  );
}
