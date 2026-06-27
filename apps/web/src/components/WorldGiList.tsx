"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchGiCountries, fetchGiTags, type GiCountry, type GiTag } from "@/lib/wikidata";
import { WikiThumb } from "./WikiThumb";

export function WorldGiList() {
  const [countries, setCountries] = useState<GiCountry[]>([]);
  const [country, setCountry] = useState("France");
  const [tags, setTags] = useState<GiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchGiCountries()
      .then((list) => {
        setCountries(list);
        if (list.length && !list.some((c) => c.name === "France")) setCountry(list[0]!.name);
      })
      .catch(() => {
        /* keep default */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchGiTags(country, "country")
      .then((t) => !cancelled && setTags(t))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [country]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? tags.filter((t) => t.name.toLowerCase().includes(needle)) : tags;
  }, [tags, q]);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search GI products…"
          className="min-w-[12rem] flex-1 rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
        >
          {countries.length === 0 && <option value={country}>{country}</option>}
          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">Live from Wikidata</p>

      {loading && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-white/[0.03]" />
          ))}
        </div>
      )}

      {error && (
        <p className="card mt-3 text-sm text-slate-400">
          Couldn&apos;t reach Wikidata. Try another country or reload.
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-semibold text-white">{filtered.length}</span> GIs in {country}.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const inner = (
                <>
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.image}
                      alt={t.name}
                      loading="lazy"
                      className="h-28 w-full border-b border-white/10 object-cover"
                    />
                  ) : (
                    <WikiThumb title={t.name} className="h-28 w-full border-b border-white/10" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-amber-200">{t.name}</h3>
                    {t.description && (
                      <p className="mt-1 text-sm capitalize leading-relaxed text-slate-300">
                        {t.description}
                      </p>
                    )}
                  </div>
                </>
              );
              return t.article ? (
                <a
                  key={t.id}
                  href={t.article}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover block overflow-hidden p-0"
                >
                  {inner}
                </a>
              ) : (
                <div key={t.id} className="card overflow-hidden p-0">
                  {inner}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-500">No GIs found for {country}.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
