"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useMode } from "./ModeProvider";
import { GiTags } from "./GiTags";
import { IndiaGiList } from "./IndiaGiList";
import { getStateInfo } from "@/lib/stateInfo";
import type { EntityDetail, Fact } from "@/lib/api";

// Cesium must only run in the browser.
const RegionGlobe3D = dynamic(
  () => import("./RegionGlobe3D").then((m) => m.RegionGlobe3D),
  { ssr: false },
);

// Geographic entities that have boundary polygons we can render in 3D.
const GEO_TYPES = new Set(["COUNTRY", "STATE", "UNION_TERRITORY", "DISTRICT"]);

// Related-entity types that get their own rich sections (so they're excluded
// from the generic "Connected on the map" chips).
const NATURE_TYPES = new Set([
  "NATIONAL_PARK",
  "WILDLIFE_SANCTUARY",
  "TIGER_RESERVE",
  "BIOSPHERE_RESERVE",
  "MOUNTAIN",
  "MOUNTAIN_RANGE",
  "LAKE",
]);
const HERITAGE_TYPES = new Set(["UNESCO_SITE", "LANDMARK", "DAM"]);
const TYPE_BADGE: Record<string, string> = {
  NATIONAL_PARK: "National Park",
  WILDLIFE_SANCTUARY: "Wildlife Sanctuary",
  TIGER_RESERVE: "Tiger Reserve",
  BIOSPHERE_RESERVE: "Biosphere Reserve",
  MOUNTAIN: "Peak",
  MOUNTAIN_RANGE: "Range",
  LAKE: "Lake",
  UNESCO_SITE: "UNESCO",
  LANDMARK: "Landmark",
  DAM: "Dam",
};

// Display order + icon for themed fact categories.
const CATEGORY_META: { key: string; icon: string }[] = [
  { key: "Geography & Climate", icon: "🏞️" },
  { key: "History & Heritage", icon: "🏛️" },
  { key: "Culture & Language", icon: "🎭" },
  { key: "Cuisine", icon: "🍽️" },
  { key: "Economy", icon: "💼" },
  { key: "Wildlife & Nature", icon: "🐯" },
  { key: "Polity & Administration", icon: "⚖️" },
];

const TIER_LABEL: Record<Fact["tier"], string> = {
  MUST_KNOW: "Must Know",
  GOOD_TO_KNOW: "Good to Know",
  EXPLORE_MORE: "Explore More",
};
const TIER_STYLE: Record<Fact["tier"], string> = {
  MUST_KNOW: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  GOOD_TO_KNOW: "bg-sky-500/15 text-sky-200 border-sky-400/30",
  EXPLORE_MORE: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
};

function humanize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function fmt(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "object") return "";
  return String(v);
}

// Which profile fields to surface as big "stats" at the top, per entity type.
const STAT_FIELDS: Record<string, string[]> = {
  COUNTRY: ["capital", "currency", "population", "area"],
  STATE: ["capital", "population", "area", "districtCount"],
  UNION_TERRITORY: ["capital", "population", "area"],
  DISTRICT: ["headquarter", "population", "area"],
};

