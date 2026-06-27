"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgress, formatMs, type Progress } from "@/lib/progress";
import { PUZZLES } from "@/lib/puzzles";

const QUIZ_LABELS: Record<string, string> = {
  flags: "Flag Finder",
  capitals: "World Capitals",
  "india-capitals": "Indian Capitals",
  "world-gk": "World GK",
  "karnataka-gk": "Karnataka GK",
  landmarks: "Guess the Landmark",
  daily: "Daily Challenge",
  gi: "GI Tags",
  revision: "Revision",
};

function quizLabel(key: string): string {
  const type = key.split(":")[0] ?? key;
  return QUIZ_LABELS[type] ?? type;
}

export function MasteryPanel() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const read = () => setProgress(getProgress());
    read();
    window.addEventListener("geoverse:progress", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("geoverse:progress", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  if (!progress) return null;

  const puzzleRows = PUZZLES.map((p) => ({ def: p, best: progress.puzzles[p.slug] })).filter(
    (r) => r.best && r.best.total > 0,
  );
  const quizRows = Object.entries(progress.quizzes).sort((a, b) => b[1].bestPct - a[1].bestPct);

  if (puzzleRows.length === 0 && quizRows.length === 0) {
    return (
      <div className="glass mt-4 rounded-xl border border-white/10 p-5 text-sm text-slate-400">
        Play a quiz or a map puzzle and your mastery will show up here.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {puzzleRows.length > 0 && (
        <div className="glass rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Map puzzles
          </h3>
          <ul className="mt-3 space-y-3">
            {puzzleRows.map(({ def, best }) => {
              const pct = Math.round((best!.found / best!.total) * 100);
              return (
                <li key={def.slug}>
                  <Link
                    href={`/games/puzzle/${def.slug}`}
                    className="flex items-center justify-between text-sm hover:text-white"
                  >
                    <span className="text-slate-200">
                      {def.emoji} {def.title}
                    </span>
                    <span className="text-slate-400">
                      {best!.found}/{best!.total}
                      {best!.bestMs != null && (
                        <span className="ml-2 text-brand-300">⏱ {formatMs(best!.bestMs)}</span>
                      )}
                    </span>
                  </Link>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {quizRows.length > 0 && (
        <div className="glass rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Quiz best scores
          </h3>
          <ul className="mt-3 space-y-2">
            {quizRows.map(([key, q]) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{quizLabel(key)}</span>
                <span className="text-slate-400">
                  <span className="font-semibold text-white">{q.bestPct}%</span> · {q.plays} play
                  {q.plays === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
