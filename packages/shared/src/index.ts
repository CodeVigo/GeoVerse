// Shared types, constants, and helpers used by both the web app and the API.

export type LearningMode = "EXPLORE" | "EXAM";

export const ENTITY_TYPES = [
  "CONTINENT",
  "COUNTRY",
  "STATE",
  "UNION_TERRITORY",
  "DISTRICT",
  "CITY",
  "RIVER",
  "MOUNTAIN",
  "MOUNTAIN_RANGE",
  "LAKE",
  "OCEAN",
  "SEA",
  "ISLAND",
  "DAM",
  "NATIONAL_PARK",
  "WILDLIFE_SANCTUARY",
  "TIGER_RESERVE",
  "BIOSPHERE_RESERVE",
  "UNESCO_SITE",
  "LANDMARK",
  "MONUMENT",
  "WATERFALL",
  "PLATEAU",
  "DESERT",
  "ANIMAL",
  "BIRD",
  "PLANT",
  "ORGANIZATION",
  "HISTORICAL_EVENT",
] as const;

export type EntityTypeName = (typeof ENTITY_TYPES)[number];

export const CONTENT_TIERS = ["MUST_KNOW", "GOOD_TO_KNOW", "EXPLORE_MORE"] as const;
export type ContentTierName = (typeof CONTENT_TIERS)[number];

// Words that may NOT be used as a top-level entity slug, to avoid colliding
// with app routes like /quiz, /games, /api, etc. (flat URL strategy).
export const RESERVED_SLUGS = new Set([
  "api",
  "quiz",
  "games",
  "explore",
  "exam",
  "search",
  "login",
  "signup",
  "learn",
  "account",
  "settings",
  "about",
  "admin",
  "learn",
  "globe",
  "gi",
  "paths",
  "solar-system",
]);

// Shape of an entity as returned by the API to the client.
export interface EntityDto {
  id: string;
  type: EntityTypeName;
  name: string;
  slug: string;
  summary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  metadata: Record<string, unknown> | null;
}

export interface RelatedEntityDto extends EntityDto {
  relation: string;
  direction: "outgoing" | "incoming";
}

export interface FactDto {
  id: string;
  tier: ContentTierName;
  importance: number;
  difficulty: number;
  title: string;
  body: string;
  examTags: string[];
}

export interface EntityDetailDto extends EntityDto {
  facts: FactDto[];
  memoryTricks: { id: string; title: string; trick: string; kind: string | null }[];
  related: RelatedEntityDto[];
  profile: Record<string, unknown> | null;
}
