// Thin-slice seed data for GeoVerse Phase 1.
// Curated by hand for accuracy; later phases scale this via reviewed data pipelines.
//
// Entities are referenced by `slug` so relations can be wired up by slug.

import type { EntityType, RelationType, ContentTier } from "@prisma/client";

export interface SeedFact {
  tier: ContentTier;
  importance: number;
  difficulty: number;
  category?: string;
  title: string;
  body: string;
  examTags: string[];
}

export interface SeedTrick {
  title: string;
  trick: string;
  kind?: string;
}

export interface SeedPyq {
  exam: string;
  year?: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  difficulty?: number;
}

export interface SeedEntity {
  type: EntityType;
  name: string;
  slug: string;
  parentSlug?: string;
  centroidLat?: number;
  centroidLng?: number;
  summary?: string;
  metadata?: Record<string, unknown>;
  country?: Record<string, unknown>;
  state?: Record<string, unknown>;
  district?: Record<string, unknown>;
  facts?: SeedFact[];
  tricks?: SeedTrick[];
  pyqs?: SeedPyq[];
}

export interface SeedRelation {
  fromSlug: string;
  toSlug: string;
  type: RelationType;
  metadata?: Record<string, unknown>;
}

export const entities: SeedEntity[] = [
  // ── Continents (lightweight anchors) ─────────────────────────
  { type: "CONTINENT", name: "Asia", slug: "asia", centroidLat: 34, centroidLng: 100 },
  { type: "CONTINENT", name: "Europe", slug: "europe", centroidLat: 54, centroidLng: 15 },
  { type: "CONTINENT", name: "North America", slug: "north-america", centroidLat: 48, centroidLng: -100 },
  { type: "CONTINENT", name: "South America", slug: "south-america", centroidLat: -15, centroidLng: -60 },
  { type: "CONTINENT", name: "Africa", slug: "africa", centroidLat: 2, centroidLng: 20 },
  { type: "CONTINENT", name: "Oceania", slug: "oceania", centroidLat: -25, centroidLng: 134 },
  { type: "CONTINENT", name: "Antarctica", slug: "antarctica", centroidLat: -82, centroidLng: 0 },

  // ── Countries ────────────────────────────────────────────────
  {
    type: "COUNTRY",
    name: "India",
    slug: "india",
    parentSlug: "asia",
    centroidLat: 22.59,
    centroidLng: 78.96,
    summary:
      "India is the world's most populous country and largest democracy, a South Asian union of 28 states and 8 union territories.",
    country: {
      iso2: "IN",
      iso3: "IND",
      flagEmoji: "🇮🇳",
      capital: "New Delhi",
      currency: "Indian Rupee (INR)",
      officialLanguages: ["Hindi", "English"],
      continent: "Asia",
      population: 1428627663n,
      area: 3287263,
      governmentType: "Federal parliamentary republic",
      callingCode: "+91",
      data: {
        nationalAnimal: "Bengal Tiger",
        nationalBird: "Indian Peacock",
        nationalFlower: "Lotus",
        majorReligions: ["Hinduism", "Islam", "Christianity", "Sikhism"],
        organizations: ["G20", "BRICS", "SAARC", "Commonwealth", "SCO", "QUAD"],
        famousFood: ["Biryani", "Masala Dosa", "Butter Chicken"],
      },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 1,
        title: "Capital",
        body: "New Delhi is the capital of India.",
        examTags: ["UPSC", "SSC", "KPSC"],
      },
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        title: "States & UTs",
        body: "India has 28 states and 8 union territories.",
        examTags: ["UPSC", "SSC"],
      },
    ],
    tricks: [
      {
        title: "Remember the 8 UTs",
        trick: "‘AD-LJ-PC-DL’: Andaman, Delhi, Lakshadweep, J&K, Puducherry, Chandigarh, Dadra&NagarHaveli-Daman&Diu, Ladakh.",
        kind: "mnemonic",
      },
    ],
    pyqs: [
      {
        exam: "SSC",
        year: 2019,
        question: "How many union territories does India currently have?",
        options: ["6", "7", "8", "9"],
        answerIndex: 2,
        explanation: "After reorganisation, India has 8 union territories.",
        difficulty: 2,
      },
    ],
  },
  {
    type: "COUNTRY",
    name: "United States",
    slug: "united-states",
    parentSlug: "north-america",
    centroidLat: 39.5,
    centroidLng: -98.35,
    summary: "The United States is a federal republic of 50 states in North America.",
    country: {
      iso2: "US",
      iso3: "USA",
      flagEmoji: "🇺🇸",
      capital: "Washington, D.C.",
      currency: "US Dollar (USD)",
      officialLanguages: ["English (de facto)"],
      continent: "North America",
      population: 339996563n,
      area: 9833517,
      governmentType: "Federal presidential republic",
      callingCode: "+1",
      data: { organizations: ["G20", "G7", "NATO", "QUAD"] },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 1,
        title: "Capital",
        body: "Washington, D.C. is the capital of the United States.",
        examTags: ["UPSC", "SSC"],
      },
    ],
  },
  {
    type: "COUNTRY",
    name: "Japan",
    slug: "japan",
    parentSlug: "asia",
    centroidLat: 36.2,
    centroidLng: 138.25,
    summary: "Japan is an island nation in East Asia known as the Land of the Rising Sun.",
    country: {
      iso2: "JP",
      iso3: "JPN",
      flagEmoji: "🇯🇵",
      capital: "Tokyo",
      currency: "Japanese Yen (JPY)",
      officialLanguages: ["Japanese"],
      continent: "Asia",
      population: 123294513n,
      area: 377975,
      governmentType: "Unitary parliamentary constitutional monarchy",
      callingCode: "+81",
      data: { organizations: ["G20", "G7", "QUAD"] },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 4,
        difficulty: 1,
        title: "Capital & Currency",
        body: "Tokyo is the capital of Japan; its currency is the Yen.",
        examTags: ["SSC", "Banking"],
      },
    ],
  },
  {
    type: "COUNTRY",
    name: "France",
    slug: "france",
    parentSlug: "europe",
    centroidLat: 46.6,
    centroidLng: 1.88,
    summary: "France is a Western European republic famous for its culture, cuisine, and the Eiffel Tower.",
    country: {
      iso2: "FR",
      iso3: "FRA",
      flagEmoji: "🇫🇷",
      capital: "Paris",
      currency: "Euro (EUR)",
      officialLanguages: ["French"],
      continent: "Europe",
      population: 64756584n,
      area: 551695,
      governmentType: "Unitary semi-presidential republic",
      callingCode: "+33",
      data: { organizations: ["G20", "G7", "NATO", "EU"] },
    },
  },
  {
    type: "COUNTRY",
    name: "Brazil",
    slug: "brazil",
    parentSlug: "south-america",
    centroidLat: -14.24,
    centroidLng: -51.93,
    summary: "Brazil is the largest country in South America and home to most of the Amazon rainforest.",
    country: {
      iso2: "BR",
      iso3: "BRA",
      flagEmoji: "🇧🇷",
      capital: "Brasília",
      currency: "Brazilian Real (BRL)",
      officialLanguages: ["Portuguese"],
      continent: "South America",
      population: 216422446n,
      area: 8515767,
      governmentType: "Federal presidential republic",
      callingCode: "+55",
      data: { organizations: ["G20", "BRICS", "Mercosur"] },
    },
  },
  {
    type: "COUNTRY",
    name: "Australia",
    slug: "australia",
    parentSlug: "oceania",
    centroidLat: -25.27,
    centroidLng: 133.77,
    summary: "Australia is both a country and a continent, known for unique wildlife and the Great Barrier Reef.",
    country: {
      iso2: "AU",
      iso3: "AUS",
      flagEmoji: "🇦🇺",
      capital: "Canberra",
      currency: "Australian Dollar (AUD)",
      officialLanguages: ["English (de facto)"],
      continent: "Oceania",
      population: 26439111n,
      area: 7692024,
      governmentType: "Federal parliamentary constitutional monarchy",
      callingCode: "+61",
      data: { organizations: ["G20", "Commonwealth", "QUAD"] },
    },
    tricks: [
      {
        title: "Capital trap",
        trick: "Australia's capital is Canberra, NOT Sydney — a classic exam trick.",
        kind: "mnemonic",
      },
    ],
  },

  // ── Indian States ────────────────────────────────────────────
  {
    type: "STATE",
    name: "Karnataka",
    slug: "karnataka",
    parentSlug: "india",
    centroidLat: 15.32,
    centroidLng: 75.71,
    summary:
      "Karnataka is a southwestern Indian state, home to Bengaluru (India's IT capital), the Western Ghats, and a rich Kannada heritage.",
    state: {
      capital: "Bengaluru",
      formationDate: "1956-11-01",
      area: 191791,
      population: 61095297n,
      density: 319,
      literacy: 75.36,
      sexRatio: 973,
      officialLanguages: ["Kannada"],
      districtCount: 31,
      vehicleCode: "KA",
      isoCode: "IN-KA",
      governor: "Thaawarchand Gehlot",
      chiefMinister: "Siddaramaiah",
      highCourt: "Karnataka High Court (Bengaluru)",
      lokSabhaSeats: 28,
      rajyaSabhaSeats: 12,
      assemblySeats: 224,
      data: {
        majorRivers: ["Kaveri", "Krishna", "Tungabhadra"],
        highestPeak: "Mullayanagiri (1,930 m)",
        nationalParks: ["Bandipur", "Nagarhole", "Bannerghatta"],
        tigerReserves: ["Bandipur", "Bhadra", "Nagarhole (Rajiv Gandhi)"],
        unescoSites: ["Hampi", "Pattadakal"],
        festivals: ["Mysuru Dasara", "Ugadi"],
        cuisine: ["Bisi Bele Bath", "Mysore Pak", "Ragi Mudde"],
        formationDayName: "Karnataka Rajyotsava",
      },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 1,
        category: "Polity & Administration",
        title: "Capital",
        body: "Bengaluru is the capital of Karnataka.",
        examTags: ["KPSC", "SSC", "UPSC"],
      },
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        category: "Polity & Administration",
        title: "Formation Day",
        body: "Karnataka was formed on 1 November 1956, celebrated as Karnataka Rajyotsava. It was renamed from Mysore State to Karnataka in 1973.",
        examTags: ["KPSC"],
      },
      // ── Geography & Climate ──
      {
        tier: "GOOD_TO_KNOW",
        importance: 4,
        difficulty: 2,
        category: "Geography & Climate",
        title: "Highest Peak",
        body: "Mullayanagiri (1,930 m) in the Western Ghats (Chikkamagaluru) is the highest peak in Karnataka.",
        examTags: ["KPSC"],
      },
      {
        tier: "MUST_KNOW",
        importance: 4,
        difficulty: 2,
        category: "Geography & Climate",
        title: "Three terrains",
        body: "Karnataka has three natural regions: the coastal Karavali, the hilly Malnad (Western Ghats), and the interior Bayaluseeme (Deccan plateau).",
        examTags: ["KPSC", "UPSC"],
      },
      {
        tier: "GOOD_TO_KNOW",
        importance: 3,
        difficulty: 2,
        category: "Geography & Climate",
        title: "Two great river systems",
        body: "The Krishna system (Krishna, Tungabhadra, Bhima) drains the north and the Kaveri system (Kaveri, Kabini, Hemavati) drains the south.",
        examTags: ["KPSC"],
      },
      // ── History & Heritage ──
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        category: "History & Heritage",
        title: "Vijayanagara Empire",
        body: "The mighty Vijayanagara Empire ruled from Hampi (14th–16th c.), one of the richest cities of its time and now a UNESCO World Heritage Site.",
        examTags: ["UPSC", "KPSC"],
      },
      {
        tier: "GOOD_TO_KNOW",
        importance: 4,
        difficulty: 3,
        category: "History & Heritage",
        title: "Dynasties of Karnataka",
        body: "Chalukyas (Badami, Aihole, Pattadakal), Rashtrakutas, Hoysalas (Belur, Halebidu), Wodeyars of Mysore and Tipu Sultan all shaped Karnataka's heritage.",
        examTags: ["UPSC", "KPSC"],
      },
      // ── Culture & Language ──
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        category: "Culture & Language",
        title: "Kannada & the Jnanpith record",
        body: "Kannada is a classical language with ~2,000 years of literature. Kannada writers have won 8 Jnanpith Awards — the most for any Indian language.",
        examTags: ["KPSC", "UPSC"],
      },
      {
        tier: "GOOD_TO_KNOW",
        importance: 3,
        difficulty: 2,
        category: "Culture & Language",
        title: "Art forms",
        body: "Yakshagana theatre, Mysore-style painting, Bharatanatyam, and both Carnatic and Hindustani classical music traditions flourish here.",
        examTags: ["KPSC"],
      },
      {
        tier: "GOOD_TO_KNOW",
        importance: 4,
        difficulty: 1,
        category: "Culture & Language",
        title: "Mysuru Dasara",
        body: "Nada Habba (state festival) Mysuru Dasara is a 10-day celebration with the grand Jumboo Savari elephant procession.",
        examTags: ["KPSC"],
      },
      // ── Cuisine ──
      {
        tier: "EXPLORE_MORE",
        importance: 3,
        difficulty: 1,
        category: "Cuisine",
        title: "Signature dishes",
        body: "Bisi Bele Bath, Ragi Mudde, Mysore Pak, Dharwad Pedha, Mangalorean & Udupi cuisine, and South Indian filter coffee are Karnataka staples.",
        examTags: [],
      },
      // ── Economy ──
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        category: "Economy",
        title: "Silicon Valley of India",
        body: "Bengaluru is India's IT capital, contributing the largest share of the country's software exports, and hosts ISRO, HAL and a thriving biotech & startup ecosystem.",
        examTags: ["KPSC", "UPSC"],
      },
      {
        tier: "GOOD_TO_KNOW",
        importance: 4,
        difficulty: 2,
        category: "Economy",
        title: "Coffee & silk leader",
        body: "Karnataka produces ~70% of India's coffee and is the largest producer of mulberry silk and sandalwood; Ballari is a major iron-ore belt.",
        examTags: ["KPSC", "UPSC"],
      },
      // ── Wildlife & Nature ──
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        category: "Wildlife & Nature",
        title: "Tiger & elephant stronghold",
        body: "Karnataka has 5 tiger reserves and among the highest tiger and Asian elephant populations in India; the Western Ghats here are a global biodiversity hotspot.",
        examTags: ["UPSC", "KPSC"],
      },
    ],
    tricks: [
      {
        title: "UNESCO sites in Karnataka",
        trick: "‘Hampi & Pattadakal’ — think ‘HP’ for Karnataka's two UNESCO World Heritage cultural sites.",
        kind: "mnemonic",
      },
    ],
    pyqs: [
      {
        exam: "KPSC",
        question: "On which date was the state of Karnataka formed?",
        options: ["1 November 1956", "1 May 1960", "15 August 1947", "26 January 1950"],
        answerIndex: 0,
        explanation: "Karnataka (then Mysore State) was formed on 1 November 1956.",
        difficulty: 1,
      },
    ],
  },
  {
    type: "STATE",
    name: "Maharashtra",
    slug: "maharashtra",
    parentSlug: "india",
    centroidLat: 19.75,
    centroidLng: 75.71,
    summary: "Maharashtra is a western Indian state, home to Mumbai, the country's financial capital.",
    state: {
      capital: "Mumbai",
      formationDate: "1960-05-01",
      area: 307713,
      population: 112374333n,
      officialLanguages: ["Marathi"],
      vehicleCode: "MH",
      isoCode: "IN-MH",
      lokSabhaSeats: 48,
      assemblySeats: 288,
      data: { majorRivers: ["Godavari", "Krishna"], unescoSites: ["Ajanta Caves", "Ellora Caves"] },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 1,
        title: "Capital",
        body: "Mumbai is the capital of Maharashtra.",
        examTags: ["SSC", "UPSC"],
      },
    ],
  },
  {
    type: "STATE",
    name: "Tamil Nadu",
    slug: "tamil-nadu",
    parentSlug: "india",
    centroidLat: 11.13,
    centroidLng: 78.66,
    summary: "Tamil Nadu is a southern Indian state known for Dravidian temples and Tamil culture.",
    state: {
      capital: "Chennai",
      formationDate: "1969-01-14",
      area: 130058,
      population: 72147030n,
      officialLanguages: ["Tamil"],
      vehicleCode: "TN",
      isoCode: "IN-TN",
      lokSabhaSeats: 39,
      assemblySeats: 234,
      data: { majorRivers: ["Kaveri", "Vaigai"], unescoSites: ["Great Living Chola Temples", "Mahabalipuram"] },
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 1,
        title: "Capital",
        body: "Chennai is the capital of Tamil Nadu.",
        examTags: ["SSC", "UPSC"],
      },
    ],
  },

  // ── Districts (Karnataka) ────────────────────────────────────
  {
    type: "DISTRICT",
    name: "Bengaluru Urban",
    slug: "bengaluru-urban",
    parentSlug: "karnataka",
    centroidLat: 12.97,
    centroidLng: 77.59,
    summary: "Bengaluru Urban district contains Bengaluru city, India's technology hub.",
    district: {
      headquarter: "Bengaluru",
      area: 2196,
      population: 9621551n,
      data: { knownFor: ["IT industry", "ISRO HQ", "Vidhana Soudha"] },
    },
  },
  {
    type: "DISTRICT",
    name: "Mysuru",
    slug: "mysuru",
    parentSlug: "karnataka",
    centroidLat: 12.3,
    centroidLng: 76.64,
    summary: "Mysuru (Mysore) is famed for the Mysore Palace and Dasara festival.",
    district: {
      headquarter: "Mysuru",
      area: 6854,
      population: 3001127n,
      data: { knownFor: ["Mysore Palace", "Dasara", "Mysore Pak"] },
    },
  },

  // ── Capital cities (for CAPITAL_OF relations) ────────────────
  { type: "CITY", name: "Bengaluru", slug: "bengaluru", parentSlug: "bengaluru-urban", centroidLat: 12.9716, centroidLng: 77.5946 },
  { type: "CITY", name: "New Delhi", slug: "new-delhi", parentSlug: "india", centroidLat: 28.6139, centroidLng: 77.209 },

  // ── Rivers (knowledge graph + river engine seed) ─────────────
  {
    type: "RIVER",
    name: "Kaveri",
    slug: "kaveri",
    centroidLat: 11.4,
    centroidLng: 78.0,
    summary:
      "The Kaveri (Cauvery) rises in the Western Ghats at Talakaveri and flows through Karnataka and Tamil Nadu into the Bay of Bengal.",
    metadata: {
      origin: "Talakaveri, Kodagu, Karnataka",
      length_km: 805,
      mouth: "Bay of Bengal",
      dams: ["Krishna Raja Sagara (KRS)", "Mettur"],
    },
    facts: [
      {
        tier: "MUST_KNOW",
        importance: 5,
        difficulty: 2,
        title: "Source",
        body: "The Kaveri originates at Talakaveri in the Brahmagiri hills, Kodagu, Karnataka.",
        examTags: ["KPSC", "UPSC"],
      },
    ],
  },
  {
    type: "RIVER",
    name: "Krishna",
    slug: "krishna",
    centroidLat: 16.5,
    centroidLng: 79.0,
    summary:
      "The Krishna is one of the longest rivers in India, rising at Mahabaleshwar and flowing through Maharashtra, Karnataka, Telangana and Andhra Pradesh.",
    metadata: {
      origin: "Mahabaleshwar, Maharashtra",
      length_km: 1400,
      mouth: "Bay of Bengal",
    },
  },
];

