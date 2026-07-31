"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(searchParams.get("next") ?? "/chat");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't sign in. Check your email and password and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push(searchParams.get("next") ?? "/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && (
        <p className="rounded-xl bg-[var(--danger-bg)] px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="mt-1 w-full">
        Sign in
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="label-caps !text-mist/35">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button type="button" variant="ghost" onClick={handleGoogleLogin} loading={loading} className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
