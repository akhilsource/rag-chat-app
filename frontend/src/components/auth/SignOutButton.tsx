"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface SignOutButtonProps {
  redirectTo?: string;
  className?: string;
}

export function SignOutButton({ redirectTo = "/login", className }: SignOutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      loading={loading}
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );
}
