"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Enter your name.";
    if (password.length < 8) errors.password = "Use at least 8 characters.";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(name, email, password);
      router.push("/chat");
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code === "auth/email-already-in-use") {
        setFormError("An account with that email already exists. Try signing in instead.");
      } else if (err instanceof Error && err.message) {
        setFormError(err.message);
      } else {
        setFormError("Couldn't create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setFormError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/chat");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        placeholder="Ada Lovelace"
      />
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
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        placeholder="At least 8 characters"
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        placeholder="••••••••"
      />

      {formError && (
        <p className="rounded-xl bg-[var(--danger-bg)] px-3 py-2 text-xs text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" loading={loading} className="mt-1 w-full">
        Create account
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="label-caps !text-mist/35">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleGoogleSignup}
        loading={loading}
        className="w-full"
      >
        Continue with Google
      </Button>
    </form>
  );
}
