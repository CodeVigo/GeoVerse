"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { MasteryPanel } from "@/components/MasteryPanel";

export default function LearnPage() {
  const { user, loading, setMode } = useAuth();

  if (loading) {
    return <div className="px-6 py-16 text-center text-slate-400">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-white">Your learning hub</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to track XP, streaks, and your spaced-repetition reviews.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Sign in / Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">
        Hi {user.displayName ?? user.email.split("@")[0]} 👋
      </h1>
      <p className="mt-1 text-sm text-slate-400">Here&apos;s your progress.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Day streak" value={`🔥 ${user.streakCount}`} />
        <Stat label="Total XP" value={`${user.xp}`} accent="text-brand-400" />
        <Stat label="Mode" value={user.preferredMode === "EXAM" ? "Exam" : "Explore"} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="text-sm text-slate-400">Preferred mode:</span>
        {(["EXPLORE", "EXAM"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              user.preferredMode === m
                ? "bg-brand-500 text-ink-950"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {m === "EXPLORE" ? "Explore" : "Exam"}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card
          href="/learn/revision"
          title="🔁 Revision"
          desc="Review the items you've missed, right when they're due."
        />
        <Card
          href="/games"
          title="Play & earn XP"
          desc="Flag Finder, capitals, GI tags, map puzzles and more."
        />
        <Card
          href="/"
          title="Explore the globe"
          desc="Discover countries, states, and world-famous landmarks."
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Your mastery
      </h2>
      <MasteryPanel />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass rounded-xl border border-white/10 p-4">
      <div className={`text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="glass rounded-xl border border-white/10 p-5 transition hover:border-brand-400/40 hover:bg-white/5"
    >
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{desc}</div>
    </Link>
  );
}
