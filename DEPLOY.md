# Deploying GeoVerse for free

GeoVerse has three pieces. Each has a generous free tier:

| Piece              | Host     | Free tier |
| ------------------ | -------- | --------- |
| Database (Postgres + PostGIS) | **Supabase** | Yes |
| API (Fastify)      | **Render**   | Yes (sleeps when idle) |
| Web (Next.js)      | **Vercel**   | Yes |

> You'll need free accounts on GitHub, Supabase, Render, and Vercel. Push this
> repo to GitHub first — all three hosts deploy straight from a GitHub repo.

---

## 1. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com). Pick a strong DB password and save it.
2. In **SQL Editor**, enable PostGIS (GeoVerse uses geospatial queries):
   ```sql
   create extension if not exists postgis;
   ```
3. Go to **Project Settings → Database → Connection string → URI** and copy it.
   It looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   ```
   Add `?sslmode=require` to the end. This is your `DATABASE_URL`.

---

## 2. API — Render

The repo includes a [`render.yaml`](./render.yaml) blueprint, so this is mostly automatic.

1. At [render.com](https://render.com) → **New → Blueprint**, connect this GitHub repo.
2. Render reads `render.yaml` and creates the **geoverse-api** web service.
3. When prompted, fill in the env vars:
   - `DATABASE_URL` → the Supabase URI from step 1.
   - `WEB_ORIGIN` → leave blank for now (you'll set it after Vercel gives you a URL).
   - `JWT_SECRET` → leave it; Render auto-generates one.
4. Deploy. The build runs `prisma db push` to create all tables.
5. **Seed the data once** (first deploy only). In the Render service → **Shell**, run:
   ```bash
   pnpm --filter @geoverse/db seed:prod
   ```
   (No Shell on the free plan? Temporarily append ` && pnpm --filter @geoverse/db seed:prod`
   to `buildCommand` in `render.yaml`, deploy once, then remove it.)
6. Note your API URL, e.g. `https://geoverse-api.onrender.com`. Open
   `https://geoverse-api.onrender.com/health` — it should return `{"status":"ok"}`.

---

## 3. Web — Vercel

1. At [vercel.com](https://vercel.com) → **Add New → Project**, import this GitHub repo.
2. Set **Root Directory** to `apps/web`.
3. Framework preset: **Next.js** (auto-detected). Leave build/install commands default
   — Vercel detects the pnpm workspace and installs from the repo root.
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` → your Render API URL (e.g. `https://geoverse-api.onrender.com`).
   - `NEXT_PUBLIC_CESIUM_ION_TOKEN` → a free token from
     [cesium.com/ion](https://cesium.com/ion) (enables 3D terrain + Bing imagery).
5. Deploy. You'll get a URL like `https://geoverse.vercel.app`.

---

## 4. Connect web → API (CORS)

Back in **Render → geoverse-api → Environment**, set:

```
WEB_ORIGIN = https://geoverse.vercel.app
```

(Add your custom domain too, comma-separated, once you have one.) Save — Render redeploys.
That's it: open the Vercel URL and GeoVerse is live.

---

## Notes & gotchas

- **Render free tier sleeps** after ~15 min idle, so the first request after a pause
  takes ~30s to wake. Fine for a hobby project; upgrade for always-on.
- **Re-seeding** is safe to re-run — the seed upserts by slug.
- **Local dev** is unchanged: copy `.env.example` to `.env`, point `DATABASE_URL`
  at your local Postgres, then `pnpm dev`.
- **Custom domain** (e.g. you buy one later): add it in Vercel → Domains, then add
  the same origin to `WEB_ORIGIN` on Render.
