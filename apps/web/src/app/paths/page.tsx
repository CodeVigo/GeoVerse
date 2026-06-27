import Link from "next/link";
import { PATHS } from "@/lib/paths";

export const metadata = {
  title: "Learning Paths · GeoVerse",
  description: "Guided geography journeys — curated, step-by-step learning paths.",
};

export default function PathsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Back to globe
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
        Learning Paths
      </h1>
      <p className="mt-2 max-w-2xl text-slate-300">
        Curated, step-by-step journeys that mix exploring places, playing quizzes, and reading —
        so you always know what to learn next.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PATHS.map((p) => (
          <Link key={p.slug} href={`/paths/${p.slug}`} className="card card-hover block">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{p.emoji}</span>
              <span className="chip text-[11px] uppercase tracking-wider text-slate-300">
                {p.level}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-white">{p.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{p.description}</p>
            <p className="mt-3 text-xs text-slate-500">{p.steps.length} steps</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