export function EntityDetailView({ entity }: { entity: EntityDetail }) {
  const { mode, toggle } = useMode();
  const profile = (entity.profile ?? {}) as Record<string, unknown>;
  const iso3 = (profile.iso3 as string) ?? null;
  const flag = (profile.flagEmoji as string) ?? "";

  const facts = useMemo(() => {
    if (mode === "EXAM") {
      return [...entity.facts]
        .filter((f) => f.tier !== "EXPLORE_MORE")
        .sort((a, b) => b.importance - a.importance);
    }
    return entity.facts;
  }, [entity.facts, mode]);

  const stats = (STAT_FIELDS[entity.type] ?? []).filter((k) => profile[k] != null);
  const longTail = (profile.data ?? entity.metadata) as Record<string, unknown> | undefined;

  // Bordering countries (from the knowledge graph) to show faintly on the map.
  const neighborNames = useMemo(
    () => entity.related.filter((r) => r.relation === "BORDERS").map((r) => r.name),
    [entity.related],
  );

  // Dedicated lists for districts + rivers (shown as rich cards).
  const districts = useMemo(
    () =>
      entity.related
        .filter((r) => r.type === "DISTRICT")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entity.related],
  );
  const rivers = useMemo(
    () => entity.related.filter((r) => r.type === "RIVER"),
    [entity.related],
  );
  const wildlife = useMemo(
    () =>
      entity.related
        .filter((r) => NATURE_TYPES.has(r.type))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entity.related],
  );
  const heritage = useMemo(
    () =>
      entity.related
        .filter((r) => HERITAGE_TYPES.has(r.type))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entity.related],
  );

  // Group facts into themed sections by category (known categories first).
  const factGroups = useMemo(() => {
    const m = new Map<string, typeof facts>();
    for (const f of facts) {
      const key = f.category ?? "Key facts";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(f);
    }
    const ordered: { key: string; icon: string; items: typeof facts }[] = [];
    for (const { key, icon } of CATEGORY_META) {
      if (m.has(key)) {
        ordered.push({ key, icon, items: m.get(key)! });
        m.delete(key);
      }
    }
    for (const [key, items] of m) ordered.push({ key, icon: "•", items });
    return ordered;
  }, [facts]);

  // Group remaining knowledge-graph links by relation type (excluding the
  // districts/rivers/places that get their own sections).
  const grouped = useMemo(() => {
    const m = new Map<string, typeof entity.related>();
    for (const r of entity.related) {
      if (
        r.type === "DISTRICT" ||
        r.type === "RIVER" ||
        NATURE_TYPES.has(r.type) ||
        HERITAGE_TYPES.has(r.type)
      )
        continue;
      const key = r.relation.replace(/_/g, " ").toLowerCase();
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return [...m.entries()];
  }, [entity.related]);

  const isStateLike = entity.type === "STATE" || entity.type === "UNION_TERRITORY";
  const isIndia = entity.type === "COUNTRY" && entity.name === "India";
  const useTabs = isStateLike || isIndia;
  const stateInfo = useTabs ? getStateInfo(entity.name) : undefined;
  const [tab, setTab] = useState("overview");

  // For India: its child states & union territories (shown in their own tab).
  const subStates = useMemo(
    () =>
      entity.related
        .filter((r) => r.type === "STATE" || r.type === "UNION_TERRITORY")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entity.related],
  );

  // ── Section blocks (built once, placed either stacked or under tabs) ──
  const giBlock =
    entity.type === "COUNTRY" && entity.name === "India" ? (
      <IndiaGiList title="🏷️ GI Tags of India" />
    ) : isStateLike ? (
      <IndiaGiList title="🏷️ GI Tags" initialState={entity.name} lockState />
    ) : entity.type === "COUNTRY" ? (
      <GiTags place={entity.name} level="country" />
    ) : null;

  const riversBlock =
    rivers.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">🌊 Rivers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rivers.map((r) => (
            <Link key={r.id} href={`/${r.slug}`} className="card card-hover">
              <h3 className="font-semibold text-sky-200">{r.name}</h3>
              {r.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{r.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  const districtsBlock =
    districts.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">
          🗺️ Districts <span className="text-sm text-slate-500">({districts.length})</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map((d) => (
            <Link key={d.id} href={`/${d.slug}`} className="card card-hover">
              <h3 className="font-semibold text-white">{d.name}</h3>
              {d.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{d.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  const wildlifeBlock =
    wildlife.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">
          🐯 Wildlife &amp; Nature{" "}
          <span className="text-sm text-slate-500">({wildlife.length})</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wildlife.map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className="card card-hover">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-200">
                  {TYPE_BADGE[p.type] ?? p.type.replace(/_/g, " ")}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-white">{p.name}</h3>
              {p.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{p.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  const heritageBlock =
    heritage.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">
          🏛️ Heritage &amp; Landmarks{" "}
          <span className="text-sm text-slate-500">({heritage.length})</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {heritage.map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className="card card-hover">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-200">
                  {TYPE_BADGE[p.type] ?? p.type.replace(/_/g, " ")}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-white">{p.name}</h3>
              {p.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{p.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  const soilCropsBlock = stateInfo ? (
    <section className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className="card">
        <h3 className="font-semibold text-amber-200">🌱 Soil types</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {stateInfo.soils.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-amber-400">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3 className="font-semibold text-emerald-200">🌾 Major crops</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {stateInfo.crops.map((c) => (
            <span
              key={c}
              className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-sm text-emerald-100"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const cultureBlock = stateInfo ? (
    <section className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stateInfo.culture.map((c) => (
          <div key={c} className="card">
            <p className="text-sm leading-relaxed text-slate-200">🎭 {c}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const factsBlock =
    facts.length > 0 ? (
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-title mb-0">
            <span>{mode === "EXAM" ? "📌 Exam notes" : "✨ Did you know?"}</span>
          </h2>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 p-1 text-xs font-medium"
            aria-label="Toggle Explore / Exam facts"
            title="Switch between curious facts and exam-prioritised notes"
          >
            <span
              className={`rounded-full px-3 py-1 transition ${
                mode === "EXPLORE" ? "bg-brand-500 text-ink-950" : "text-slate-400"
              }`}
            >
              Explore
            </span>
            <span
              className={`rounded-full px-3 py-1 transition ${
                mode === "EXAM" ? "bg-accent-500 text-white" : "text-slate-400"
              }`}
            >
              Exam
            </span>
          </button>
        </div>
        <div className="space-y-6">
          {factGroups.map((g) => (
            <div key={g.key}>
              {factGroups.length > 1 && (
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <span>{g.icon}</span>
                  <span>{g.key}</span>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((f) => (
                  <div key={f.id} className="card card-hover">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${TIER_STYLE[f.tier]}`}>
                        {TIER_LABEL[f.tier]}
                      </span>
                      {mode === "EXAM" &&
                        f.examTags.map((t) => (
                          <span key={t} className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[11px] text-accent-300">
                            {t}
                          </span>
                        ))}
                      <span className="ml-auto flex items-center gap-0.5 text-[11px] text-amber-300/80">
                        {"★".repeat(f.importance)}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-white">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const longTailBlock =
    longTail && Object.keys(longTail).length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">🧭 More details</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(longTail)
            .filter(([, v]) => v != null)
            .map(([k, v]) => (
              <div key={k} className="card">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {humanize(k)}
                </div>
                <div className="mt-1 text-sm text-white">{fmt(v)}</div>
              </div>
            ))}
        </div>
      </section>
    ) : null;

  const memoryBlock =
    entity.memoryTricks.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">🧠 Memory tricks</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {entity.memoryTricks.map((t) => (
            <div key={t.id} className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
              <h3 className="font-semibold text-amber-200">{t.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{t.trick}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const pyqBlock =
    entity.pyqs.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">📝 Previous-year questions</h2>
        <div className="space-y-3">
          {entity.pyqs.map((q) => (
            <details key={q.id} className="card">
              <summary className="cursor-pointer font-medium text-white marker:text-brand-400">
                <span className="mr-2 rounded bg-accent-500/15 px-1.5 py-0.5 text-[11px] text-accent-300">
                  {q.exam}
                  {q.year ? ` ${q.year}` : ""}
                </span>
                {q.question}
              </summary>
              <ul className="mt-3 space-y-1 text-sm">
                {q.options.map((opt, i) => (
                  <li key={i} className={i === q.answerIndex ? "font-semibold text-emerald-300" : "text-slate-300"}>
                    {String.fromCharCode(65 + i)}. {opt}
                    {i === q.answerIndex ? "  ✓" : ""}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-2 text-sm text-slate-400">{q.explanation}</p>}
            </details>
          ))}
        </div>
      </section>
    ) : null;

  const connectedBlock =
    grouped.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">🔗 Connected on the map</h2>
        <div className="space-y-4">
          {grouped.map(([rel, items]) => (
            <div key={rel}>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">{rel}</div>
              <div className="flex flex-wrap gap-2">
                {items.map((r) => (
                  <Link
                    key={`${r.id}-${r.relation}`}
                    href={`/${r.slug}`}
                    className="chip card-hover text-slate-200"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const statesBlock =
    subStates.length > 0 ? (
      <section className="mt-6">
        <h2 className="section-title">
          🗺️ States &amp; UTs <span className="text-sm text-slate-500">({subStates.length})</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subStates.map((s) => (
            <Link key={s.id} href={`/${s.slug}`} className="card card-hover">
              <h3 className="font-semibold text-white">{s.name}</h3>
              {s.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{s.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  const mapBlock = GEO_TYPES.has(entity.type) ? (
    <div className="mt-6">
      <RegionGlobe3D
        entityType={entity.type}
        name={entity.name}
        iso3={iso3}
        neighbors={neighborNames}
        riversUrl={entity.slug === "karnataka" ? "/geo/karnataka-rivers.geojson" : undefined}
      />
    </div>
  ) : null;

  const hero = (
    <>
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Back to globe
      </Link>
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          {flag && <span className="text-4xl leading-none">{flag}</span>}
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {entity.name}
          </h1>
          <span className="chip uppercase tracking-wide text-slate-300">
            {entity.type.replace(/_/g, " ")}
          </span>
        </div>
        {entity.summary && (
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-300">
            {entity.summary}
          </p>
        )}
        {stats.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((k) => (
              <div key={k} className="card">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {humanize(k)}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">{fmt(profile[k])}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // ── State / UT / India pages: split content into accessible tabbed sections ──
  if (useTabs) {
    const TABS: { id: string; label: string; show: boolean; node: ReactNode }[] = [
      {
        id: "overview",
        label: "Overview",
        show: true,
        node: (
          <>
            {factsBlock}
            {memoryBlock}
            {pyqBlock}
            {longTailBlock}
            {connectedBlock}
            {!factsBlock && !memoryBlock && !pyqBlock && !longTailBlock && !connectedBlock && (
              <p className="mt-6 text-sm text-slate-400">More details coming soon.</p>
            )}
          </>
        ),
      },
      { id: "states", label: `States & UTs (${subStates.length})`, show: subStates.length > 0, node: statesBlock },
      { id: "districts", label: `Districts (${districts.length})`, show: districts.length > 0, node: districtsBlock },
      { id: "rivers", label: "Rivers", show: rivers.length > 0, node: riversBlock },
      { id: "soil", label: "Soil & Crops", show: !!soilCropsBlock, node: soilCropsBlock },
      { id: "culture", label: "Culture", show: !!cultureBlock, node: cultureBlock },
      { id: "wildlife", label: "Wildlife", show: wildlife.length > 0, node: wildlifeBlock },
      { id: "heritage", label: "Heritage", show: heritage.length > 0, node: heritageBlock },
      { id: "gi", label: "GI Tags", show: true, node: giBlock },
    ].filter((t) => t.show);

    const active = TABS.find((t) => t.id === tab) ?? TABS[0]!;

    return (
      <div className="mx-auto max-w-5xl px-4 py-7 md:px-6">
        {hero}
        {mapBlock}

        <div className="mt-7 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active.id === t.id
                  ? "bg-brand-500 text-ink-950"
                  : "border border-white/10 bg-ink-800/60 text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[12rem]">{active.node}</div>
      </div>
    );
  }

  // ── All other entity types: classic stacked layout ──
  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-6">
      {hero}
      {mapBlock}
      {giBlock}
      {riversBlock}
      {districtsBlock}
      {wildlifeBlock}
      {heritageBlock}
      {factsBlock}
      {longTailBlock}
      {memoryBlock}
      {pyqBlock}
      {connectedBlock}
    </div>
  );
}
