"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type GeoFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
};
type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

interface Props {
  entityType: string;
  name: string;
  iso3?: string | null;
}

// Walk any coordinate structure and expand a bounding box.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extendBounds(coords: any, b: [number, number, number, number]) {
  if (typeof coords?.[0] === "number") {
    const x = coords[0] as number;
    const y = coords[1] as number;
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
    return;
  }
  if (Array.isArray(coords)) for (const c of coords) extendBounds(c, b);
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

async function loadFeatures(p: Props): Promise<GeoFeature[]> {
  if (p.entityType === "COUNTRY") {
    const data: GeoJson = await fetch("/geo/countries.geojson").then((r) => r.json());
    const iso = p.iso3 ?? "";
    return data.features.filter((f) => {
      const pr = f.properties as Record<string, string>;
      return (
        (iso && (pr.ADM0_A3 === iso || pr.ISO_A3 === iso || pr.SOV_A3 === iso)) ||
        norm(pr.NAME ?? "") === norm(p.name) ||
        norm(pr.NAME_LONG ?? "") === norm(p.name) ||
        norm(pr.ADMIN ?? "") === norm(p.name)
      );
    });
  }

  // India states / union territories / districts come from the district-level file.
  const data: GeoJson = await fetch("/geo/india.geojson").then((r) => r.json());
  if (p.entityType === "STATE" || p.entityType === "UNION_TERRITORY") {
    return data.features.filter(
      (f) => norm((f.properties.st_nm as string) ?? "") === norm(p.name),
    );
  }
  if (p.entityType === "DISTRICT") {
    const target = norm(p.name).replace(/urban|rural/g, "");
    return data.features.filter((f) => {
      const d = norm((f.properties.district as string) ?? "");
      return d === norm(p.name) || d === target || d.includes(target) || target.includes(d);
    });
  }
  return [];
}

export function BoundaryMap({ entityType, name, iso3 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let map: maplibregl.Map | null = null;
    let cancelled = false;

    (async () => {
      const features = await loadFeatures({ entityType, name, iso3 }).catch(() => []);
      if (cancelled || !ref.current) return;
      if (!features.length) {
        setStatus("empty");
        return;
      }

      const fc: GeoJson = { type: "FeatureCollection", features };
      const b: [number, number, number, number] = [180, 90, -180, -90];
      for (const f of features) extendBounds(f.geometry.coordinates, b);

      map = new maplibregl.Map({
        container: ref.current,
        attributionControl: false,
        style: {
          version: 8,
          sources: {},
          layers: [{ id: "bg", type: "background", paint: { "background-color": "#070b15" } }],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        map.addSource("boundary", { type: "geojson", data: fc as never });
        map.addLayer({
          id: "boundary-fill",
          type: "fill",
          source: "boundary",
          paint: { "fill-color": "#2dd4bf", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: "boundary-line",
          type: "line",
          source: "boundary",
          paint: { "line-color": "#5eead4", "line-width": 1.4 },
        });
        // Inner district separators show up naturally for multi-feature states.
        map.fitBounds([b[0], b[1], b[2], b[3]], { padding: 36, duration: 0, maxZoom: 7 });
        setStatus("ready");
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [entityType, name, iso3]);

  if (status === "empty") return null;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070b15] md:h-96">
      <div ref={ref} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          Loading map…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] uppercase tracking-wider text-slate-500">
        {name} · boundary
      </div>
    </div>
  );
}
