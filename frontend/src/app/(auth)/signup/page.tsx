import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthCard
      eyebrow="RAG Chat"
      title="Create your account"
      subtitle="Upload documents and start asking grounded questions in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-amber hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
