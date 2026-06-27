import type { Metadata } from "next";
import Link from "next/link";
import { PUZZLES, type PuzzleDef } from "@/lib/puzzles";

export const metadata: Metadata = {
  title: "Map Puzzles · GeoVerse",
  description: "Click-to-place map puzzles for India, its states' districts, and world regions.",
};

const GROUPS: PuzzleDef["group"][] = ["India", "States of India", "World"];

export default function PuzzleIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <Link href="/games" className="text-sm text-brand-400 hover:underline">
        ← All quizzes
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">🗺️ Map Puzzles</h1>
      <p className="mt-2 max-w-2xl text-slate-300">
        Place every state, district or country on a blank map. Stuck? Each puzzle has progressive
        hints and a reveal — and your best time is saved.
      </p>

      {GROUPS.map((group) => {
        const items = PUZZLES.filter((p) => p.group === group);
        if (!items.length) return null;
        return (
          <section key={group} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{group}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <Link key={p.slug} href={`/games/puzzle/${p.slug}`} className="card card-hover block">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.emoji}</span>
                    <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