// A hand-picked set of globally iconic places. These are the only markers shown
// on the home globe (metadata.featured = true), keeping it clean like Google Earth.
const WONDERS_RAW: Array<{
  name: string;
  slug: string;
  type: EntityType;
  parentSlug?: string;
  lat: number;
  lng: number;
  category: string;
  country: string;
  summary: string;
}> = [
  { name: "Taj Mahal", slug: "taj-mahal", type: "MONUMENT", parentSlug: "india", lat: 27.1751, lng: 78.0421, category: "Monument", country: "India", summary: "An ivory-white marble mausoleum built by Mughal emperor Shah Jahan for his wife Mumtaz Mahal — a UNESCO World Heritage Site and one of the New 7 Wonders." },
  { name: "Eiffel Tower", slug: "eiffel-tower", type: "MONUMENT", parentSlug: "france", lat: 48.8584, lng: 2.2945, category: "Monument", country: "France", summary: "A 330 m wrought-iron lattice tower in Paris, built for the 1889 World's Fair and now the most-visited paid monument on Earth." },
  { name: "Great Wall of China", slug: "great-wall-of-china", type: "MONUMENT", parentSlug: "china", lat: 40.4319, lng: 116.5704, category: "Monument", country: "China", summary: "A series of fortifications stretching thousands of kilometres across northern China, begun over 2,000 years ago." },
  { name: "Pyramids of Giza", slug: "pyramids-of-giza", type: "MONUMENT", parentSlug: "egypt", lat: 29.9792, lng: 31.1342, category: "Ancient Wonder", country: "Egypt", summary: "The last surviving wonder of the ancient world — the Great Pyramid was the tallest human-made structure for nearly 4,000 years." },
  { name: "Colosseum", slug: "colosseum", type: "MONUMENT", parentSlug: "italy", lat: 41.8902, lng: 12.4922, category: "Monument", country: "Italy", summary: "The largest ancient amphitheatre ever built, in the heart of Rome, once seating up to 80,000 spectators." },
  { name: "Statue of Liberty", slug: "statue-of-liberty", type: "MONUMENT", parentSlug: "united-states", lat: 40.6892, lng: -74.0445, category: "Monument", country: "United States", summary: "A gift from France in 1886, this neoclassical copper statue in New York Harbor is a global symbol of freedom." },
  { name: "Machu Picchu", slug: "machu-picchu", type: "UNESCO_SITE", parentSlug: "peru", lat: -13.1631, lng: -72.545, category: "Ancient City", country: "Peru", summary: "A 15th-century Inca citadel perched 2,430 m high in the Andes, rediscovered in 1911." },
  { name: "Christ the Redeemer", slug: "christ-the-redeemer", type: "MONUMENT", parentSlug: "brazil", lat: -22.9519, lng: -43.2105, category: "Monument", country: "Brazil", summary: "A 30 m Art Deco statue of Jesus atop Mount Corcovado overlooking Rio de Janeiro." },
  { name: "Petra", slug: "petra", type: "UNESCO_SITE", parentSlug: "jordan", lat: 30.3285, lng: 35.4444, category: "Ancient City", country: "Jordan", summary: "The 'Rose City' carved into rose-red sandstone cliffs by the Nabataeans over 2,000 years ago." },
  { name: "Sydney Opera House", slug: "sydney-opera-house", type: "LANDMARK", parentSlug: "australia", lat: -33.8568, lng: 151.2153, category: "Landmark", country: "Australia", summary: "An expressionist masterpiece with sail-shaped shells, one of the 20th century's most distinctive buildings." },
  { name: "Burj Khalifa", slug: "burj-khalifa", type: "LANDMARK", parentSlug: "united-arab-emirates", lat: 25.1972, lng: 55.2744, category: "Skyscraper", country: "UAE", summary: "At 828 m, the tallest building and structure in the world, in Dubai." },
  { name: "Mount Everest", slug: "mount-everest", type: "MOUNTAIN", parentSlug: "nepal", lat: 27.9881, lng: 86.925, category: "Mountain", country: "Nepal", summary: "Earth's highest mountain above sea level at 8,849 m, on the Nepal–China border in the Himalayas." },
  { name: "Grand Canyon", slug: "grand-canyon", type: "LANDMARK", parentSlug: "united-states", lat: 36.1069, lng: -112.1129, category: "Natural Wonder", country: "United States", summary: "A mile-deep, 446 km-long gorge carved by the Colorado River over millions of years in Arizona." },
  { name: "Niagara Falls", slug: "niagara-falls", type: "WATERFALL", parentSlug: "canada", lat: 43.0962, lng: -79.0377, category: "Waterfall", country: "Canada / USA", summary: "Three powerful waterfalls on the Canada–US border, famous for sheer flow volume." },
  { name: "Mount Fuji", slug: "mount-fuji", type: "MOUNTAIN", parentSlug: "japan", lat: 35.3606, lng: 138.7274, category: "Mountain", country: "Japan", summary: "Japan's highest peak (3,776 m), a sacred and near-perfectly symmetrical volcano." },
  { name: "Stonehenge", slug: "stonehenge", type: "MONUMENT", parentSlug: "united-kingdom", lat: 51.1789, lng: -1.8262, category: "Prehistoric Site", country: "United Kingdom", summary: "A prehistoric ring of standing stones in Wiltshire, built ~5,000 years ago." },
  { name: "Angkor Wat", slug: "angkor-wat", type: "UNESCO_SITE", parentSlug: "cambodia", lat: 13.4125, lng: 103.867, category: "Temple Complex", country: "Cambodia", summary: "The largest religious monument in the world, a 12th-century temple complex and Cambodia's national symbol." },
  { name: "Chichen Itza", slug: "chichen-itza", type: "UNESCO_SITE", parentSlug: "mexico", lat: 20.6843, lng: -88.5678, category: "Ancient City", country: "Mexico", summary: "A vast Maya city dominated by the step-pyramid of El Castillo, a New 7 Wonder." },
  { name: "Great Barrier Reef", slug: "great-barrier-reef", type: "LANDMARK", parentSlug: "australia", lat: -18.2871, lng: 147.6992, category: "Natural Wonder", country: "Australia", summary: "The world's largest coral reef system, visible from space, off Queensland's coast." },
  { name: "Acropolis of Athens", slug: "acropolis-of-athens", type: "UNESCO_SITE", parentSlug: "greece", lat: 37.9715, lng: 23.7257, category: "Ancient Citadel", country: "Greece", summary: "An ancient citadel crowned by the Parthenon, the symbol of classical civilisation." },
  { name: "Mount Kilimanjaro", slug: "mount-kilimanjaro", type: "MOUNTAIN", parentSlug: "tanzania", lat: -3.0674, lng: 37.3556, category: "Mountain", country: "Tanzania", summary: "Africa's highest peak (5,895 m) and the world's tallest free-standing mountain." },
  { name: "Victoria Falls", slug: "victoria-falls", type: "WATERFALL", parentSlug: "zambia", lat: -17.9243, lng: 25.8572, category: "Waterfall", country: "Zambia / Zimbabwe", summary: "One of the world's largest waterfalls, known locally as 'Mosi-oa-Tunya' — the smoke that thunders." },
  { name: "Petronas Towers", slug: "petronas-towers", type: "LANDMARK", parentSlug: "malaysia", lat: 3.1579, lng: 101.7116, category: "Skyscraper", country: "Malaysia", summary: "Twin 452 m towers in Kuala Lumpur, the tallest twin towers in the world." },
  { name: "Table Mountain", slug: "table-mountain", type: "MOUNTAIN", parentSlug: "south-africa", lat: -33.9628, lng: 18.4098, category: "Mountain", country: "South Africa", summary: "A flat-topped mountain forming a dramatic backdrop to Cape Town." },
  { name: "Leaning Tower of Pisa", slug: "leaning-tower-of-pisa", type: "MONUMENT", parentSlug: "italy", lat: 43.723, lng: 10.3966, category: "Monument", country: "Italy", summary: "A freestanding bell tower famous for its unintended four-degree lean." },
  { name: "Sagrada Família", slug: "sagrada-familia", type: "MONUMENT", parentSlug: "spain", lat: 41.4036, lng: 2.1744, category: "Basilica", country: "Spain", summary: "Antoni Gaudí's still-unfinished basilica in Barcelona, under construction since 1882." },
  { name: "Golden Gate Bridge", slug: "golden-gate-bridge", type: "LANDMARK", parentSlug: "united-states", lat: 37.8199, lng: -122.4783, category: "Bridge", country: "United States", summary: "An iconic 2.7 km suspension bridge spanning the entrance to San Francisco Bay." },
  { name: "Forbidden City", slug: "forbidden-city", type: "MONUMENT", parentSlug: "china", lat: 39.9163, lng: 116.3972, category: "Palace Complex", country: "China", summary: "The vast imperial palace in Beijing, home to Chinese emperors for nearly 500 years." },
  { name: "Big Ben", slug: "big-ben", type: "MONUMENT", parentSlug: "united-kingdom", lat: 51.5007, lng: -0.1246, category: "Monument", country: "United Kingdom", summary: "The Great Bell of the clock tower (Elizabeth Tower) at the Palace of Westminster, a symbol of London." },
  { name: "Brandenburg Gate", slug: "brandenburg-gate", type: "MONUMENT", parentSlug: "germany", lat: 52.5163, lng: 13.3777, category: "Monument", country: "Germany", summary: "An 18th-century neoclassical monument in Berlin and a symbol of German reunification." },
  { name: "Neuschwanstein Castle", slug: "neuschwanstein-castle", type: "LANDMARK", parentSlug: "germany", lat: 47.5576, lng: 10.7498, category: "Castle", country: "Germany", summary: "A fairytale 19th-century Bavarian castle that inspired Disney's Sleeping Beauty castle." },
  { name: "Hagia Sophia", slug: "hagia-sophia", type: "MONUMENT", parentSlug: "turkey", lat: 41.0086, lng: 28.9802, category: "Monument", country: "Türkiye", summary: "A 6th-century Byzantine marvel in Istanbul, successively a cathedral, mosque, museum and mosque again." },
  { name: "Moai of Easter Island", slug: "moai-easter-island", type: "MONUMENT", parentSlug: "chile", lat: -27.1212, lng: -109.3666, category: "Ancient Statues", country: "Chile", summary: "Nearly 900 monolithic human figures carved by the Rapa Nui people on a remote Pacific island." },
  { name: "Santorini", slug: "santorini", type: "LANDMARK", parentSlug: "greece", lat: 36.3932, lng: 25.4615, category: "Island", country: "Greece", summary: "A volcanic Aegean island famous for whitewashed cliffside villages and sunsets." },
  { name: "Mount Rushmore", slug: "mount-rushmore", type: "MONUMENT", parentSlug: "united-states", lat: 43.8791, lng: -103.4591, category: "Monument", country: "United States", summary: "Colossal carvings of four US presidents in the granite of the Black Hills, South Dakota." },
  { name: "Uluru (Ayers Rock)", slug: "uluru", type: "LANDMARK", parentSlug: "australia", lat: -25.3444, lng: 131.0369, category: "Natural Wonder", country: "Australia", summary: "A massive sandstone monolith sacred to the Aṉangu people in Australia's Red Centre." },
  { name: "Matterhorn", slug: "matterhorn", type: "MOUNTAIN", parentSlug: "switzerland", lat: 45.9763, lng: 7.6586, category: "Mountain", country: "Switzerland", summary: "An iconic pyramid-shaped Alpine peak (4,478 m) on the Swiss–Italian border." },
  { name: "Iguazu Falls", slug: "iguazu-falls", type: "WATERFALL", parentSlug: "brazil", lat: -25.6953, lng: -54.4367, category: "Waterfall", country: "Brazil / Argentina", summary: "A vast system of 275 waterfalls on the border of Brazil and Argentina." },
  { name: "St. Basil's Cathedral", slug: "st-basils-cathedral", type: "MONUMENT", parentSlug: "russia", lat: 55.7525, lng: 37.6231, category: "Cathedral", country: "Russia", summary: "The brightly coloured, onion-domed cathedral on Moscow's Red Square." },
  { name: "Marina Bay Sands", slug: "marina-bay-sands", type: "LANDMARK", parentSlug: "singapore", lat: 1.2834, lng: 103.8607, category: "Landmark", country: "Singapore", summary: "A trio of towers topped by a ship-shaped SkyPark and infinity pool, defining Singapore's skyline." },
  { name: "Borobudur", slug: "borobudur", type: "UNESCO_SITE", parentSlug: "indonesia", lat: -7.6079, lng: 110.2038, category: "Temple", country: "Indonesia", summary: "The world's largest Buddhist temple, a 9th-century stepped pyramid in Central Java." },
  { name: "Grand Palace, Bangkok", slug: "grand-palace-bangkok", type: "MONUMENT", parentSlug: "thailand", lat: 13.75, lng: 100.4914, category: "Palace Complex", country: "Thailand", summary: "The dazzling former royal residence of Thailand's kings, home to the Emerald Buddha." },
  { name: "Mont-Saint-Michel", slug: "mont-saint-michel", type: "UNESCO_SITE", parentSlug: "france", lat: 48.6361, lng: -1.5115, category: "Island Abbey", country: "France", summary: "A tidal island crowned by a medieval abbey off the coast of Normandy." },
  { name: "CN Tower", slug: "cn-tower", type: "LANDMARK", parentSlug: "canada", lat: 43.6426, lng: -79.3871, category: "Tower", country: "Canada", summary: "A 553 m communications and observation tower defining Toronto's skyline." },
  { name: "Sahara Desert", slug: "sahara-desert", type: "DESERT", parentSlug: "algeria", lat: 23.4162, lng: 25.6628, category: "Desert", country: "North Africa", summary: "The largest hot desert on Earth, spanning much of North Africa — roughly the size of the United States." },
  { name: "Amazon Rainforest", slug: "amazon-rainforest", type: "LANDMARK", parentSlug: "brazil", lat: -3.4653, lng: -62.2159, category: "Rainforest", country: "Brazil", summary: "The world's largest tropical rainforest, home to ~10% of all known species on Earth." },
];

