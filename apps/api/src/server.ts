import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { entityRoutes } from "./routes/entities.js";
import { geoRoutes } from "./routes/geo.js";
import { quizRoutes } from "./routes/quiz.js";
import { searchRoutes } from "./routes/search.js";
import { authRoutes } from "./routes/auth.js";

const app = Fastify({ logger: true });

// Any explicitly-allowed origins (comma-separated) from the environment.
const allowList = (process.env.WEB_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Decide if a browser Origin may call the API. We always allow localhost (dev)
// and any *.vercel.app deployment (prod + previews), plus anything explicitly
// listed in WEB_ORIGIN. This avoids silent CORS failures when WEB_ORIGIN is
// unset or misconfigured on the host.
function isAllowedOrigin(origin: string): boolean {
  if (allowList.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {
    /* malformed origin header — reject below */
  }
  return false;
}

await app.register(cors, {
  // No Origin header = same-origin/curl/server-to-server → allow.
  // Credentials must be allowed so the auth cookie is sent cross-site.
  origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)),
  credentials: true,
});

await app.register(cookie);
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
  cookie: { cookieName: "gv_token", signed: false },
});

app.get("/health", async () => ({ status: "ok", service: "geoverse-api" }));

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(entityRoutes, { prefix: "/api/entities" });
await app.register(geoRoutes, { prefix: "/api/geo" });
await app.register(quizRoutes, { prefix: "/api/quiz" });
await app.register(searchRoutes, { prefix: "/api/search" });

// Render/Railway/Fly inject PORT; fall back to API_PORT locally.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`GeoVerse API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
