import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink bg-grain-overlay px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
        Retrieval-augmented chat
      </p>
      <h1 className="mt-4 max-w-xl font-display text-4xl font-medium text-paper md:text-5xl">
        Ask your documents anything.
      </h1>
      <p className="mt-4 max-w-md font-sans text-paper/60">
        Upload your files, and get answers grounded in exactly what they say — with sources, not guesses.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-teal px-6 py-2.5 font-sans text-sm font-medium text-paper transition-colors hover:bg-teal-dark"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-paper/20 px-6 py-2.5 font-sans text-sm font-medium text-paper/80 transition-colors hover:bg-paper/5"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
