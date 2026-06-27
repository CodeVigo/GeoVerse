# GeoVerse — Architecture & Roadmap Plan

> Working title: **GeoVerse** — the world's best interactive geography learning platform.
> This document is the agreed blueprint. No application code is built until this plan is approved.

---

## 1. Vision & Guiding Principles

GeoVerse teaches geography the way humans naturally remember things: through **exploration, curiosity, and discovery** rather than rote memorization. It blends the strengths of Google Earth, Duolingo, GeoGuessr, Seterra, interactive atlases, and GIS systems.

Every design decision is ranked by these priorities (in order):

1. Better learning outcomes
2. Better user experience
3. Visual understanding over text
4. Long-term maintainability
5. Scalability
6. Interactive discovery over passive reading
7. Accuracy from trusted data sources
8. Reusable, modular architecture for future expansion

**Two modes, one backend:**
- **Explore Mode** — free, immersive discovery on a 3D globe.
- **Exam Mode** — prioritized, exam-relevant knowledge (SSC, UPSC, Railway, Banking, State PSC, KPSC, CDS, NDA) with Must Know / Good to Know / Explore More / Memory Tricks / PYQs / Revision / Difficulty / Importance.

---

## 2. Locked Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript** | SSR/SSG for SEO-friendly profile pages (e.g. `/india`, `/karnataka`, `/bengaluru`) that rank on Google; client components for the interactive globe/games |
| Styling | Tailwind CSS + Radix UI primitives | Premium, accessible, fast to build |
| 3D Globe | **CesiumJS** (via Resium) | Realistic Earth, terrain, satellite, time-dynamic — true "Google Earth" feel |
| 2D Maps / layers | MapLibre GL JS (vector tiles) | Open-source, no vendor lock, layer-friendly |
| Animations | **GSAP** | Camera fly-tos, timeline animations (rivers/monsoon/empires), UI motion |
| State mgmt | Zustand + TanStack Query | Simple client state + server cache |
| Backend | Node.js + Fastify + TypeScript (**separate API**, not Next API routes) | Real backend for PostGIS, background jobs, caching, AI; reusable by future mobile/AR/classroom clients |
| SEO | Next.js SSR/SSG + per-page metadata, JSON-LD structured data, generated `sitemap.xml` + `robots.txt` | Country/state/district pages indexable and rankable on Google |
| ORM | Prisma (+ raw SQL for PostGIS) | Type-safe + escape hatch for spatial |
| Database | PostgreSQL 16 + PostGIS | Spatial queries, the project requirement |
| Cache / jobs | Redis + BullMQ | Caching + background sync jobs |
| AI | OpenAI API (abstracted behind an `AITutorService` interface) | Easy to swap providers later |
| Search | PostgreSQL FTS first → optional Meilisearch later | Start simple, scale when needed |
| Auth | Email + OAuth (Lucia/Auth.js), JWT sessions | Standard, flexible |
| Infra (dev) | Docker Compose (Postgres+PostGIS, Redis) | One-command local setup |

### Hosting — 100% Free Tier (no payment required)

> Hard constraint: **$0/month.** Built on Docker + standard Postgres/Redis so any future upgrade is a no-code-change migration.

| Part | Free host | Notes / free-tier catch |
|---|---|---|
| Code + CI/CD | **GitHub** + GitHub Actions | Auto-deploy on push; scheduled Actions run the data-sync "jobs" (replaces a paid 24/7 worker). |
| Next.js web (`vigo.com` / `*.vercel.app`) | **Vercel** (Hobby, free) | Non-commercial only; if monetized later move to **Cloudflare Pages** (free, commercial-OK) — no rewrite. |
| Fastify API | **Render** (free web service) | Sleeps after 15 min idle (~30s cold start); a free GitHub Action keep-alive ping mitigates. |
| PostgreSQL + PostGIS | **Supabase** (free, **Mumbai region**) | 500 MB; project pauses after 7 days idle (keep-alive ping prevents). PostGIS extension enabled. |
| Redis | **Upstash** (free) | ~500K commands/month, serverless. |
| Assets/textures | **Cloudflare R2** / GitHub | Free tier for globe textures & images. |

Background jobs run as **scheduled GitHub Actions** on free tier; flip to a real BullMQ worker when upgrading (no code change).

---

## 3. Repository Architecture (Monorepo)

```
geoverse/
├── docker-compose.yml          # Postgres+PostGIS, Redis
├── package.json                # pnpm workspaces
├── apps/
│   ├── web/                    # Next.js (App Router) frontend — SSR profile pages + client globe/games
│   └── api/                    # Fastify backend (PostGIS, jobs, AI)
├── packages/
│   ├── shared/                 # Shared TS types, zod schemas, constants
│   ├── db/                     # Prisma schema, migrations, seed scripts
│   └── ui/                     # Reusable component library (design system)
├── data/
│   ├── geo/                    # GeoJSON / boundary sources (versioned)
│   ├── content/                # Curated educational content (countries, states, quizzes, PYQs)
│   └── sync/                   # Sync job source configs
└── docs/                       # This plan + ADRs
```

