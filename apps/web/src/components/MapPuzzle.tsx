"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { recordPuzzle, formatMs, getProgress } from "@/lib/progress";

interface Shape {
  name: string;
  d: string;
  /** Rough centroid (lng, lat) for location hints. */
  cx: number;
  cy: number;
  /** Rounded boundary vertices, for neighbour detection. */
  verts: Set<string>;
}

interface Bounds {
  minX: number;
  minY: number;
  w: number;
  h: number;
}

interface Neighbour {
  name: string;
  shared: number;
}

export interface MapPuzzleProps {
  /** Heading, e.g. "Map Puzzle — India". */
  title: string;
  /** Plural noun for the pieces, e.g. "states" or "districts". */
  noun: string;
  /** GeoJSON URL under /public. */
  src: string;
  /** Property keys to read the feature name from (first match wins). */
  nameKeys: string[];
  /** Optional: only keep features whose `filterKey` equals `filterValue` (case-insensitive). */
  filterKey?: string;
  filterValue?: string;
  /** Optional "famous for" notes keyed by feature name — used as the first hint. */
  facts?: Record<string, string>;
  /** Optional feature names to drop entirely (e.g. tiny/island UTs that can't be clicked). */
  exclude?: string[];
  /** Stable id used to persist personal-best progress (found count + best time). */
  progressId?: string;
}

function norm(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

type Geom = { type: string; coordinates: unknown };
// Longitude transform — lets us "unwrap" regions that cross the antimeridian.
type Tx = (lng: number) => number;

function ringToPath(ring: number[][], tx: Tx): string {
  return (
    ring
      .map((pt, i) => `${i === 0 ? "M" : "L"}${tx(pt[0]).toFixed(2)} ${(-pt[1]).toFixed(2)}`)
      .join(" ") + " Z"
  );
}

function geomToPath(geom: Geom, tx: Tx): string {
  if (geom.type === "Polygon") {
    return (geom.coordinates as number[][][]).map((r) => ringToPath(r, tx)).join(" ");
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as number[][][][]).flat().map((r) => ringToPath(r, tx)).join(" ");
  }
  return "";
}