// Wikipedia article titles whose page-image we fetch for the marker photo.
// Only listed where the title differs from the place name (default = name).
const WIKI_OVERRIDES: Record<string, string> = {
  "pyramids-of-giza": "Giza pyramid complex",
  "moai-easter-island": "Moai",
  uluru: "Uluru",
  "grand-palace-bangkok": "Grand Palace",
  "sahara-desert": "Sahara",
  "amazon-rainforest": "Amazon rainforest",
  "st-basils-cathedral": "Saint Basil's Cathedral",
  "christ-the-redeemer": "Christ the Redeemer (statue)",
  "great-wall-of-china": "Great Wall of China",
  "leaning-tower-of-pisa": "Leaning Tower of Pisa",
};

const WORLD_WONDERS: SeedEntity[] = WONDERS_RAW.map((w) => ({
  type: w.type,
  name: w.name,
  slug: w.slug,
  parentSlug: w.parentSlug,
  centroidLat: w.lat,
  centroidLng: w.lng,
  summary: w.summary,
  metadata: {
    featured: true,
    category: w.category,
    country: w.country,
    wiki: WIKI_OVERRIDES[w.slug] ?? w.name,
  },
}));

// Append the curated wonders to the entity list (done after both are defined to
// avoid a temporal-dead-zone reference inside the array literal).
entities.push(...WORLD_WONDERS);

