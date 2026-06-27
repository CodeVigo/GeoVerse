import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quizzes · GeoVerse",
  description: "Learn geography by playing — flag finder, capitals, map puzzles and more.",
};

interface Game {
  href?: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
  soon?: boolean;
}

const GAMES: Game[] = [
  {
    href: "/games/flags",
    icon: "🚩",
    title: "Flag Finder",
    desc: "See a flag, name the country. 250 nations to master.",
    tag: "World",
  },
  {
    href: "/games/capitals",
    icon: "🏛️",
    title: "World Capitals",
    desc: "Match every country to its capital city.",
    tag: "World",
  },
  {
    href: "/games/india-capitals",
    icon: "🇮🇳",
    title: "Indian State Capitals",
    desc: "Capitals of India's states & union territories.",
    tag: "India",
  },
  {
    href: "/games/world-gk",
    icon: "🌍",
    title: "World Geography GK",
    desc: "Longest rivers, highest peaks, biggest deserts and more.",
    tag: "World",
  },
  {
    href: "/games/karnataka-gk",
    icon: "🏞️",
    title: "Karnataka GK",
    desc: "River sources, biggest district, famous places & facts.",
    tag: "Karnataka",
  },
  {
    href: "/games/landmarks",
    icon: "📸",
    title: "Guess the Landmark",
    desc: "See a photo of a world-famous place and name it.",
    tag: "World",
  },
  {
    href: "/games/daily",
    icon: "⚡",
    title: "Daily Challenge",
    desc: "A fresh mixed quiz every day. Keep your streak alive.",
    tag: "Daily",
  },
  {
    href: "/games/gi",
    icon: "🏷️",
    title: "GI Tags Quiz",
    desc: "Match famous products to their home state or country.",
    tag: "GI",
  },
  {
    href: "/games/puzzle",
    icon: "🗺️",
    title: "Map Puzzles",
    desc: "Place states, districts & countries on blank maps — timed, with hints.",
    tag: "Maps",
  },
];

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Back to globe
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Quizzes</h1>
      <p className="mt-2 max-w-2xl text-slate-300">
        The fastest way to actually remember geography — short, replayable challenges with streaks
        and instant feedback.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl">{g.icon}</span>
                <span className="chip text-[11px] uppercase tracking-wider text-slate-300">
                  {g.tag}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{g.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{g.desc}</p>
              {g.soon && (
                <span className="mt-3 inline-block rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
                  Coming soon
                </span>
              )}
            </>
          );
          return g.href ? (
            <Link key={g.title} href={g.href} className="card card-hover block">
              {inner}
            </Link>
          ) : (
            <div key={g.title} className="card cursor-default opacity-70">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
