"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDueCards, submitQuizAttempt, type DueCard } from "@/lib/api";
import { useAuth } from "./AuthProvider";

interface Result {
  entityId: string;
  correct: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  COUNTRY: "Country",
  STATE: "State",
  UNION_TERRITORY: "Union Territory",
  DISTRICT: "District",
  RIVER: "River",
  MOUNTAIN: "Mountain",
};

function prompt(card: DueCard): { q: string; a: string } {
  if (card.capital) return { q: `What is the capital of ${card.name}?`, a: card.capital };
  return { q: `What do you remember about ${card.name}?`, a: card.summary ?? card.name };
}

export function RevisionDeck() {
  const { user, loading, refresh } = useAuth();
  const [cards, setCards] = useState<DueCard[] | null>(null);
  const [err, setErr] = useState(false);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCards([]);
      return;
    }
    getDueCards()
      .then((r) => setCards(r.items))
      .catch(() => setErr(true));
  }, [user, loading]);

  if (loading || (user && cards === null && !err)) {
    return <Shell>Loading your reviews…</Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <p className="text-slate-300">Sign in to build and review your spaced-repetition deck.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-brand-500 px-5 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Sign in
        </Link>
      </Shell>
    );
  }

  if (err) {
    return <Shell>Couldn&apos;t load your reviews. Try again later.</Shell>;
  }

  const total = cards?.length ?? 0;

  if (total === 0) {
    return (
      <Shell>
        <p className="text-lg font-semibold text-white">🎉 Nothing due right now!</p>
        <p className="mt-2 text-slate-400">
          Play a few quizzes — the ones you miss come back here for review at the right time.
        </p>
        <Link
          href="/games"
          className="mt-5 inline-block rounded-full bg-brand-500 px-5 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          Go to quizzes →
        </Link>
      </Shell>
    );
  }

  if (done) {
    const got = results.filter((r) => r.correct).length;
    return (
      <Shell>
        <p className="text-5xl font-bold text-white">
          {got}/{total}
        </p>
        <p className="mt-2 text-slate-300">remembered this session.</p>
        {awarded != null && awarded > 0 && (
          <p className="mt-1 text-sm font-semibold text-brand-400">+{awarded} XP 🎉</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Forgotten cards will resurface soon; the rest move further out.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => {
              setIdx(0);
              setResults([]);
              setShowBack(false);
              setDone(false);
              setAwarded(null);
              setCards(null);
              getDueCards()
                .then((r) => setCards(r.items))
                .catch(() => setErr(true));
            }}
            className="rounded-full bg-brand-500 px-5 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            Review more
          </button>
          <Link
            href="/learn"
            className="glass rounded-full px-5 py-2 font-semibold text-white hover:bg-white/10"
          >
            Back to Learn
          </Link>
        </div>
      </Shell>
    );
  }

  const card = cards![idx]!;
  const { q, a } = prompt(card);

  const grade = async (correct: boolean) => {
    const next = [...results, { entityId: card.entityId, correct }];
    setResults(next);
    setShowBack(false);
    if (idx + 1 >= total) {
      setDone(true);
      try {
        const res = await submitQuizAttempt({ items: next, quizType: "revision" });
        setAwarded(res.awarded);
        refresh();
      } catch {
        /* not saved */
      }
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <Shell>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Card {idx + 1} / {total}
        </span>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
          due for review
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-6 text-center">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          {TYPE_LABEL[card.type] ?? card.type}
        </div>
        <p className="mt-2 text-xl font-semibold text-white">{q}</p>

        {showBack ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-lg font-bold text-brand-300">{a}</p>
            {card.summary && card.capital && (
              <p className="mt-1 text-sm text-slate-400">{card.summary}</p>
            )}
            <Link
              href={`/${card.slug}`}
              className="mt-2 inline-block text-xs text-brand-400 hover:underline"
            >
              Open full page →
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setShowBack(true)}
            className="mt-4 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Show answer
          </button>
        )}
      </div>

      {showBack && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => grade(false)}
            className="rounded-full border border-rose-400/40 bg-rose-500/10 px-6 py-2.5 font-semibold text-rose-200 transition hover:bg-rose-500/20"
          >
            Forgot
          </button>
          <button
            onClick={() => grade(true)}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-6 py-2.5 font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
          >
            Got it
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/learn" className="text-sm text-brand-400 hover:underline">
        ← Learn
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-white">🔁 Revision</h1>
      <div className="card p-6 text-center">{children}</div>
    </div>
  );
}