// ── All Indian states & union territories (capital + location) ──────
// Karnataka, Maharashtra and Tamil Nadu are curated above with richer content,
// so they're omitted here to avoid overwriting it.
const INDIA_ADMIN_RAW: Array<{
  name: string;
  slug: string;
  type: EntityType;
  capital: string;
  lat: number;
  lng: number;
}> = [
  { name: "Andhra Pradesh", slug: "andhra-pradesh", type: "STATE", capital: "Amaravati", lat: 15.9, lng: 79.7 },
  { name: "Arunachal Pradesh", slug: "arunachal-pradesh", type: "STATE", capital: "Itanagar", lat: 28.0, lng: 94.7 },
  { name: "Assam", slug: "assam", type: "STATE", capital: "Dispur", lat: 26.2, lng: 92.9 },
  { name: "Bihar", slug: "bihar", type: "STATE", capital: "Patna", lat: 25.6, lng: 85.1 },
  { name: "Chhattisgarh", slug: "chhattisgarh", type: "STATE", capital: "Raipur", lat: 21.3, lng: 81.9 },
  { name: "Goa", slug: "goa", type: "STATE", capital: "Panaji", lat: 15.3, lng: 74.1 },
  { name: "Gujarat", slug: "gujarat", type: "STATE", capital: "Gandhinagar", lat: 22.7, lng: 71.6 },
  { name: "Haryana", slug: "haryana", type: "STATE", capital: "Chandigarh", lat: 29.2, lng: 76.1 },
  { name: "Himachal Pradesh", slug: "himachal-pradesh", type: "STATE", capital: "Shimla", lat: 31.9, lng: 77.2 },
  { name: "Jharkhand", slug: "jharkhand", type: "STATE", capital: "Ranchi", lat: 23.6, lng: 85.3 },
  { name: "Kerala", slug: "kerala", type: "STATE", capital: "Thiruvananthapuram", lat: 10.5, lng: 76.3 },
  { name: "Madhya Pradesh", slug: "madhya-pradesh", type: "STATE", capital: "Bhopal", lat: 23.5, lng: 78.5 },
  { name: "Manipur", slug: "manipur", type: "STATE", capital: "Imphal", lat: 24.7, lng: 93.9 },
  { name: "Meghalaya", slug: "meghalaya", type: "STATE", capital: "Shillong", lat: 25.5, lng: 91.4 },
  { name: "Mizoram", slug: "mizoram", type: "STATE", capital: "Aizawl", lat: 23.3, lng: 92.8 },
  { name: "Nagaland", slug: "nagaland", type: "STATE", capital: "Kohima", lat: 26.1, lng: 94.5 },
  { name: "Odisha", slug: "odisha", type: "STATE", capital: "Bhubaneswar", lat: 20.5, lng: 84.9 },
  { name: "Punjab", slug: "punjab", type: "STATE", capital: "Chandigarh", lat: 31.0, lng: 75.5 },
  { name: "Rajasthan", slug: "rajasthan", type: "STATE", capital: "Jaipur", lat: 27.0, lng: 74.2 },
  { name: "Sikkim", slug: "sikkim", type: "STATE", capital: "Gangtok", lat: 27.5, lng: 88.5 },
  { name: "Telangana", slug: "telangana", type: "STATE", capital: "Hyderabad", lat: 17.9, lng: 79.0 },
  { name: "Tripura", slug: "tripura", type: "STATE", capital: "Agartala", lat: 23.8, lng: 91.5 },
  { name: "Uttar Pradesh", slug: "uttar-pradesh", type: "STATE", capital: "Lucknow", lat: 27.0, lng: 80.9 },
  { name: "Uttarakhand", slug: "uttarakhand", type: "STATE", capital: "Dehradun", lat: 30.1, lng: 79.1 },
  { name: "West Bengal", slug: "west-bengal", type: "STATE", capital: "Kolkata", lat: 22.9, lng: 87.8 },
  { name: "Andaman and Nicobar Islands", slug: "andaman-and-nicobar-islands", type: "UNION_TERRITORY", capital: "Port Blair", lat: 11.7, lng: 92.7 },
  { name: "Chandigarh", slug: "chandigarh", type: "UNION_TERRITORY", capital: "Chandigarh", lat: 30.73, lng: 76.78 },
  { name: "Dadra and Nagar Haveli and Daman and Diu", slug: "dadra-and-nagar-haveli-and-daman-and-diu", type: "UNION_TERRITORY", capital: "Daman", lat: 20.3, lng: 73.0 },
  { name: "Delhi", slug: "delhi", type: "UNION_TERRITORY", capital: "New Delhi", lat: 28.6, lng: 77.2 },
  { name: "Jammu and Kashmir", slug: "jammu-and-kashmir", type: "UNION_TERRITORY", capital: "Srinagar", lat: 33.8, lng: 76.6 },
  { name: "Ladakh", slug: "ladakh", type: "UNION_TERRITORY", capital: "Leh", lat: 34.2, lng: 77.6 },
  { name: "Lakshadweep", slug: "lakshadweep", type: "UNION_TERRITORY", capital: "Kavaratti", lat: 10.6, lng: 72.6 },
  { name: "Puducherry", slug: "puducherry", type: "UNION_TERRITORY", capital: "Puducherry", lat: 11.94, lng: 79.81 },
];

