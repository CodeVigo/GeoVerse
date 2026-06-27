// Generates a comprehensive list of all countries from free, stable static
// datasets on GitHub (mledoze/countries for rich info + samayo/country-json for
// population) and writes it to `countries.generated.json` (committed, so seeding
// stays deterministic and offline).
// Re-run with: `node prisma/data/generate-countries.mjs`.
//
// Hand-curated countries in seed-data.ts (e.g. India) take precedence; the seed
// skips any generated country whose slug is already curated.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";
const POPULATION_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";

const CONTINENT_SLUG = {
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  "South America": "south-america",
  Africa: "africa",
  Oceania: "oceania",
  Antarctica: "antarctica",
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function currencyLabel(currencies) {
  if (!currencies) return null;
  const code = Object.keys(currencies)[0];
  if (!code) return null;
  const name = currencies[code]?.name;
  return name ? `${name} (${code})` : code;
}

function callingCode(idd) {
  if (!idd?.root) return null;
  const suffixes = idd.suffixes ?? [];
  return suffixes.length === 1 ? `${idd.root}${suffixes[0]}` : idd.root;
}

const normalizeName = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function main() {
  console.log("Fetching country datasets from GitHub…");
  const [raw, populations] = await Promise.all([
    fetchJson(COUNTRIES_URL),
    fetchJson(POPULATION_URL).catch(() => []),
  ]);
  if (!Array.isArray(raw)) throw new Error("Unexpected countries payload");
  console.log(`Fetched ${raw.length} countries, ${populations.length} population rows.`);

  const popByName = new Map();
  for (const p of populations) {
    if (p?.country && typeof p.population === "number") {
      popByName.set(normalizeName(p.country), p.population);
    }
  }

  // Build iso3 -> slug map first so we can wire BORDERS relations by slug.
  const iso3ToSlug = new Map();
  for (const c of raw) {
    if (c.cca3 && c.name?.common) iso3ToSlug.set(c.cca3, slugify(c.name.common));
  }

  const entities = [];
  const relations = [];

  for (const c of raw) {
    const name = c.name?.common;
    if (!name) continue;
    const slug = slugify(name);
    const continent = c.continents?.[0] ?? c.region;
    const parentSlug = CONTINENT_SLUG[continent];
    const capital = c.capital?.[0] ?? null;
    const languages = c.languages ? Object.values(c.languages) : [];
    const population =
      popByName.get(normalizeName(name)) ??
      (typeof c.population === "number" ? c.population : null);

    entities.push({
      type: "COUNTRY",
      name,
      slug,
      parentSlug,
      centroidLat: c.latlng?.[0] ?? null,
      centroidLng: c.latlng?.[1] ?? null,
      summary: `${name}${capital ? `, capital ${capital},` : ""} is a country in ${
        c.subregion || c.region || "the world"
      }${population ? ` with a population of about ${population.toLocaleString()}` : ""}.`,
      country: {
        iso2: c.cca2 ?? null,
        iso3: c.cca3 ?? null,
        flagEmoji: c.flag ?? null,
        capital,
        currency: currencyLabel(c.currencies),
        officialLanguages: languages,
        continent: continent ?? null,
        population,
        area: typeof c.area === "number" ? c.area : null,
        callingCode: callingCode(c.idd),
        data: {
          officialName: c.name?.official ?? null,
          region: c.region ?? null,
          subregion: c.subregion ?? null,
          demonym: c.demonyms?.eng?.m ?? null,
          timezones: c.timezones ?? [],
          tld: c.tld ?? [],
        },
      },
    });

    for (const borderIso3 of c.borders ?? []) {
      const toSlug = iso3ToSlug.get(borderIso3);
      if (toSlug && toSlug !== slug) {
        relations.push({ fromSlug: slug, toSlug, type: "BORDERS" });
      }
    }
  }

  entities.sort((a, b) => a.name.localeCompare(b.name));
  const out = { generatedAt: new Date().toISOString(), entities, relations };
  const file = join(__dirname, "countries.generated.json");
  await writeFile(file, JSON.stringify(out, null, 2));
  console.log(`Wrote ${entities.length} countries + ${relations.length} border relations → ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
