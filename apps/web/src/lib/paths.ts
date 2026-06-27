// Curated "guided learning paths" — ordered journeys mixing places to explore,
// games to play, and references to read. Purely static/curated content.

export type StepKind = "place" | "game" | "read";

export interface PathStep {
  title: string;
  kind: StepKind;
  href: string;
  blurb: string;
}

export interface LearningPath {
  slug: string;
  emoji: string;
  title: string;
  level: string;
  description: string;
  steps: PathStep[];
}

export const PATHS: LearningPath[] = [
  {
    slug: "karnataka-crash-course",
    emoji: "🏞️",
    title: "Karnataka Crash Course",
    level: "Exam · KAS/UPSC",
    description:
      "Everything a state-exam aspirant should know about Karnataka — geography, rivers, districts, and its famous GI products — in a guided order.",
    steps: [
      { title: "Karnataka overview", kind: "place", href: "/karnataka", blurb: "Capital, geography, demographics and the 3D map." },
      { title: "The Kaveri river", kind: "place", href: "/kaveri", blurb: "Trace its course and the regions it feeds." },
      { title: "GI tags of Karnataka", kind: "read", href: "/gi", blurb: "Mysore silk, Bidriware, Channapatna toys & more (filter to Karnataka)." },
      { title: "Test yourself: Karnataka GK", kind: "game", href: "/games/karnataka-gk", blurb: "Districts, rivers, and famous-for facts." },
    ],
  },
  {
    slug: "india-states-and-capitals",
    emoji: "🇮🇳",
    title: "India: States & Capitals",
    level: "Beginner",
    description:
      "Build a rock-solid mental map of India — every state, its capital, and where it sits on the map.",
    steps: [
      { title: "Explore India", kind: "place", href: "/india", blurb: "States, union territories and the national picture." },
      { title: "Learn the capitals", kind: "game", href: "/games/india-capitals", blurb: "Adaptive quiz over all states & UTs." },
      { title: "Place them on the map", kind: "game", href: "/games/puzzle/india-states", blurb: "Click each state on a blank map of India." },
    ],
  },
  {
    slug: "world-explorer",
    emoji: "🌍",
    title: "World Explorer Bootcamp",
    level: "Beginner → Intermediate",
    description:
      "Flags, capitals and landmarks of the world — the fast way to become a geography all-rounder.",
    steps: [
      { title: "Spin the globe", kind: "place", href: "/", blurb: "Click any country to dive into it." },
      { title: "Flag Finder", kind: "game", href: "/games/flags", blurb: "Recognise all ~200 national flags." },
      { title: "World Capitals", kind: "game", href: "/games/capitals", blurb: "Match every country to its capital." },
      { title: "Guess the Landmark", kind: "game", href: "/games/landmarks", blurb: "Identify world-famous places from photos." },
      { title: "World Geography GK", kind: "game", href: "/games/world-gk", blurb: "Continents, currencies and wonders." },
    ],
  },
  {
    slug: "rivers-and-gi",
    emoji: "🌊",
    title: "Rivers & Geographical Indications",
    level: "Intermediate",
    description:
      "Connect India's rivers to the produce and crafts they make famous — a favourite theme in competitive exams.",
    steps: [
      { title: "Kaveri river", kind: "place", href: "/kaveri", blurb: "Source, course and the basin it nourishes." },
      { title: "Krishna river", kind: "place", href: "/krishna", blurb: "One of the great peninsular rivers." },
      { title: "GI Tags Explorer", kind: "read", href: "/gi", blurb: "See how origin shapes products across India & the world." },
    ],
  },
];

export function getPath(slug: string): LearningPath | undefined {
  return PATHS.find((p) => p.slug === slug);
}