const INDIA_ADMIN: SeedEntity[] = INDIA_ADMIN_RAW.map((s) => ({
  type: s.type,
  name: s.name,
  slug: s.slug,
  parentSlug: "india",
  centroidLat: s.lat,
  centroidLng: s.lng,
  summary: `${s.name} is ${s.type === "UNION_TERRITORY" ? "a union territory" : "a state"} of India; its capital is ${s.capital}.`,
  state: { capital: s.capital },
}));
entities.push(...INDIA_ADMIN);

// ── Karnataka districts (HQ + what each place is famous for) ────────────
// Slugs match slugify(district name) used by the map so clicks resolve to pages.
const KN_DISTRICTS_RAW: Array<{
  name: string;
  slug: string;
  hq: string;
  lat: number;
  lng: number;
  knownFor: string[];
}> = [
  { name: "Bengaluru Urban", slug: "bengaluru-urban", hq: "Bengaluru", lat: 12.97, lng: 77.59, knownFor: ["IT capital of India", "ISRO HQ", "Vidhana Soudha", "Cubbon Park"] },
  { name: "Bengaluru Rural", slug: "bengaluru-rural", hq: "Devanahalli", lat: 13.23, lng: 77.58, knownFor: ["Kempegowda Intl. Airport", "Devanahalli Fort", "Tipu Sultan's birthplace", "grapes"] },
  { name: "Ramanagara", slug: "ramanagara", hq: "Ramanagara", lat: 12.72, lng: 77.28, knownFor: ["Sholay filming location", "silk cocoon market", "Ramadevarabetta vulture sanctuary"] },
  { name: "Kolar", slug: "kolar", hq: "Kolar", lat: 13.14, lng: 78.13, knownFor: ["Kolar Gold Fields (KGF)", "Kolaramma temple", "milk (KMF)", "silk"] },
  { name: "Chikkaballapura", slug: "chikkaballapura", hq: "Chikkaballapura", lat: 13.43, lng: 77.73, knownFor: ["Nandi Hills", "Bhoga Nandeeshwara temple", "grapes & flowers"] },
  { name: "Tumakuru", slug: "tumakuru", hq: "Tumakuru", lat: 13.34, lng: 77.1, knownFor: ["Siddaganga Math", "Devarayanadurga", "coconut", "education hub"] },
  { name: "Mandya", slug: "mandya", hq: "Mandya", lat: 12.52, lng: 76.9, knownFor: ["sugar bowl of Karnataka", "KRS dam & Brindavan Gardens", "Srirangapatna"] },
  { name: "Mysuru", slug: "mysuru", hq: "Mysuru", lat: 12.3, lng: 76.64, knownFor: ["Mysore Palace", "Dasara festival", "Chamundi Hills", "Mysore Pak & silk"] },
  { name: "Chamarajanagara", slug: "chamarajanagara", hq: "Chamarajanagara", lat: 11.92, lng: 76.94, knownFor: ["Bandipur & BR Hills", "Male Mahadeshwara Betta", "sandalwood"] },
  { name: "Kodagu", slug: "kodagu", hq: "Madikeri", lat: 12.42, lng: 75.74, knownFor: ["coffee estates", "Talakaveri (Kaveri source)", "Kodava culture", "hill stations"] },
  { name: "Hassan", slug: "hassan", hq: "Hassan", lat: 13.0, lng: 76.1, knownFor: ["Hoysala temples (Belur, Halebidu)", "Shravanabelagola (Gomateshwara)"] },
  { name: "Dakshina Kannada", slug: "dakshina-kannada", hq: "Mangaluru", lat: 12.87, lng: 74.88, knownFor: ["Mangaluru port", "beaches", "cradle of Indian banking", "Kudroli temple"] },
  { name: "Udupi", slug: "udupi", hq: "Udupi", lat: 13.34, lng: 74.75, knownFor: ["Krishna Temple", "Udupi cuisine", "Malpe beach", "St Mary's Island"] },
  { name: "Chikkamagaluru", slug: "chikkamagaluru", hq: "Chikkamagaluru", lat: 13.32, lng: 75.77, knownFor: ["birthplace of Indian coffee (Baba Budangiri)", "Mullayanagiri (highest peak)", "Kemmanagundi"] },
  { name: "Shivamogga", slug: "shivamogga", hq: "Shivamogga", lat: 13.93, lng: 75.57, knownFor: ["Jog Falls", "gateway to Malnad", "Sakrebailu elephant camp", "areca nut"] },
  { name: "Davanagere", slug: "davanagere", hq: "Davanagere", lat: 14.47, lng: 75.92, knownFor: ["benne dosa", "Manchester of Karnataka (cotton)"] },
  { name: "Chitradurga", slug: "chitradurga", hq: "Chitradurga", lat: 14.23, lng: 76.4, knownFor: ["Chitradurga stone fort", "windmills", "Onake Obavva"] },
  { name: "Haveri", slug: "haveri", hq: "Haveri", lat: 14.79, lng: 75.4, knownFor: ["cardamom", "Bankapura peacock sanctuary", "Galaganatha temple"] },
  { name: "Uttara Kannada", slug: "uttara-kannada", hq: "Karwar", lat: 14.8, lng: 74.13, knownFor: ["Jog Falls", "Karwar & Gokarna beaches", "Western Ghats", "Kali river"] },
  { name: "Dharwad", slug: "dharwad", hq: "Dharwad", lat: 15.46, lng: 75.01, knownFor: ["Dharwad pedha", "Karnataka University", "Hindustani music"] },
  { name: "Gadag", slug: "gadag", hq: "Gadag", lat: 15.43, lng: 75.63, knownFor: ["Veeranarayana temple", "Kappatagudda hills", "handloom"] },
  { name: "Ballari", slug: "ballari", hq: "Ballari", lat: 15.14, lng: 76.92, knownFor: ["Hampi (UNESCO, Vijayanagara)", "iron ore mining", "Tungabhadra"] },
  { name: "Vijayanagara", slug: "vijayanagara", hq: "Hosapete", lat: 15.27, lng: 76.39, knownFor: ["Hampi-Vijayanagara empire", "Tungabhadra Dam", "Hosapete"] },
  { name: "Koppal", slug: "koppal", hq: "Koppal", lat: 15.35, lng: 76.15, knownFor: ["Anegundi", "Gavi Math", "gateway to Hampi"] },
  { name: "Raichur", slug: "raichur", hq: "Raichur", lat: 16.21, lng: 77.36, knownFor: ["Raichur Fort", "Hutti gold mines", "Krishna-Tungabhadra doab"] },
  { name: "Bagalkote", slug: "bagalkote", hq: "Bagalkote", lat: 16.18, lng: 75.7, knownFor: ["Badami, Aihole & Pattadakal (UNESCO)", "Chalukya temple architecture"] },
  { name: "Vijayapura", slug: "vijayapura", hq: "Vijayapura", lat: 16.83, lng: 75.71, knownFor: ["Gol Gumbaz", "Ibrahim Rauza", "Adil Shahi architecture"] },
  { name: "Belagavi", slug: "belagavi", hq: "Belagavi", lat: 15.85, lng: 74.5, knownFor: ["Suvarna Vidhana Soudha", "Gokak Falls", "Kittur", "sugar belt"] },
  { name: "Kalaburagi", slug: "kalaburagi", hq: "Kalaburagi", lat: 17.33, lng: 76.83, knownFor: ["Gulbarga Fort", "Sharana Basaveshwara temple", "toor dal (red gram)"] },
  { name: "Yadgir", slug: "yadgir", hq: "Yadgir", lat: 16.77, lng: 77.14, knownFor: ["Shorapur", "granite", "Krishna river"] },
  { name: "Bidar", slug: "bidar", hq: "Bidar", lat: 17.91, lng: 77.52, knownFor: ["Bidriware handicraft", "Bidar Fort", "Bahmani tombs"] },
];

