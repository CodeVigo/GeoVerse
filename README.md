# 🌍 GeoVerse

**The world's best interactive geography learning platform** — an immersive 3D globe, detailed India & Karnataka maps, geography games, spaced-repetition learning, and an explorer for Geographical Indication (GI) tags. Built for both curiosity-driven explorers and competitive-exam aspirants.

> Not a Wikipedia clone, not just a map viewer, not just another quiz site — GeoVerse blends exploration, active recall, gamification and exam prep into one place.

---

## Table of contents

- [Features](#-features)
- [Tech stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick start](#-quick-start)
- [Detailed local setup](#-detailed-local-setup)
- [Environment variables](#-environment-variables)
- [Available scripts](#-available-scripts)
- [Project structure](#-project-structure)
- [Data & content sources](#-data--content-sources)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)

---

## ✨ Features

**Explore**
- **3D globe** (CesiumJS) with satellite / Bing aerial / street layers, 3D terrain (with a Cesium Ion token), curated world-famous landmarks, and **click-any-country to open its page**.
- **India & Karnataka 3D region maps** — clean state/district borders, zoom-reveal labels, highlighted rivers (e.g. Kaveri), physical/topographic layers, and fullscreen mode.
- **Entity pages** for countries, states, districts, rivers, monuments, UNESCO sites and more, each with stats, facts, related places, and (for India) GI tags.
- **3D Solar System** orrery (Three.js / react-three-fiber) showing planets at their current orbital positions.

**Learn & play**
- **9 games**: Flag Finder, World Capitals, India State Capitals, World GK, Karnataka GK, Daily Challenge, Guess the Landmark, Locate on the Globe, and Map Puzzle (India).
- **Adaptive quizzes** with effectively unlimited, procedurally-generated questions; wrong answers resurface within a session.
- **Spaced repetition (SM-2)**, XP, and daily streaks tied to a user account.
- **Guided Learning Paths** — curated, step-by-step journeys with progress tracking.
- **Explore / Exam modes** — Exam mode prioritises high-importance, exam-tagged facts.

**Reference**
- **GI Tags Explorer** — India's full 600+ register (parsed from Wikipedia) plus a worldwide tab (live from Wikidata), with photos, search and filters.
- **Global search** (⌘K) across places and Karnataka districts.

---

## 🧱 Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Web      | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS |
| 3D / Maps| CesiumJS + Resium · Three.js + react-three-fiber · GSAP |
| API      | Node.js · Fastify 5 · TypeScript |
| Data     | Prisma ORM · PostgreSQL 16 + PostGIS |
| Auth     | JWT (httpOnly cookie) · bcryptjs |
| Tooling  | pnpm workspaces (monorepo) · tsx |

---

## 🏗 Architecture

GeoVerse is a **pnpm-workspace monorepo** with two apps and two shared packages:

```
apps/
  web/      Next.js front-end (globe, maps, games, pages)
  api/      Fastify REST API (entities, geo, quiz, search, auth)
packages/
  db/       Prisma schema, client, and the data seed
  shared/   Types & constants shared between web and api
```

Data flows: **web** → calls **api** (`NEXT_PUBLIC_API_URL`) → **api** reads/writes **PostgreSQL/PostGIS** via **Prisma**. Some reference data (GI tags, Wikipedia thumbnails) is fetched **client-side** in the browser to bypass restricted networks.

---

## ✅ Prerequisites

- **Node.js ≥ 20** ([nodejs.org](https://nodejs.org))
- **pnpm 9** — `corepack enable` (ships with Node), or `npm i -g pnpm`
- **PostgreSQL 16 with the PostGIS extension** — via **Docker** (easiest) or a local install
- *(optional)* A free **Cesium Ion** token ([cesium.com/ion](https://cesium.com/ion)) for 3D terrain + Bing imagery

---

## 🚀 Quick start

```bash
# 1. Install dependencies (from the repo root)
pnpm install

# 2. Create your env file
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 3. Start a Postgres+PostGIS database (Docker option)
docker compose up -d        # or: pnpm infra:up

# 4. Create the schema and load all geography data
pnpm db:push
pnpm db:seed

# 5. Run web + api together
pnpm dev
```

- Web: **http://localhost:3000**
- API: **http://localhost:4000** (health check at `/health`)

---

## 🔧 Detailed local setup

### 1. Install dependencies

From the repo root:

```bash
pnpm install
```

This installs every workspace (`web`, `api`, `db`, `shared`) in one go.

### 2. Configure environment

Copy `.env.example` to `.env` and adjust if needed. The defaults work for local development. See [Environment variables](#-environment-variables) below.

### 3. Start the database

**Option A — Docker (recommended).** Spins up PostgreSQL 16 + PostGIS (and Redis) preconfigured:

```bash
docker compose up -d      # alias: pnpm infra:up
# stop later with: docker compose down  (alias: pnpm infra:down)
```

The Docker DB uses user/password/db = `geoverse`. If you use it, set in `.env`:

```
DATABASE_URL="postgresql://geoverse:geoverse@localhost:5432/geoverse?schema=public"
```

**Option B — local / portable Postgres.** If you already have a local Postgres data dir under `.tools/pgdata` (used during development on this machine), helper scripts are provided:

```bash
pnpm db:start    # start the local server on port 5432
pnpm db:status   # check it's running
pnpm db:stop     # stop it
```

Then use a `DATABASE_URL` that matches your local role, e.g.:

```
DATABASE_URL="postgresql://postgres@localhost:5432/geoverse?schema=public"
```

> **PostGIS is required.** The Docker image includes it. On a manual install, enable it once: `CREATE EXTENSION IF NOT EXISTS postgis;`

### 4. Create schema + seed data

```bash
pnpm db:push     # pushes the Prisma schema (creates all tables)
pnpm db:seed     # loads countries, India states/districts, rivers, landmarks, facts…
```

Re-running the seed is safe — it upserts by slug. To inspect data visually: `pnpm --filter @geoverse/db studio`.

### 5. Run the apps

```bash
pnpm dev          # runs web (3000) + api (4000) in parallel
# or individually:
pnpm dev:web
pnpm dev:api
```

---

## 🔑 Environment variables

All variables live in a single root `.env` (loaded by both apps in dev).

| Variable | Used by | Description |
| -------- | ------- | ----------- |
| `DATABASE_URL` | api / db | Postgres connection string (must allow PostGIS). |
| `API_PORT` | api | API port (default `4000`). On cloud hosts, `PORT` is used automatically. |
| `API_HOST` | api | Bind host (default `0.0.0.0`). |
| `WEB_ORIGIN` | api | Comma-separated allowed CORS origins (e.g. `http://localhost:3000`). |
| `JWT_SECRET` | api | Secret for signing auth cookies — **use a long random string in production**. |
| `NEXT_PUBLIC_API_URL` | web | Base URL of the API (e.g. `http://localhost:4000`). |
| `NEXT_PUBLIC_SITE_URL` | web | Public site URL (used for metadata). |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | web | *(optional)* Enables 3D terrain + Bing imagery. |
| `REDIS_URL` | (future) | Redis connection (reserved for caching/jobs). |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | (future) | Reserved for an optional AI tutor. |

> `NEXT_PUBLIC_*` values are exposed to the browser by design — never put secrets there.

---

## 📜 Available scripts

Run from the repo root:

| Script | What it does |
| ------ | ------------ |
| `pnpm dev` | Run web + api in parallel |
| `pnpm dev:web` / `pnpm dev:api` | Run a single app |
| `pnpm build` | Build all packages |
| `pnpm lint` | Type-check all packages |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:push` | Push the schema to the database |
| `pnpm db:migrate` | Create/run a dev migration |
| `pnpm db:seed` | Seed all geography data |
| `pnpm infra:up` / `pnpm infra:down` | Start/stop Docker Postgres + Redis |
| `pnpm db:start` / `pnpm db:stop` / `pnpm db:status` | Control the portable local Postgres |

---

## 🗂 Project structure

```
GeoVerse/
├─ apps/
│  ├─ web/                     # Next.js front-end
│  │  ├─ public/geo/           # GeoJSON: countries, india, india-states, karnataka rivers
│  │  ├─ scripts/copy-cesium.mjs   # copies Cesium assets at build time
│  │  └─ src/
│  │     ├─ app/               # routes: /, /[slug], /india, /karnataka, /games/*, /gi, /paths/*, /solar-system, /learn, /login
│  │     ├─ components/        # GlobeView, RegionGlobe3D, QuizGame, GiExplorer, PathView, TopBar, …
│  │     └─ lib/               # api client, boundaries, paths, gi, wikidata helpers
│  └─ api/
│     └─ src/
│        ├─ server.ts          # Fastify bootstrap (CORS, cookies, JWT)
│        └─ routes/            # entities, geo, quiz, search, auth
├─ packages/
│  ├─ db/                      # prisma/schema.prisma, prisma/seed.ts, client
│  └─ shared/                  # shared types & constants (e.g. reserved slugs)
├─ docker-compose.yml          # local Postgres+PostGIS + Redis
├─ render.yaml                 # Render blueprint for the API
├─ DEPLOY.md                   # step-by-step free hosting guide
└─ README.md
```

**Data model (Prisma):** `Entity`, `EntityRelation`, `Fact`, `MemoryTrick`, `Pyq`, `CountryProfile`, `StateProfile`, `DistrictProfile`, `User`, `SrsCard`, `QuizAttempt`.

---

## 🌐 Data & content sources

- **Boundaries:** Natural Earth (countries), state/district GeoJSON for India, Karnataka rivers — all in `apps/web/public/geo`.
- **Country facts:** `mledoze/countries` and `samayo/country-json` datasets (baked into the seed).
- **Flags:** `flagcdn.com`. **Landmark photos:** Wikipedia REST API (lazy-loaded).
- **GI tags:** India — parsed from the Wikipedia "List of geographical indications in India"; World — live from the Wikidata SPARQL endpoint.
- **Imagery:** ESRI World Imagery, CARTO, and (with a token) Bing Aerial + 3D terrain via Cesium Ion.

---

## ☁️ Deployment

GeoVerse deploys for **free**: **Supabase** (Postgres+PostGIS) + **Render** (API) + **Vercel** (web). A one-click Render blueprint is in [`render.yaml`](./render.yaml).

👉 Full click-by-click instructions are in **[DEPLOY.md](./DEPLOY.md)**.

---

## 🛠 Troubleshooting

- **`Can't reach database server`** — make sure Postgres is running (`docker compose ps` or `pnpm db:status`) and `DATABASE_URL` matches its user/password/port.
- **`type "geometry" does not exist` / PostGIS errors** — enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;` (the Docker image already has it).
- **Port already in use (3000/4000)** — stop the other process, or change `API_PORT` / the web `-p` flag.
- **Globe looks blurry or has no terrain** — add a free `NEXT_PUBLIC_CESIUM_ION_TOKEN`; without it, terrain/Bing are disabled but the globe still works.
- **GI "World" tab empty / slow** — it queries Wikidata live; some corporate networks throttle it. Try another country or reload.
- **Prisma client out of date** — run `pnpm db:generate`.

---

## 🧭 Roadmap

Done recently: clickable countries on the globe, India border fix, GI photos + worldwide tab, Map Puzzle, Learning Paths, mobile nav.

Next up (ideas):
- Revision dashboard to review **due** spaced-repetition cards.
- GI-based quiz and deeper exam content (PYQs, memory tricks).
- Knowledge-graph visualisation and an optional AI tutor.
- Deeper India district content.

---

Built with curiosity. Contributions and ideas welcome.
