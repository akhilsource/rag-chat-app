import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="RAG Chat"
      title="Welcome back"
      subtitle="Sign in to keep asking your documents questions."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-amber hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