const KN_DISTRICTS: SeedEntity[] = KN_DISTRICTS_RAW.filter(
  (d) => d.slug !== "bengaluru-urban" && d.slug !== "mysuru",
).map((d) => ({
  type: "DISTRICT" as EntityType,
  name: d.name,
  slug: d.slug,
  parentSlug: "karnataka",
  centroidLat: d.lat,
  centroidLng: d.lng,
  summary: `${d.name} district (headquarters: ${d.hq}) in Karnataka — famous for ${d.knownFor
    .slice(0, 3)
    .join(", ")}.`,
  district: { headquarter: d.hq, data: { knownFor: d.knownFor } },
}));
entities.push(...KN_DISTRICTS);

// ── More Karnataka rivers (Kaveri + Krishna are curated above) ──────────
const KN_RIVERS_RAW: Array<{
  name: string;
  slug: string;
  origin: string;
  mouth: string;
  length_km: number;
  lat: number;
  lng: number;
  summary: string;
}> = [
  { name: "Tungabhadra", slug: "tungabhadra", origin: "Koodli (Tunga + Bhadra confluence)", mouth: "Joins the Krishna", length_km: 531, lat: 15.27, lng: 76.33, summary: "Formed by the union of the Tunga and Bhadra at Koodli, the Tungabhadra feeds its great dam at Hosapete and flows past Hampi." },
  { name: "Sharavathi", slug: "sharavathi", origin: "Ambutirtha, Shivamogga", mouth: "Arabian Sea at Honnavar", length_km: 128, lat: 14.23, lng: 74.81, summary: "A west-flowing river famous for Jog Falls, one of India's highest waterfalls." },
  { name: "Kali", slug: "kali-river", origin: "Western Ghats, Uttara Kannada", mouth: "Arabian Sea at Karwar", length_km: 184, lat: 15.0, lng: 74.5, summary: "Powers the Supa and Kadra dams through dense Uttara Kannada forests before meeting the sea at Karwar." },
  { name: "Netravati", slug: "netravati", origin: "Bangrabalige valley, Western Ghats", mouth: "Arabian Sea at Mangaluru", length_km: 103, lat: 12.89, lng: 75.2, summary: "Flows past Dharmasthala and is the lifeline of Mangaluru's water supply." },
  { name: "Kabini", slug: "kabini", origin: "Wayanad, Kerala", mouth: "Joins the Kaveri at T. Narasipura", length_km: 230, lat: 12.0, lng: 76.3, summary: "A Kaveri tributary whose Nagarhole backwaters are among India's finest wildlife habitats." },
  { name: "Bhadra", slug: "bhadra", origin: "Gangamoola, Kudremukh", mouth: "Joins the Tunga at Koodli", length_km: 178, lat: 13.7, lng: 75.62, summary: "Rises in the Kudremukh hills and feeds the Bhadra Wildlife Sanctuary before forming the Tungabhadra." },
  { name: "Malaprabha", slug: "malaprabha", origin: "Kanakumbi, Western Ghats", mouth: "Joins the Krishna", length_km: 304, lat: 15.9, lng: 75.3, summary: "A Krishna tributary impounded by the Navilu Tirtha (Renuka Sagara) dam." },
  { name: "Ghataprabha", slug: "ghataprabha", origin: "Western Ghats, Maharashtra", mouth: "Joins the Krishna", length_km: 283, lat: 16.2, lng: 75.1, summary: "Famous for the Gokak Falls and the Hidkal dam." },
  { name: "Hemavati", slug: "hemavati", origin: "Ballarayanadurga, Western Ghats", mouth: "Joins the Kaveri", length_km: 245, lat: 12.9, lng: 76.1, summary: "A major Kaveri tributary feeding the Hemavathi reservoir at Gorur." },
];

