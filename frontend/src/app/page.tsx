import Link from "next/link";

export default function HomePage() {
  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative z-10 mx-auto w-full max-w-3xl animate-rise">
        <p className="label-caps">RAG Chat</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-mist md:text-6xl">
          Ask your documents
          <span className="block bg-gradient-to-r from-accent to-white/80 bg-clip-text text-transparent">
            anything.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-muted md:text-lg">
          Upload files, ground every answer in your sources, and keep each topic cleanly separated.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex rounded-xl bg-gradient-to-b from-accent to-accent-dim px-7 py-3 font-sans text-sm font-semibold text-void shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_28px_rgba(74,168,150,0.3)] transition hover:brightness-110"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3 font-sans text-sm font-semibold text-mist/90 transition hover:bg-white/[0.08]"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-16 left-1/2 h-40 w-[70%] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
    </div>
  );
}
