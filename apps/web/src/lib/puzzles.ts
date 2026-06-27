// Config for every map puzzle. The generic <MapPuzzle/> component is driven
// entirely by these definitions, so adding a new puzzle is just a new entry.

import { STATE_INFO } from "./stateInfo";
import { KA_DISTRICT_FACTS } from "./kaDistrictFacts";

export interface PuzzleDef {
  slug: string;
  group: "India" | "States of India" | "World";
  emoji: string;
  title: string;
  noun: string;
  blurb: string;
  src: string;
  nameKeys: string[];
  filterKey?: string;
  filterValue?: string;
  exclude?: string[];
  facts?: Record<string, string>;
}

// "Famous for" hints for Indian states, from the curated culture notes.
const STATE_FACTS: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_INFO)
    .filter(([k]) => k !== "india")
    .map(([k, v]) => [k, v.culture[0] ?? v.crops.slice(0, 3).join(", ")]),
);

const INDIA_NAME_KEYS = ["ST_NM", "st_nm", "NAME_1", "STATE", "name", "State_Name"];
const DISTRICT_NAME_KEYS = ["district", "DISTRICT", "dtname", "name"];
const COUNTRY_NAME_KEYS = ["NAME", "ADMIN", "NAME_LONG", "name"];

// Tiny enclaves with no clickable footprint on the India states map.
const INDIA_EXCLUDE = [
  "Puducherry",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Daman and Diu",
  "Dadra and Nagar Haveli",
];

function districtPuzzle(slug: string, state: string, emoji: string): PuzzleDef {
  return {
    slug,
    group: "States of India",
    emoji,
    title: `${state} Districts`,
    noun: "districts",
    blurb: `Find each district of ${state} on a blank map.`,
    src: "/geo/india.geojson",
    nameKeys: DISTRICT_NAME_KEYS,
    filterKey: "st_nm",
    filterValue: state,
  };
}

function continentPuzzle(slug: string, continent: string, emoji: string): PuzzleDef {
  return {
    slug,
    group: "World",
    emoji,
    title: `${continent} — Countries`,
    noun: "countries",
    blurb: `Locate every country in ${continent}.`,
    src: "/geo/countries.geojson",
    nameKeys: COUNTRY_NAME_KEYS,
    filterKey: "CONTINENT",
    filterValue: continent,
  };
}

export const PUZZLES: PuzzleDef[] = [
  {
    slug: "india-states",
    group: "India",
    emoji: "🇮🇳",
    title: "India — States & UTs",
    noun: "states",
    blurb: "Find every Indian state and union territory on a blank map.",
    src: "/geo/india-states.geojson",
    nameKeys: INDIA_NAME_KEYS,
    exclude: INDIA_EXCLUDE,
    facts: STATE_FACTS,
  },
  {
    slug: "karnataka-districts",
    group: "States of India",
    emoji: "🏞️",
    title: "Karnataka Districts",
    noun: "districts",
    blurb: "Find each Karnataka district — with famous-for hints.",
    src: "/geo/india.geojson",
    nameKeys: DISTRICT_NAME_KEYS,
    filterKey: "st_nm",
    filterValue: "Karnataka",
    facts: KA_DISTRICT_FACTS,
  },
  districtPuzzle("tamil-nadu-districts", "Tamil Nadu", "🛕"),
  districtPuzzle("maharashtra-districts", "Maharashtra", "🏙️"),
  districtPuzzle("kerala-districts", "Kerala", "🌴"),
  districtPuzzle("uttar-pradesh-districts", "Uttar Pradesh", "🕌"),
  continentPuzzle("europe-countries", "Europe", "🏰"),
  continentPuzzle("asia-countries", "Asia", "🏯"),
  continentPuzzle("africa-countries", "Africa", "🦁"),
  continentPuzzle("south-america-countries", "South America", "🦜"),
  continentPuzzle("north-america-countries", "North America", "🗽"),
  continentPuzzle("oceania-countries", "Oceania", "🦘"),
];

export function getPuzzle(slug: string): PuzzleDef | undefined {
  return PUZZLES.find((p) => p.slug === slug);
}