const KN_RIVERS: SeedEntity[] = KN_RIVERS_RAW.map((r) => ({
  type: "RIVER" as EntityType,
  name: r.name,
  slug: r.slug,
  centroidLat: r.lat,
  centroidLng: r.lng,
  summary: r.summary,
  metadata: { origin: r.origin, mouth: r.mouth, length_km: r.length_km, state: "Karnataka" },
}));
entities.push(...KN_RIVERS);

// ── Karnataka places: wildlife/nature + heritage/landmarks ──────────────
// Linked to Karnataka via LOCATED_IN so they appear in dedicated sections and
// in search (no map markers yet, per current scope).
const KN_PLACES_RAW: Array<{
  name: string;
  slug: string;
  type: EntityType;
  lat: number;
  lng: number;
  summary: string;
}> = [
  // Wildlife & Nature
  { name: "Bandipur National Park", slug: "bandipur-national-park", type: "NATIONAL_PARK", lat: 11.67, lng: 76.63, summary: "A flagship Project Tiger reserve in Chamarajanagar at the tri-junction of Karnataka, Tamil Nadu and Kerala; rich in tigers, elephants and gaur." },
  { name: "Nagarhole National Park", slug: "nagarhole-national-park", type: "NATIONAL_PARK", lat: 12.02, lng: 76.13, summary: "Also called Rajiv Gandhi NP, a tiger reserve along the Kabini backwaters famed for big cats, elephant herds and birdlife." },
  { name: "Bannerghatta National Park", slug: "bannerghatta-national-park", type: "NATIONAL_PARK", lat: 12.8, lng: 77.58, summary: "On Bengaluru's edge, combining a national park, biological reserve, safari and zoo — known for its butterfly park and bears." },
  { name: "Kudremukh National Park", slug: "kudremukh-national-park", type: "NATIONAL_PARK", lat: 13.22, lng: 75.25, summary: "Rolling shola-grassland hills in the Western Ghats (Chikkamagaluru); a biodiversity hotspot and source of the Tunga, Bhadra and Netravati." },
  { name: "Bhadra Tiger Reserve", slug: "bhadra-tiger-reserve", type: "TIGER_RESERVE", lat: 13.7, lng: 75.6, summary: "A tiger reserve and wildlife sanctuary around the Bhadra reservoir, noted for a successful village-relocation conservation model." },
  { name: "Kali Tiger Reserve", slug: "kali-tiger-reserve", type: "TIGER_RESERVE", lat: 15.0, lng: 74.4, summary: "Formerly Dandeli-Anshi, a dense Uttara Kannada reserve on the Kali river known for hornbills, black panthers and river rafting." },
  { name: "BRT Tiger Reserve", slug: "brt-tiger-reserve", type: "TIGER_RESERVE", lat: 11.98, lng: 77.13, summary: "Biligiri Rangaswamy Temple hills — a unique ecological bridge between the Western and Eastern Ghats, home to the Soliga tribe." },
  { name: "Ranganathittu Bird Sanctuary", slug: "ranganathittu-bird-sanctuary", type: "WILDLIFE_SANCTUARY", lat: 12.42, lng: 76.66, summary: "Karnataka's largest bird sanctuary on Kaveri islets near Srirangapatna; a haven for painted storks, pelicans and mugger crocodiles." },
  { name: "Daroji Sloth Bear Sanctuary", slug: "daroji-sloth-bear-sanctuary", type: "WILDLIFE_SANCTUARY", lat: 15.2, lng: 76.6, summary: "A boulder-strewn sanctuary near Hampi (Ballari) created specially to protect the Indian sloth bear." },
  { name: "Nilgiri Biosphere Reserve", slug: "nilgiri-biosphere-reserve", type: "BIOSPHERE_RESERVE", lat: 11.6, lng: 76.5, summary: "India's first biosphere reserve, spanning parts of southern Karnataka, Kerala and Tamil Nadu in the Western Ghats." },

  // Heritage & Landmarks
  { name: "Hampi", slug: "hampi", type: "UNESCO_SITE", lat: 15.34, lng: 76.46, summary: "UNESCO World Heritage capital of the Vijayanagara Empire — temples, the Stone Chariot and Virupaksha temple amid surreal boulders." },
  { name: "Pattadakal", slug: "pattadakal", type: "UNESCO_SITE", lat: 15.95, lng: 75.82, summary: "UNESCO group of 8th-century Chalukya temples in Bagalkote, blending northern (Nagara) and southern (Dravida) styles." },
  { name: "Sacred Ensembles of the Hoysalas", slug: "hoysala-temples", type: "UNESCO_SITE", lat: 13.16, lng: 75.86, summary: "Belur, Halebidu and Somanathapura — intricately carved 12th–13th-century Hoysala temples, inscribed by UNESCO in 2023." },
  { name: "Mysore Palace", slug: "mysore-palace", type: "LANDMARK", lat: 12.305, lng: 76.655, summary: "The opulent Indo-Saracenic seat of the Wodeyars and centrepiece of Dasara; among India's most-visited monuments." },
  { name: "Gol Gumbaz", slug: "gol-gumbaz", type: "LANDMARK", lat: 16.83, lng: 75.74, summary: "The mausoleum of Mohammed Adil Shah in Vijayapura — one of the world's largest domes with a famed whispering gallery." },
  { name: "Jog Falls", slug: "jog-falls", type: "LANDMARK", lat: 14.23, lng: 74.81, summary: "Among India's tallest waterfalls (~253 m), where the Sharavathi plunges in four cascades in Shivamogga." },
  { name: "Mullayanagiri", slug: "mullayanagiri", type: "MOUNTAIN", lat: 13.39, lng: 75.72, summary: "Karnataka's highest peak (1,930 m) in the Baba Budangiri range of the Western Ghats." },
  { name: "Badami Cave Temples", slug: "badami-cave-temples", type: "LANDMARK", lat: 15.92, lng: 75.68, summary: "Rock-cut Chalukyan cave temples around an ancient reservoir — the capital from which the Chalukyas rose." },
  { name: "Krishnarajasagara Dam", slug: "krishnarajasagara-dam", type: "DAM", lat: 12.42, lng: 76.57, summary: "The KRS dam across the Kaveri near Mysuru, fronted by the illuminated Brindavan Gardens." },
];