Clear separation of concerns: **geographic data**, **educational content**, **user progress**, and **AI services** never bleed into each other.

---

## 4. Data Architecture

### 4.1 Four data domains

1. **Geographic data (PostGIS):** boundaries, points, lines — stable, versioned, stored locally.
2. **Educational content:** facts, Must-Know tiers, memory tricks, stories, PYQs — owned & curated by the platform (not scraped).
3. **User data:** accounts, progress, SRS schedules, XP, streaks, quiz history.
4. **AI services:** prompt templates, generated artifacts (cached), tutor sessions.

### 4.2 Core schema (high level)

**Geo / Entity tables**
- `entities` — the universal node (polymorphic): `id`, `type` (country/state/district/river/mountain/dam/park/landmark/etc.), `name`, `slug`, `parent_id`, `geom` (PostGIS), `centroid`, `metadata` (JSONB).
- `entity_relations` — the **knowledge graph** edges: `from_id`, `to_id`, `relation` (FLOWS_THROUGH, BORDERS, CAPITAL_OF, LOCATED_IN, TRIBUTARY_OF, NATIONAL_ANIMAL_OF, …), `metadata`.
- `boundaries_versions` — versioned geometry for historical borders / state-formation timelines.

**Content tables**
- `country_profiles`, `state_profiles`, `district_profiles` — structured fields (flag, capital, currency … the full lists in your spec) stored as typed columns + JSONB for the long tail.
- `facts` — atomic fact attached to an entity, tagged `tier` (must_know / good_to_know / explore_more), `importance` (1–5), `difficulty`, `exam_tags[]`.
- `memory_tricks`, `stories`, `pyqs` (with year, exam, answer, explanation).

**Learning / User tables**
- `users`, `user_progress`, `srs_cards` (entity/fact + interval, ease, due_at), `quiz_attempts`, `achievements`, `xp_events`, `streaks`, `daily_challenges`.

**AI tables**
- `ai_sessions`, `ai_messages`, `ai_generated_content` (cached, with provenance + review flag).

### 4.3 Knowledge Graph

The graph is **first-class**, modeled in Postgres (`entities` + `entity_relations`) rather than a separate graph DB to start — keeps one source of truth and lets us do recursive CTE traversals. Example: `Country → State → District → River → Dam → National Park → Animal → Mountain → UNESCO Site → Historical Event → Quiz`. This powers "click related objects to learn naturally" and the AI's contextual recommendations.

### 4.4 Data sources & sync

- Boundaries: **Natural Earth**, **GADM**, **OpenStreetMap** (rivers, ports, airports), India admin boundaries from **Survey of India / data.gov.in** open datasets.
- Stable geo data stored locally and versioned. **Never scrape page layouts.**
- `data/sync/` defines source configs; **BullMQ scheduled jobs** refresh changing structured info; every import is versioned and reviewable.
- Educational content (facts, tricks, PYQs) is **platform-managed**, curated, and human-reviewed (AI may draft, humans approve).

---

## 5. Backend / API Design

REST + a thin GraphQL-style aggregation endpoint where needed. Key route groups:

- `/api/entities/:id` — full profile + related graph neighbors
- `/api/geo/...` — boundary/feature GeoJSON for the globe & map layers (cached vector tiles where possible)
- `/api/search` — natural-language + structured search (see §8)
- `/api/quiz/...` — generate, submit, score, adaptive next-question
- `/api/learn/...` — SRS due cards, recommendations, progress
- `/api/games/...` — game sessions, scoring, XP/badges
- `/api/ai/...` — tutor chat, memory-trick generation, explain-wrong-answer
- `/api/layers/:layer` — map layer data (population, climate, rainfall, minerals, …)

Cross-cutting: caching (Redis), rate limiting, request validation (zod), versioned data responses.

---

## 6. Core Subsystems

| Subsystem | Description | Phase |
|---|---|---|
| **3D Globe** | CesiumJS: realistic Earth, atmosphere, terrain, satellite, night lights, country/region highlighting, GSAP fly-to camera, interactive labels | 1 |
| **Map Layers** | Toggleable political/physical/satellite/terrain + thematic (population, climate, rainfall, minerals, transport, wildlife, UNESCO, historical borders…) via MapLibre | 2–4 |
| **River Engine** | Animated source→mouth flow, course, states/districts crossed, tributaries, dams, basin, exam facts, river quizzes | 3 |
| **Animation Engine** | Reusable timeline-driven animations: flight/shipping/trade routes, migration, monsoon, currents, plate tectonics, empire expansion, state formation | 3–5 |
| **Knowledge Graph UI** | Click related objects; contextual "connected concepts" panel | 2 |
| **Quiz Engine** | 40+ quiz types, map puzzles, drag-drop, guess-by-shape/outline/image/satellite, adaptive, timed, daily/weekly/monthly, mock tests, PYQs | 2–4 |
| **Games** | Passport Journey, Treasure Hunt, River/Mountain Expedition, World Tour, Find-the-X, Speed Challenge, levels/badges/XP/streaks | 4 |
| **Learning System** | Active recall, spaced repetition (SM-2 style), weak-topic detection, adaptive paths, revision scheduling, progress tracking | 2–4 |
| **AI Tutor** | Explain concepts, generate memory tricks, recommend next topic, answer questions, highlight map objects, personalized quizzes, explain wrong answers, adjust difficulty | 3–5 |
| **Search** | Natural-language → structured spatial queries | 3 |

