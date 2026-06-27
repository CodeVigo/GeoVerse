"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LearningPath, StepKind } from "@/lib/paths";

const KIND_META: Record<StepKind, { icon: string; label: string }> = {
  place: { icon: "🧭", label: "Explore" },
  game: { icon: "🎮", label: "Play" },
  read: { icon: "📖", label: "Read" },
};

export function PathView({ path }: { path: LearningPath }) {
  const storageKey = `geoverse:path:${path.slug}`;
  const [doneSteps, setDoneSteps] = useState<boolean[]>(() => path.steps.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr = JSON.parse(raw) as boolean[];
        if (Array.isArray(arr) && arr.length === path.steps.length) setDoneSteps(arr);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, path.steps.length]);

  const toggle = (i: number) => {
    setDoneSteps((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const completed = doneSteps.filter(Boolean).length;
  const pct = Math.round((completed / path.steps.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 md:px-6">
      <Link href="/paths" className="text-sm text-brand-400 hover:underline">
        ← All paths
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl">{path.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{path.title}</h1>
          <p className="text-xs uppercase tracking-wider text-slate-400">{path.level}</p>
        </div>
      </div>
      <p className="mt-3 text-slate-300">{path.description}</p>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            {completed} / {path.steps.length} steps
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <ol className="mt-6 space-y-3">
        {path.steps.map((s, i) => {
          const meta = KIND_META[s.kind];
          const isDone = doneSteps[i];
          return (
            <li
              key={s.title}
              className={`card flex items-start gap-3 ${isDone ? "border-brand-400/40" : ""}`}
            >
              <button
                onClick={() => toggle(i)}
                aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs transition ${
                  isDone
                    ? "border-brand-400 bg-brand-500 text-ink-950"
                    : "border-white/20 text-transparent hover:border-white/40"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    Step {i + 1} · {meta.icon} {meta.label}
                  </span>
                </div>
                <Link
                  href={s.href}
                  className={`mt-0.5 block font-semibold ${
                    isDone ? "text-slate-400 line-through" : "text-white hover:text-brand-300"
                  }`}
                >
                  {s.title}
                </Link>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{s.blurb}</p>
              </div>
              <Link
                href={s.href}
                className="self-center rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                Open →
              </Link>
            </li>
          );
        })}
      </ol>

      {pct === 100 && (
        <p className="mt-6 rounded-xl border border-brand-400/40 bg-brand-500/10 p-4 text-center font-semibold text-brand-200">
          🎉 Path complete — great work! Try another journey.
        </p>
      )}
    </div>
  );
}
