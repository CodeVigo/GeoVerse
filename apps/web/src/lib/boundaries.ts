// Shared helpers for loading region boundary polygons (countries + India
// states/districts) from the static GeoJSON in /public/geo.

export type GeoFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
};
export type GeoJson = { type: "FeatureCollection"; features: GeoFeature[] };

export interface BoundaryQuery {
  entityType: string;
  name: string;
  iso3?: string | null;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

// Walk any coordinate structure and expand a bounding box [west,south,east,north].
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extendBounds(coords: any, b: [number, number, number, number]) {
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

export function boundsOf(features: GeoFeature[]): [number, number, number, number] {
  const b: [number, number, number, number] = [180, 90, -180, -90];
  for (const f of features) extendBounds(f.geometry.coordinates, b);
  return b;
}

export interface ContextGroup {
  name: string;
  features: GeoFeature[];
}
export interface ContextResult {
  groups: ContextGroup[];
  labels: { name: string; lng: number; lat: number }[];
}

function groupBy(features: GeoFeature[], nameOf: (f: GeoFeature) => string): ContextGroup[] {
  const m = new Map<string, GeoFeature[]>();
  for (const f of features) {
    const name = nameOf(f);
    if (!name) continue;
    if (!m.has(name)) m.set(name, []);
    m.get(name)!.push(f);
  }
  return [...m.entries()].map(([name, fs]) => ({ name, features: fs }));
}

function labelsFromGroups(groups: ContextGroup[]): { name: string; lng: number; lat: number }[] {
  return groups.map((g) => {
    const b: [number, number, number, number] = [180, 90, -180, -90];
    for (const f of g.features) extendBounds(f.geometry.coordinates, b);
    return { name: g.name, lng: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2 };
  });
}

const vKey = (x: number, y: number) => `${x.toFixed(3)},${y.toFixed(3)}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectVertices(features: GeoFeature[], set: Set<string>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const add = (c: any) => {
    if (typeof c?.[0] === "number") {
      set.add(vKey(c[0], c[1]));
      return;
    }
    if (Array.isArray(c)) for (const x of c) add(x);
  };
  for (const f of features) add(f.geometry.coordinates);
}

function featureSharesVertex(f: GeoFeature, set: Set<string>): boolean {
  let found = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const check = (c: any) => {
    if (found) return;
    if (typeof c?.[0] === "number") {
      if (set.has(vKey(c[0], c[1]))) found = true;
      return;
    }
    if (Array.isArray(c)) for (const x of c) check(x);
  };
  check(f.geometry.coordinates);
  return found;
}

// Neighbours of a region: bordering countries (from the knowledge graph, passed
// as names) or bordering Indian states/districts (computed via shared boundary
// vertices in the GeoJSON).
export async function loadContextFeatures(
  p: BoundaryQuery,
  focus: GeoFeature[],
  neighborNames?: string[],
): Promise<ContextResult> {
  if (p.entityType === "COUNTRY") {
    if (!neighborNames?.length) return { groups: [], labels: [] };
    const data: GeoJson = await fetch("/geo/countries.geojson").then((r) => r.json());
    const want = new Set(neighborNames.map(norm));
    const features = data.features.filter((f) => {
      const pr = f.properties as Record<string, string>;
      return (
        want.has(norm(pr.NAME ?? "")) ||
        want.has(norm(pr.NAME_LONG ?? "")) ||
        want.has(norm(pr.ADMIN ?? ""))
      );
    });
    const groups = groupBy(
      features,
      (f) => ((f.properties.NAME as string) ?? (f.properties.ADMIN as string) ?? "") as string,
    );
    return { groups, labels: labelsFromGroups(groups) };
  }

  const data: GeoJson = await fetch("/geo/india.geojson").then((r) => r.json());
  const focusSet = new Set<string>();
  collectVertices(focus, focusSet);

  if (p.entityType === "STATE" || p.entityType === "UNION_TERRITORY") {
    const focusKey = norm(p.name);
    const neighborStates = new Set<string>();
    for (const f of data.features) {
      const st = norm((f.properties.st_nm as string) ?? "");
      if (!st || st === focusKey) continue;
      if (featureSharesVertex(f, focusSet)) neighborStates.add(st);
    }
    const features = data.features.filter((f) =>
      neighborStates.has(norm((f.properties.st_nm as string) ?? "")),
    );
    const groups = groupBy(features, (f) => (f.properties.st_nm as string) ?? "");
    return { groups, labels: labelsFromGroups(groups) };
  }

  if (p.entityType === "DISTRICT") {
    const self = norm(p.name);
    const features = data.features.filter((f) => {
      const d = norm((f.properties.district as string) ?? "");
      return d !== self && featureSharesVertex(f, focusSet);
    });
    const groups = groupBy(features, (f) => (f.properties.district as string) ?? "");
    return { groups, labels: labelsFromGroups(groups) };
  }

  return { groups: [], labels: [] };
}

export async function loadBoundaryFeatures(p: BoundaryQuery): Promise<GeoFeature[]> {
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