---

## 7. Explore vs Exam Mode

Both render the same entity, different lens:
- **Explore:** rich visuals, full profile, "interesting facts", free wandering, story panels.
- **Exam:** filtered to `tier` + `importance` + `exam_tags`, shows Must Know first, Memory Tricks, PYQs, Revision CTA, Difficulty/Importance badges. A single mode toggle changes content density platform-wide.

---

## 8. Natural-Language Search

Pipeline: query → AI parses intent into a **structured query spec** (entity types + spatial predicate + filters) → executed as PostGIS/SQL → results highlighted on globe/map.
Examples supported by design:
- "Countries crossed by the Equator" → `ST_Intersects(geom, equator_line)`
- "Districts the Krishna River flows through" → graph relation `FLOWS_THROUGH`
- "UNESCO sites in Rajasthan" → spatial containment + type filter
- "Countries bordering Russia" → `BORDERS` relation / `ST_Touches`

---

## 9. UI/UX Principles

Modern, premium, minimal, fast, responsive, accessible, **dark mode default**, smooth animations, interactive cards, floating context panels, beautiful typography, global search (⌘K), keyboard shortcuts, immersive map. Design system lives in `packages/ui`.

---

## 10. Roadmap (Phased)

### Phase 0 — Foundation (scaffold)
Monorepo, Docker Compose (Postgres+PostGIS+Redis), Prisma schema for `entities`/`entity_relations`/profiles/content/users, seed pipeline, design system skeleton, app shell with dark mode + ⌘K search bar.

### Phase 1 — Explore MVP (the "thin slice of both")
- Beautiful 3D globe with rotation, zoom, atmosphere, country highlighting, fly-to.
- Clickable countries → context panel with full profile.
- **~8–10 fully detailed countries** + **~5 fully detailed Indian states** (with a couple of districts) to prove the data model end-to-end.
- Knowledge-graph "related" links working.
- Explore/Exam mode toggle.

### Phase 2 — Learning & Quiz core
Quiz engine (start with flag/capital/country-ID/map-puzzle/guess-by-shape), SRS, progress tracking, XP/streaks, daily challenge.

### Phase 3 — Maps, Rivers, Search, AI
MapLibre thematic layers, River Engine + animation engine, natural-language search, AI Tutor v1.

### Phase 4 — Games & breadth
Games suite, more quiz types, more layers, expand content coverage (more countries/states/districts).

### Phase 5 — Scale & polish
Mock tests, analytics, content tooling/admin, performance hardening, Meilisearch if needed.

### Future Expansion (architected for, not built now)
Mobile apps, Classroom/Teacher dashboard, Multiplayer, Community quiz creation, Offline packs, AR/VR, Localization, Voice learning, Advanced analytics.

---

## 11. MVP Definition (what "done" means for first build)

A user can:
1. Load a premium 3D globe and explore smoothly.
2. Click a country/state and read a rich, accurate profile.
3. See connected entities and click through the knowledge graph.
4. Toggle Explore/Exam mode and see content adapt.
5. Take a basic quiz on the seeded content.

All backed by the real Postgres/PostGIS schema and seed pipeline — so every later phase is additive, not a rewrite.

---

## 12. Risks & Open Questions

- **Content accuracy & volume:** the full India/World content is vast and must be curated/reviewed. Plan: curate the thin slice by hand, then AI-draft + human-review at scale.
- **Globe asset quality:** premium Earth textures (night lights, clouds) — need to source licensed/free high-res textures.
- **Satellite/terrain layers** may later justify CesiumJS or commercial tiles — deferred decision.
- **OpenAI cost control:** cache generated artifacts, rate-limit, allow provider swap.

---

## 13. Approval Checklist (please confirm)

- [ ] Tech stack (§2) approved
- [ ] Monorepo layout (§3) approved
- [ ] Data model & knowledge-graph approach (§4) approved
- [ ] Phased roadmap (§10) and MVP scope (§11) approved
- [ ] Any must-have features to pull earlier?

Once approved, I'll begin **Phase 0 (scaffold)** and then **Phase 1 (Explore MVP)**.