function eachCoord(geom: Geom, cb: (lng: number, lat: number) => void) {
  const ring = (r: number[][]) => {
    for (const [lng, lat] of r) cb(lng!, lat!);
  };
  if (geom.type === "Polygon") (geom.coordinates as number[][][]).forEach(ring);
  else if (geom.type === "MultiPolygon")
    (geom.coordinates as number[][][][]).forEach((p) => p.forEach(ring));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Where on the whole map a centroid sits, e.g. "south-western". */
function regionWord(cx: number, cy: number, b: Bounds): string {
  const minLng = b.minX;
  const maxLng = b.minX + b.w;
  const maxLat = -b.minY;
  const minLat = maxLat - b.h;
  const fx = (cx - minLng) / (maxLng - minLng || 1);
  const fy = (cy - minLat) / (maxLat - minLat || 1);
  const ns = fy >= 0.6 ? "north" : fy <= 0.4 ? "south" : "";
  const ew = fx >= 0.6 ? "eastern" : fx <= 0.4 ? "western" : "";
  if (ns && ew) return `${ns}-${ew}`;
  if (ns) return `${ns}ern`;
  if (ew) return ew;
  return "central";
}

/** Direction of `to` relative to `from`, e.g. "south-east". */
function dirWord(from: Shape, to: Shape): string {
  const dLng = to.cx - from.cx;
  const dLat = to.cy - from.cy;
  const ns = Math.abs(dLat) > Math.abs(dLng) * 0.5 ? (dLat > 0 ? "north" : "south") : "";
  const ew = Math.abs(dLng) > Math.abs(dLat) * 0.5 ? (dLng > 0 ? "east" : "west") : "";
  if (ns && ew) return `${ns}-${ew}`;
  return ns || ew || "right next to";
}

export function MapPuzzle({
  title,
  noun,
  src,
  nameKeys,
  filterKey,
  filterValue,
  facts,
  exclude,
  progressId,
}: MapPuzzleProps) {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [error, setError] = useState(false);

  const [queue, setQueue] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<{ name: string; ok: boolean } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [isFs, setIsFs] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealCurrent, setRevealCurrent] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const [bestMs, setBestMs] = useState<number | null>(null);
  const recordedRef = useRef(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // The prompt box can be dragged anywhere over the map. `null` = default corner.
  const [boxPos, setBoxPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ ox: number; oy: number; w: number; h: number } | null>(null);

  const onBoxDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.parentElement;
    const container = mapRef.current;
    if (!box || !container) return;
    const b = box.getBoundingClientRect();
    dragRef.current = { ox: e.clientX - b.left, oy: e.clientY - b.top, w: b.width, h: b.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onBoxDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const container = mapRef.current;
    if (!d || !container) return;
    const c = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - c.left - d.ox, c.width - d.w));
    const y = Math.max(0, Math.min(e.clientY - c.top - d.oy, c.height - d.h));
    setBoxPos({ x, y });
  };
  const onBoxDragEnd = () => {
    dragRef.current = null;
  };

  // "countries" → "country", "districts" → "district", "states" → "state".
  const singular = /ies$/.test(noun) ? noun.replace(/ies$/, "y") : noun.replace(/s$/, "");

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFs = () => {
    const el = mapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  useEffect(() => {
    let cancelled = false;
    setShapes(null);
    setError(false);
    fetch(src)
      .then((r) => r.json())
      .then(
        (gj: {
          features: {
            properties: Record<string, unknown>;
            geometry: { type: string; coordinates: unknown };
          }[];
        }) => {
          if (cancelled) return;
          const want = filterValue ? norm(filterValue) : null;
          const excludeSet = new Set((exclude ?? []).map(norm));

          // Collect the features we'll keep (filtered, named, with geometry).
          const picked: { name: string; geom: Geom }[] = [];
          for (const f of gj.features) {
            if (filterKey && want && norm(f.properties[filterKey]) !== want) continue;
            const key = nameKeys.find((k) => typeof f.properties[k] === "string");
            const name = key ? String(f.properties[key]) : null;
            if (!name) continue;
            if (excludeSet.has(norm(name))) continue;
            if (f.geometry?.type !== "Polygon" && f.geometry?.type !== "MultiPolygon") continue;
            picked.push({ name, geom: f.geometry });
          }

          // Pass 1: handle regions that wrap across the antimeridian (Oceania,
          // North America's Aleutians, etc.). A naive "shift every negative
          // longitude" breaks regions like Europe that straddle BOTH the prime
          // meridian (Portugal at -9°) and the antimeridian, so instead we find
          // the widest empty longitude gap and rotate the map to cut there.
          const lngs: number[] = [];
          for (const p of picked) eachCoord(p.geom, (lng) => lngs.push(lng));
          let tx: Tx = (lng) => lng;
          if (lngs.length > 1) {
            const sorted = [...lngs].sort((a, b) => a - b);
            const lo = sorted[0];
            const hi = sorted[sorted.length - 1];
            // Start with the natural wrap gap (across ±180); beat it with any
            // wider interior gap, which would mean the region truly wraps.
            let gapEdge = hi;
            let gapSize = lo + 360 - hi;
            for (let i = 1; i < sorted.length; i++) {
              const g = sorted[i] - sorted[i - 1];
              if (g > gapSize) {
                gapSize = g;
                gapEdge = sorted[i - 1];
              }
            }
            if (hi - lo > 180 && gapEdge < hi) {
              tx = (lng) => (lng <= gapEdge ? lng + 360 : lng);
            }
          }

          // Pass 2: build paths/bbox/centroids using the (possibly shifted) longitudes.
          let minLng = Infinity;
          let maxLng = -Infinity;
          let minLat = Infinity;
          let maxLat = -Infinity;
          // Merge features that share a name (some states/districts are split
          // into several features) so each piece is asked exactly once.
          const byName = new Map<
            string,
            { name: string; d: string; sLng: number; sLat: number; cnt: number; verts: Set<string> }
          >();
          for (const p of picked) {
            const d = geomToPath(p.geom, tx);
            if (!d) continue;
            const entry =
              byName.get(p.name) ??
              (() => {
                const e = { name: p.name, d: "", sLng: 0, sLat: 0, cnt: 0, verts: new Set<string>() };
                byName.set(p.name, e);
                return e;
              })();
            entry.d = entry.d ? `${entry.d} ${d}` : d;
            eachCoord(p.geom, (rawLng, lat) => {
              const lng = tx(rawLng);
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
              entry.sLng += lng;
              entry.sLat += lat;
              entry.cnt += 1;
              entry.verts.add(`${lng.toFixed(1)}:${lat.toFixed(1)}`);
            });
          }

          const out: Shape[] = [...byName.values()].map((e) => ({
            name: e.name,
            d: e.d,
            cx: e.cnt ? e.sLng / e.cnt : 0,
            cy: e.cnt ? e.sLat / e.cnt : 0,
            verts: e.verts,
          }));
          if (out.length === 0) {
            setError(true);
            return;
          }
          out.sort((a, b) => a.name.localeCompare(b.name));
          setShapes(out);
          setBounds({ minX: minLng, minY: -maxLat, w: maxLng - minLng, h: maxLat - minLat });
          setQueue(shuffle(out.map((s) => s.name)));
        },
      )
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [src, filterKey, filterValue, nameKeys, exclude]);

  // Always ask the next *unfound* piece, so a piece is never asked twice.
  const target = useMemo(() => queue.find((n) => !found.has(n)) ?? null, [queue, found]);
  const total = shapes?.length ?? 0;
  const done = total > 0 && found.size >= total;

  // Reset hints whenever the asked-for piece changes.
  useEffect(() => {
    setHintLevel(0);
    setRevealCurrent(false);
  }, [target]);

  // Stopwatch ticks while a round is in progress.
  useEffect(() => {
    if (startedAt === null || done) return;
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt, done]);

  // Persist partial mastery as pieces are found.
  useEffect(() => {
    if (progressId && total > 0) recordPuzzle(progressId, found.size, total);
  }, [progressId, found, total]);

  // On completion: freeze the timer and save a personal best time.
  useEffect(() => {
    if (!done || recordedRef.current) return;
    recordedRef.current = true;
    const ms = startedAt != null ? Date.now() - startedAt : 0;
    setFinalMs(ms);
    if (progressId) {
      recordPuzzle(progressId, total, total, ms);
      setBestMs(getProgress().puzzles[progressId]?.bestMs ?? ms);
    }
  }, [done, startedAt, progressId, total]);

  const elapsedMs = finalMs ?? (startedAt != null ? Math.max(0, nowTick - startedAt) : 0);

  const shapeByName = useMemo(() => {
    const m = new Map<string, Shape>();
    shapes?.forEach((s) => m.set(s.name, s));
    return m;
  }, [shapes]);

  const factMap = useMemo(() => {
    const m = new Map<string, string>();
    if (facts) for (const [k, v] of Object.entries(facts)) m.set(norm(k), v);
    return m;
  }, [facts]);

  // Neighbour adjacency from shared boundary vertices (>=2 shared points).
  const adjacency = useMemo(() => {
    const m = new Map<string, Neighbour[]>();
    if (!shapes) return m;
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i]!;
        const b = shapes[j]!;
        const [small, big] = a.verts.size < b.verts.size ? [a.verts, b.verts] : [b.verts, a.verts];
        let shared = 0;
        for (const v of small) if (big.has(v)) shared += 1;
        if (shared >= 2) {
          (m.get(a.name) ?? m.set(a.name, []).get(a.name)!).push({ name: b.name, shared });
          (m.get(b.name) ?? m.set(b.name, []).get(b.name)!).push({ name: a.name, shared });
        }
      }
    }
    for (const list of m.values()) list.sort((x, y) => y.shared - x.shared);
    return m;
  }, [shapes]);

  // Progressive hints for the current target.
  const hints = useMemo<string[]>(() => {
    if (!target || !bounds) return [];
    const arr: string[] = [];
    const fact = factMap.get(norm(target));
    if (fact) arr.push(`Famous for: ${fact}.`);
    const sh = shapeByName.get(target);
    if (sh) {
      let loc = `It sits in the ${regionWord(sh.cx, sh.cy, bounds)} part of the map.`;
      const nb = adjacency.get(target) ?? [];
      if (nb.length) {
        const refShape = shapeByName.get(nb[0]!.name);
        if (refShape) loc += ` It lies to the ${dirWord(refShape, sh)} of ${nb[0]!.name}.`;
        const others = nb.slice(1, 3).map((n) => n.name);
        if (others.length) loc += ` It also borders ${others.join(" & ")}.`;
      }
      arr.push(loc);
    }
    return arr;
  }, [target, bounds, factMap, shapeByName, adjacency]);

  const shownHints = hints.slice(0, hintLevel);

  const onPick = (name: string) => {
    if (!target || done || found.has(name)) return;
    if (startedAt === null) {
      setStartedAt(Date.now());
      setNowTick(Date.now());
    }
    setAttempts((a) => a + 1);
    if (name === target) {
      if (!revealCurrent) setHits((h) => h + 1);
      setFound((f) => new Set(f).add(name));
      setFlash({ name, ok: true });
      setTimeout(() => setFlash(null), 500);
    } else {
      setFlash({ name, ok: false });
      setTimeout(() => setFlash(null), 500);
    }
  };

  const restart = () => {
    setFound(new Set());
    setAttempts(0);
    setHits(0);
    setFlash(null);
    setHintLevel(0);
    setRevealCurrent(false);
    setStartedAt(null);
    setNowTick(0);
    setFinalMs(null);
    recordedRef.current = false;
    if (shapes) setQueue(shuffle(shapes.map((s) => s.name)));
  };

  const fillFor = (name: string) => {
    if (flash && flash.name === name) return flash.ok ? "#34d399" : "#f43f5e";
    if (found.has(name)) return "#2dd4bf";
    if (revealCurrent && name === target) return "#f59e0b";
    if (hover === name) return "#475569";
    return "#1e293b";
  };

  const accuracy = attempts ? Math.round((hits / attempts) * 100) : 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link href="/games" className="text-sm text-brand-400 hover:underline">
        ← All quizzes
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">🗺️ {title}</h1>
        <div className="text-sm text-slate-300">
          Found <span className="font-semibold text-white">{found.size}</span> / {total} · Accuracy{" "}
          {accuracy}% · ⏱ {formatMs(elapsedMs)}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 p-3 text-center">
        {error && (
          <p className="text-slate-300">Couldn&apos;t load the map. Reload to try again.</p>
        )}
        {!error && !shapes && <p className="text-slate-400">Loading map…</p>}
        {!error && shapes && !done && target && (
          <p className="text-white">
            Find <span className="font-semibold text-brand-300">{target}</span> on the map
            {flash && !flash.ok && (
              <span className="ml-2 text-rose-300">— not quite, try again</span>
            )}
          </p>
        )}
        {done && (
          <div className="text-sm">
            <p className="text-lg font-bold text-white">
              All {total} {noun} placed! Accuracy {accuracy}%
            </p>
            <p className="mt-1 text-slate-300">
              Time {formatMs(elapsedMs)}
              {bestMs != null && (
                <span className="ml-2 text-brand-300">
                  · best {formatMs(bestMs)}
                  {finalMs != null && bestMs >= finalMs ? " 🏆 new best!" : ""}
                </span>
              )}
            </p>
            <button
              onClick={restart}
              className="mt-3 rounded-full bg-brand-500 px-5 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
            >
              Play again
            </button>
          </div>
        )}
      </div>

      {bounds && shapes && (
        <div
          ref={mapRef}
          className={`relative mt-4 overflow-hidden border border-white/10 bg-ink-950 p-2 ${
            isFs ? "flex h-screen w-screen items-center justify-center rounded-none" : "rounded-2xl"
          }`}
        >
          {!done && target && (
            <div
              className={`absolute z-10 max-w-[16rem] rounded-lg border border-white/10 bg-ink-950/90 px-3 py-2 text-left shadow-lg backdrop-blur ${
                boxPos ? "" : "left-3 top-3"
              }`}
              style={boxPos ? { left: boxPos.x, top: boxPos.y } : undefined}
            >
              <div
                onPointerDown={onBoxDragStart}
                onPointerMove={onBoxDragMove}
                onPointerUp={onBoxDragEnd}
                className="-mx-1 -mt-1 mb-0.5 flex cursor-move touch-none items-center gap-1 px-1 pt-1 text-[10px] uppercase tracking-wider text-slate-400 select-none"
                title="Drag to move"
              >
                <span className="text-slate-500">⠿</span> Find this {singular}
              </div>
              <p className="text-base font-bold text-brand-300">{target}</p>

              {shownHints.map((h, i) => (
                <p key={i} className="mt-1 text-xs leading-snug text-slate-300">
                  💡 {h}
                </p>
              ))}
              {revealCurrent && (
                <p className="mt-1 text-xs font-medium text-amber-300">
                  👁 Click the amber marker on the map.
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {hintLevel < hints.length && (
                  <button
                    onClick={() => setHintLevel((l) => l + 1)}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
                  >
                    {hintLevel === 0 ? "💡 Hint" : "💡 Another hint"}
                  </button>
                )}
                {!revealCurrent && (
                  <button
                    onClick={() => setRevealCurrent(true)}
                    className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/30"
                  >
                    👁 Show answer
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={toggleFs}
            className="absolute right-3 top-3 z-10 rounded-lg border border-white/10 bg-ink-950/85 px-3 py-2 text-sm font-medium text-slate-200 shadow-lg backdrop-blur transition hover:bg-ink-900"
          >
            {isFs ? "✕ Exit" : "⛶ Full screen"}
          </button>

          {isFs && !done && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-ink-950/85 px-4 py-1.5 text-sm text-slate-200 shadow-lg backdrop-blur">
              Found <span className="font-semibold text-white">{found.size}</span> / {total} ·
              Accuracy {accuracy}%
            </div>
          )}

          {done && isFs && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-ink-950/75 backdrop-blur">
              <p className="text-2xl font-bold text-white">
                All {total} {noun} placed! Accuracy {accuracy}%
              </p>
              <p className="text-sm text-slate-300">
                Time {formatMs(elapsedMs)}
                {bestMs != null && <span className="ml-2 text-brand-300">· best {formatMs(bestMs)}</span>}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={restart}
                  className="rounded-full bg-brand-500 px-5 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
                >
                  Play again
                </button>
                <button
                  onClick={toggleFs}
                  className="rounded-full border border-white/15 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
                >
                  Exit full screen
                </button>
              </div>
            </div>
          )}

          <svg
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
            className={isFs ? "h-full max-h-full w-full" : "h-[34rem] w-full"}
            preserveAspectRatio="xMidYMid meet"
          >
            {shapes.map((s) => (
              <path
                key={s.name}
                d={s.d}
                fill={fillFor(s.name)}
                stroke={hover === s.name ? "#e2e8f0" : "#94a3b8"}
                strokeWidth={hover === s.name ? 1.6 : 1}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ cursor: done ? "default" : "pointer", transition: "fill 0.15s" }}
                onMouseEnter={() => setHover(s.name)}
                onMouseLeave={() => setHover((h) => (h === s.name ? null : h))}
                onClick={() => onPick(s.name)}
              />
            ))}

            {/* Reveal marker — a big clickable pin so even tiny pieces are findable. */}
            {revealCurrent &&
              target &&
              (() => {
                const ts = shapeByName.get(target);
                if (!ts) return null;
                const r = (bounds.w || 1) * 0.022;
                return (
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={() => onPick(target)}
                  >
                    <circle
                      cx={ts.cx}
                      cy={-ts.cy}
                      r={r * 2}
                      fill="#f59e0b"
                      fillOpacity={0.18}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={ts.cx} cy={-ts.cy} r={r * 0.55} fill="#f59e0b" />
                  </g>
                );
              })()}
          </svg>
        </div>
      )}
      <p className="mt-2 text-center text-xs text-slate-500">
        Click the {singular} named above. Stuck? Use 💡 Hint, then 👁 Show answer. Correct picks turn
        teal; misses flash red.
      </p>
    </div>
  );
}
