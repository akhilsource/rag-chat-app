import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showSignOut?: boolean;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, showSignOut = false, action }: AppHeaderProps) {
  return (
    <header className="relative z-10 mx-auto mb-8 flex w-full max-w-6xl items-center justify-between gap-4">
      <div>
        <p className="label-caps">RAG Chat</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-mist md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {showSignOut && <SignOutButton className="w-auto" />}
      </div>
    </header>
  );
}