const KN_PLACES: SeedEntity[] = KN_PLACES_RAW.map((p) => ({
  type: p.type,
  name: p.name,
  slug: p.slug,
  parentSlug: "karnataka",
  centroidLat: p.lat,
  centroidLng: p.lng,
  summary: p.summary,
}));
entities.push(...KN_PLACES);

export const relations: SeedRelation[] = [
  // States located in India
  { fromSlug: "karnataka", toSlug: "india", type: "LOCATED_IN" },
  { fromSlug: "maharashtra", toSlug: "india", type: "LOCATED_IN" },
  { fromSlug: "tamil-nadu", toSlug: "india", type: "LOCATED_IN" },

  // Districts located in Karnataka
  { fromSlug: "bengaluru-urban", toSlug: "karnataka", type: "LOCATED_IN" },
  { fromSlug: "mysuru", toSlug: "karnataka", type: "LOCATED_IN" },

  // Capitals
  { fromSlug: "bengaluru", toSlug: "karnataka", type: "CAPITAL_OF" },
  { fromSlug: "new-delhi", toSlug: "india", type: "CAPITAL_OF" },

  // Neighbouring states
  { fromSlug: "karnataka", toSlug: "maharashtra", type: "BORDERS" },
  { fromSlug: "karnataka", toSlug: "tamil-nadu", type: "BORDERS" },

  // Rivers flowing through states
  { fromSlug: "kaveri", toSlug: "karnataka", type: "FLOWS_THROUGH" },
  { fromSlug: "kaveri", toSlug: "tamil-nadu", type: "FLOWS_THROUGH" },
  { fromSlug: "krishna", toSlug: "karnataka", type: "FLOWS_THROUGH" },
  { fromSlug: "krishna", toSlug: "maharashtra", type: "FLOWS_THROUGH" },
];

// Wire every Indian state/UT to India in the knowledge graph.
relations.push(
  ...INDIA_ADMIN.map((s) => ({
    fromSlug: s.slug,
    toSlug: "india",
    type: "LOCATED_IN" as RelationType,
  })),
);

// Wire Karnataka districts and rivers into the knowledge graph.
relations.push(
  ...KN_DISTRICTS.map((d) => ({
    fromSlug: d.slug,
    toSlug: "karnataka",
    type: "LOCATED_IN" as RelationType,
  })),
  ...KN_RIVERS.map((r) => ({
    fromSlug: r.slug,
    toSlug: "karnataka",
    type: "FLOWS_THROUGH" as RelationType,
  })),
  ...KN_PLACES.map((p) => ({
    fromSlug: p.slug,
    toSlug: "karnataka",
    type: "LOCATED_IN" as RelationType,
  })),
);
