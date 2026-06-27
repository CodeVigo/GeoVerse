"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchEntities, type SearchResult } from "@/lib/api";

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults([]);
    setActive(0);
  }, []);

  // Global ⌘K / Ctrl+K to open, Esc to close, plus a custom event from the TopBar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-search", onOpen);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchEntities(q)
        .then((r) => {
          setResults(r);
          setActive(0);
        })
        .catch(() => setResults([]));
    }, 160);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = useCallback(
    (slug: string) => {
      close();
      router.push(`/${slug}`);
    },
    [close, router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active].slug);
            }
          }}
          placeholder="Search countries, states, landmarks…"
          className="w-full border-b border-white/10 bg-transparent px-5 py-4 text-base text-white outline-none placeholder:text-slate-500"
        />
        <div className="max-h-[50vh] overflow-y-auto">
          {q.trim() && results.length === 0 && (
            <div className="px-5 py-6 text-sm text-slate-500">No matches for “{q}”.</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.slug}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.slug)}
              className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                i === active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="text-xl">{r.flag ?? "📍"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{r.name}</span>
                {r.summary && (
                  <span className="block truncate text-xs text-slate-400">{r.summary}</span>
                )}
              </span>
              <span className="chip text-[10px] uppercase tracking-wider text-slate-400">
                {r.type.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
          <span>↑↓ to navigate · ↵ to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
