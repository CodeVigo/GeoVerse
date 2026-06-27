"use client";

import { useEffect, useState } from "react";
import { fetchGiTags, type GiTag } from "@/lib/wikidata";

interface Props {
  place: string;
  level?: "country" | "region";
}

export function GiTags({ place, level = "country" }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tags, setTags] = useState<GiTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setTags([]);
    fetchGiTags(place, level)
      .then((t) => {
        if (!cancelled) setTags(t);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [place, level]);

  // Hide the section entirely if there's genuinely nothing to show.
  if (!loading && !error && tags.length === 0) return null;

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title mb-0">🏷️ Geographical Indications (GI Tags)</h2>
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Live from Wikidata
        </span>
      </div>
      <p className="mt-1 mb-3 text-sm text-slate-400">
        Products with a protected origin linked to {place}.
      </p>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-28 w-full rounded-lg bg-white/5" />
              <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
              <div className="mt-2 h-3 w-full rounded bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="card text-sm text-slate-400">
          Couldn&apos;t reach Wikidata right now. Check your connection and reload.
        </p>
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((t) => {
            const card = (
              <>
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt={t.name}
                    loading="lazy"
                    className="h-28 w-full rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-3xl">
                    🏷️
                  </div>
                )}
                <h3 className="mt-3 font-semibold text-amber-200">{t.name}</h3>
                {t.description && (
                  <p className="mt-1 text-sm capitalize leading-relaxed text-slate-300">
                    {t.description}
                  </p>
                )}
              </>
            );
            return t.article ? (
              <a
                key={t.id}
                href={t.article}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover block"
              >
                {card}
              </a>
            ) : (
              <div key={t.id} className="card">
                {card}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
