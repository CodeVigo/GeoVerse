"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getQuiz, submitQuizAttempt, type QuizQuestion } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { recordQuiz } from "@/lib/progress";

interface Props {
  title: string;
  type: string;
  scope?: string;
  count?: number;
  accent?: string;
  fixedLength?: boolean;
}

type Phase = "loading" | "playing" | "done" | "error";

export function QuizGame({ title, type, scope, count = 10, accent = "#2dd4bf", fixedLength = false }: Props) {
  const { user, refresh } = useAuth();

  // The working queue: wrong answers get pushed back on so they're re-asked.
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [length, setLength] = useState(count);
  const [awarded, setAwarded] = useState<number | null>(null);

  // First-attempt result per unique question id → drives the score + what we save.
  const firstTry = useRef<Map<string, boolean>>(new Map());
  const baseTotal = useRef(0);

  const allCount = scope === "india" ? 50 : 250;
  const LENGTHS: { label: string; value: number }[] = [
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "All", value: allCount },
  ];

  const load = useCallback(() => {
    setPhase("loading");
    setPos(0);
    setPicked(null);
    setRevealed(false);
    setStreak(0);
    setBestStreak(0);
    setAwarded(null);
    firstTry.current = new Map();
    getQuiz({ type, scope, count: length })
      .then((r) => {
        if (!r.questions.length) {
          setPhase("error");
          return;
        }
        baseTotal.current = r.questions.length;
        setQueue(r.questions);
        setPhase("playing");
      })
      .catch(() => setPhase("error"));
  }, [type, scope, length]);

  useEffect(() => {
    load();
  }, [load]);

  const q = queue[pos];
  const isReview = q ? firstTry.current.has(q.id) : false;
  const wasWrong = picked != null && q != null && picked !== q.answer;
  const resolved = picked != null || revealed;

  const choose = (opt: string) => {
    if (resolved || !q) return;
    setPicked(opt);
    const correct = opt === q.answer;
    // Record only the FIRST time we see this question (for scoring + saving).
    if (!firstTry.current.has(q.id)) firstTry.current.set(q.id, correct);
    if (correct) {
      setStreak((s) => {
        const nx = s + 1;
        setBestStreak((b) => Math.max(b, nx));
        return nx;
      });
    } else {
      setStreak(0);
    }
  };

  // Reveal the correct answer — counts as not-learned and is re-queued for review.
  const reveal = () => {
    if (resolved || !q) return;
    setRevealed(true);
    if (!firstTry.current.has(q.id)) firstTry.current.set(q.id, false);
    setStreak(0);
  };

  const finish = useCallback(async () => {
    setPhase("done");
    const learned = [...firstTry.current.values()].filter(Boolean).length;
    if (baseTotal.current > 0) {
      recordQuiz(`${type}:${scope ?? "world"}`, (learned / baseTotal.current) * 100);
    }
    if (user) {
      const items = [...firstTry.current.entries()].map(([entityId, correct]) => ({
        entityId,
        correct,
      }));
      try {
        const res = await submitQuizAttempt({ items, quizType: `${type}:${scope ?? "world"}` });
        setAwarded(res.awarded);
        refresh();
      } catch {
        /* not saved (offline / not logged in) */
      }
    }
  }, [user, type, scope, refresh]);

  const next = () => {
    if (!q) return;
    let nextQueue = queue;
    // Wrong / revealed answers are re-queued so they come back until answered correctly.
    if (picked !== q.answer) {
      nextQueue = [...queue, q];
      setQueue(nextQueue);
    }
    if (pos + 1 >= nextQueue.length) {
      finish();
    } else {
      setPos((p) => p + 1);
      setPicked(null);
      setRevealed(false);
    }
  };

  const score = [...firstTry.current.values()].filter(Boolean).length;

  // Keyboard shortcuts: 1–4 to answer, Enter to advance. Latest values via ref.
  const kbd = useRef({ q, resolved, choose, next, phase });
  kbd.current = { q, resolved, choose, next, phase };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = kbd.current;
      if (s.phase !== "playing" || !s.q) return;
      if (e.key === "Enter" || e.key === " ") {
        if (s.resolved) {
          e.preventDefault();
          s.next();
        }
        return;
      }
      const n = Number(e.key);
      if (!s.resolved && Number.isInteger(n) && n >= 1 && n <= s.q.options.length) {
        e.preventDefault();
        s.choose(s.q.options[n - 1]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (phase === "loading") {
    return (
      <Shell title={title}>
        <p className="text-slate-400">Loading questions…</p>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell title={title}>
        <p className="text-slate-300">Not enough data for this quiz yet.</p>
        <Link href="/games" className="mt-4 inline-block text-brand-400 hover:underline">
          ← Back to quizzes
        </Link>
      </Shell>
    );
  }

  if (phase === "done") {
    const pct = baseTotal.current ? Math.round((score / baseTotal.current) * 100) : 0;
    return (
      <Shell title={title}>
        <div className="text-center">
          <div className="text-6xl font-bold text-white">{pct}%</div>
          <p className="mt-2 text-slate-300">
            You got <span className="font-semibold text-white">{score}</span> /{" "}
            {baseTotal.current} right on the first try · best streak {bestStreak}
          </p>
          {awarded != null && awarded > 0 && (
            <p className="mt-2 text-sm font-semibold text-brand-400">+{awarded} XP earned 🎉</p>
          )}
          {!user && (
            <p className="mt-2 text-sm text-slate-400">
              <Link href="/login" className="text-brand-400 hover:underline">
                Sign in
              </Link>{" "}
              to earn XP and have tricky ones come back for revision.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={load}
              className="rounded-full px-5 py-2.5 font-semibold text-ink-950"
              style={{ background: accent }}
            >
              Play again
            </button>
            <Link
              href="/games"
              className="glass rounded-full px-5 py-2.5 font-semibold text-white hover:bg-white/10"
            >
              More quizzes
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={title}>
      {/* Length selector */}
      {!fixedLength && (
      <div className="mb-4 flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-500">Length:</span>
        {LENGTHS.map((l) => (
          <button
            key={l.label}
            onClick={() => setLength(l.value)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              length === l.value
                ? "bg-white/15 text-white"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      )}

      {/* Progress + score */}
      <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
        <span>
          {score} / {baseTotal.current} learned
          {isReview && (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
              review
            </span>
          )}
        </span>
        <span className="flex items-center gap-3">
          {streak > 1 && <span className="text-amber-300">🔥 {streak}</span>}
        </span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / baseTotal.current) * 100}%`, background: accent }}
        />
      </div>

      {/* Prompt */}
      <p className="mb-4 text-center text-sm uppercase tracking-wider text-slate-400">{q.prompt}</p>
      {q.flag && (
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w640/${q.flag}.png`}
            srcSet={`https://flagcdn.com/w640/${q.flag}.png 1x, https://flagcdn.com/w1280/${q.flag}.png 2x`}
            alt="Flag to identify"
            className="h-32 w-auto rounded-lg border border-white/15 shadow-lg"
          />
        </div>
      )}
      {q.wiki && <WikiImage wiki={q.wiki} />}

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          let cls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white";
          if (resolved) {
            if (isAnswer)
              cls = `border-emerald-400/50 bg-emerald-500/15 text-emerald-100${
                revealed ? " ring-1 ring-amber-300/60" : ""
              }`;
            else if (isPicked) cls = "border-rose-400/50 bg-rose-500/15 text-rose-100";
            else cls = "border-white/5 bg-white/[0.02] text-slate-500";
          }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={resolved}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-medium transition ${cls}`}
            >
              <kbd className="hidden h-6 w-6 shrink-0 place-items-center rounded border border-white/15 bg-white/5 text-xs text-slate-400 sm:grid">
                {i + 1}
              </kbd>
              <span className="flex-1">{opt}</span>
              {resolved && isAnswer && " ✓"}
              {picked && isPicked && !isAnswer && " ✗"}
            </button>
          );
        })}
      </div>

      {/* Show answer — for when you genuinely don't know it */}
      {!resolved && (
        <div className="mt-4 text-center">
          <button
            onClick={reveal}
            className="text-sm font-medium text-amber-300 transition hover:text-amber-200 hover:underline"
          >
            🤔 Don&apos;t know? Show answer
          </button>
        </div>
      )}

      {/* Learn moment — shown after a wrong answer or a reveal to help it stick */}
      {(wasWrong || revealed) && (
        <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/[0.08] p-4">
          <div className="text-[11px] uppercase tracking-wider text-amber-300/80">
            {revealed ? "The answer is" : "Remember this"}
          </div>
          <p className="mt-1 font-semibold text-white">{q.answer}</p>
          {q.hook && <p className="mt-1 text-sm leading-relaxed text-slate-300">{q.hook}</p>}
          <p className="mt-2 text-xs text-slate-400">We&apos;ll ask you this one again shortly.</p>
        </div>
      )}

      {/* Next */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={next}
          disabled={!resolved}
          className="rounded-full px-6 py-2.5 font-semibold text-ink-950 transition disabled:cursor-not-allowed disabled:opacity-30"
          style={{ background: accent }}
        >
          {wasWrong || revealed ? "Got it →" : pos + 1 >= queue.length ? "Finish" : "Next →"}
        </button>
      </div>
    </Shell>
  );
}

// Fetches a place photo from Wikipedia (free, CORS-OK) for photo-guess rounds.
const wikiCache = new Map<string, string | null>();
function WikiImage({ wiki }: { wiki: string }) {
  const [src, setSrc] = useState<string | null | undefined>(() =>
    wikiCache.has(wiki) ? wikiCache.get(wiki) : undefined,
  );
  useEffect(() => {
    let cancelled = false;
    if (wikiCache.has(wiki)) {
      setSrc(wikiCache.get(wiki));
      return;
    }
    setSrc(undefined);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wiki)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const url: string | null = d?.thumbnail?.source ?? d?.originalimage?.source ?? null;
        wikiCache.set(wiki, url);
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        wikiCache.set(wiki, null);
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [wiki]);

  return (
    <div className="mb-6 flex justify-center">
      <div className="h-52 w-full max-w-md overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-lg">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Place to identify" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            {src === undefined ? "Loading photo…" : "Photo unavailable — use the options"}
          </div>
        )}
      </div>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/games" className="text-sm text-brand-400 hover:underline">
        ← All quizzes
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold tracking-tight text-white">{title}</h1>
      <div className="card p-6">{children}</div>
    </div>
  );
}
