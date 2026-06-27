// Live Geographical Indication (GI) data fetched from Wikidata's free SPARQL
// endpoint. Nothing is stored manually — results are cached in memory (per
// place) for the session. We query from the browser because Wikidata's query
// service is CORS-enabled, which also avoids server-side TLS issues.

const ENDPOINT = "https://query.wikidata.org/sparql";

// Classes that represent a geographical indication on Wikidata:
//   Q15229826 geographical indication      Q325668   designation of origin
//   Q3104453  protected geographical ind.  Q13439060 protected designation of origin
//   Q98399252 geographical indications in India
const GI_CLASSES = ["wd:Q15229826", "wd:Q325668", "wd:Q3104453", "wd:Q13439060", "wd:Q98399252"];

export interface GiTag {
  id: string;
  name: string;
  image: string | null;
  article: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
}

const cache = new Map<string, GiTag[]>();

function parsePoint(wkt: string | undefined): { lat: number | null; lng: number | null } {
  // Wikidata coordinates come as "Point(<lng> <lat>)".
  if (!wkt) return { lat: null, lng: null };
  const m = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return { lat: null, lng: null };
  return { lng: parseFloat(m[1]!), lat: parseFloat(m[2]!) };
}

function buildQuery(place: string, level: "country" | "region") {
  // P17 = country, P131 = located in admin entity (any depth for regions).
  const locator =
    level === "country"
      ? `?item wdt:P17 ?place .`
      : `?item wdt:P131* ?place .`;
  const name = JSON.stringify(place); // -> "Karnataka"
  return `SELECT ?item ?itemLabel ?image ?article ?desc ?coord WHERE {
  VALUES ?cls { ${GI_CLASSES.join(" ")} }
  ?item wdt:P31 ?cls .
  ${locator}
  ?place rdfs:label ${name}@en .
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/>. }
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?itemLabel
LIMIT 600`;
}

export async function fetchGiTags(
  place: string,
  level: "country" | "region" = "country",
): Promise<GiTag[]> {
  const key = `${level}:${place.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(buildQuery(place, level))}`;
  const res = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`Wikidata query failed: ${res.status}`);
  const data = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };

  const seen = new Set<string>();
  const out: GiTag[] = [];
  for (const b of data.results.bindings) {
    const id = b.item?.value.split("/").pop() ?? "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const rawImg = b.image?.value ?? null;
    const { lat, lng } = parsePoint(b.coord?.value);
    out.push({
      id,
      name: b.itemLabel?.value ?? id,
      // Request a reasonably sized thumbnail from Wikimedia Commons.
      image: rawImg ? `${rawImg}${rawImg.includes("?") ? "&" : "?"}width=400` : null,
      article: b.article?.value ?? null,
      description: b.desc?.value ?? null,
      lat,
      lng,
    });
  }
  cache.set(key, out);
  return out;
}

export interface GiCountry {
  name: string;
  count: number;
}

let countriesCache: GiCountry[] | null = null;

// List of countries that have at least one GI on Wikidata (for the atlas filter).
export async function fetchGiCountries(): Promise<GiCountry[]> {
  if (countriesCache) return countriesCache;
  const q = `SELECT ?countryLabel (COUNT(DISTINCT ?item) AS ?c) WHERE {
  VALUES ?cls { ${GI_CLASSES.join(" ")} }
  ?item wdt:P31 ?cls ; wdt:P17 ?country .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?countryLabel
ORDER BY DESC(?c)`;
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`Wikidata query failed: ${res.status}`);
  const data = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  const out: GiCountry[] = [];
  for (const b of data.results.bindings) {
    const name = b.countryLabel?.value;
    if (!name || /^Q\d+$/.test(name)) continue; // skip unlabelled entities
    out.push({ name, count: Number(b.c?.value ?? 0) });
  }
  countriesCache = out;
  return out;
}
