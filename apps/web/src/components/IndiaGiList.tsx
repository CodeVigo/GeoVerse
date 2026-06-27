"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchIndiaGIs, type IndiaGI } from "@/lib/gi";
import { WikiThumb } from "./WikiThumb";

const TYPE_ICON: Record<string, string> = {
  Agricultural: "🌾",
  Handicraft: "🧵",
  Manufactured: "🏭",
  Foodstuff: "🍲",
  "Food Stuff": "🍲",
  Natural: "🌿",
  Other: "🏷️",
};

const TYPE_STYLE: Record<string, string> = {
  Agricultural: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  Handicraft: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  Manufactured: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  Foodstuff: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  Natural: "bg-lime-500/15 text-lime-200 border-lime-400/30",
};

interface Props {
  title?: string;
  initialState?: string;
  lockState?: boolean;
}

export function IndiaGiList({ title = "🏷️ Geographical Indications (GI Tags)", initialState, lockState = false }: Props) {
  const [all, setAll] = useState<IndiaGI[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [state, setState] = useState(initialState ?? "All");

  useEffect(() => {
    let cancelled = false;
    fetchIndiaGIs()
      .then((d) => !cancelled && setAll(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(
    () => (all ? Array.from(new Set(all.flatMap((g) => g.states))).sort() : []),
    [all],
  );
  const types = useMemo(
    () => (all ? Array.from(new Set(all.map((g) => g.type))).sort() : []),
    [all],
  );

  const filtered = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    return all.filter(
      (g) =>
        (state === "All" || g.states.some((s) => s.toLowerCase() === state.toLowerCase())) &&
        (type === "All" || g.type === type) &&
        (needle === "" || g.name.toLowerCase().includes(needle)),
    );
  }, [all, state, type, q]);

  if (error) {
    return (
      <section className="mt-9">
        <h2 className="section-title">{title}</h2>
        <p className="card text-sm text-slate-400">
          Couldn&apos;t reach Wikipedia to load the GI register. Check your connection and reload.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title mb-0">{title}</h2>
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Live from Wikipedia · India GI Register
        </span>
      </div>

      {!all ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search GI products…"
              className="min-w-[12rem] flex-1 rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
            >
              <option value="All">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {!lockState && (
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
              >
                <option value="All">All states/UTs</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Showing <span className="font-semibold text-white">{filtered.length}</span> of {all.length} registered GIs
            {lockState && initialState ? ` in ${initialState}` : ""}.
          </p>

          {/* Cards */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <a
                key={`${g.serial}-${g.name}`}
                href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(g.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover block p-0 overflow-hidden"
              >
                <WikiThumb
                  title={g.name}
                  fallback={TYPE_ICON[g.type] ?? "🏷️"}
                  className="h-28 w-full border-b border-white/10"
                />
                <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white">
                    <span className="mr-1">{TYPE_ICON[g.type] ?? "🏷️"}</span>
                    {g.name}
                  </h3>
                  {g.year && <span className="shrink-0 text-[11px] text-slate-500">{g.year}</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      TYPE_STYLE[g.type] ?? "border-white/15 text-slate-300"
                    }`}
                  >
                    {g.type}
                  </span>
                  {!lockState &&
                    g.states.slice(0, 2).map((s) => (
                      <span key={s} className="text-[11px] text-slate-400">
                        {s}
                      </span>
                    ))}
                </div>
                </div>
              </a>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-500">No GIs match your filters.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
