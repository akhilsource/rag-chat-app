import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="RAG Chat"
      title="Welcome back"
      subtitle="Sign in to continue with your topics and documents."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white/5" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
