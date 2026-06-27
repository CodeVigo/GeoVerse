// Lightweight client-side progress store (localStorage). Tracks personal bests
// for map puzzles and quizzes so the Learn page can show mastery — works even
// when signed out.

const KEY = "geoverse:progress:v1";

export interface PuzzleBest {
  found: number;
  total: number;
  /** Best (lowest) completion time in ms, if ever completed fully. */
  bestMs?: number;
  updatedAt: number;
}

export interface QuizBest {
  bestPct: number;
  plays: number;
  updatedAt: number;
}

export interface Progress {
  puzzles: Record<string, PuzzleBest>;
  quizzes: Record<string, QuizBest>;
}

const EMPTY: Progress = { puzzles: {}, quizzes: {} };

export function getProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<Progress>;
    return { puzzles: p.puzzles ?? {}, quizzes: p.quizzes ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("geoverse:progress"));
  } catch {
    /* ignore quota / private mode */
  }
}

export function recordPuzzle(id: string, found: number, total: number, completedMs?: number) {
  if (typeof window === "undefined" || !id) return;
  const p = getProgress();
  const prev = p.puzzles[id];
  const completed = total > 0 && found >= total;
  p.puzzles[id] = {
    found: Math.max(found, prev?.found ?? 0),
    total,
    bestMs:
      completed && completedMs != null
        ? Math.min(completedMs, prev?.bestMs ?? Infinity)
        : prev?.bestMs,
    updatedAt: Date.now(),
  };
  save(p);
}

export function recordQuiz(type: string, pct: number) {
  if (typeof window === "undefined" || !type) return;
  const p = getProgress();
  const prev = p.quizzes[type];
  p.quizzes[type] = {
    bestPct: Math.max(Math.round(pct), prev?.bestPct ?? 0),
    plays: (prev?.plays ?? 0) + 1,
    updatedAt: Date.now(),
  };
  save(p);
}

export function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}
