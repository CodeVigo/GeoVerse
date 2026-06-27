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

await app.register(cors, {
  // Credentials must be allowed so the auth cookie is sent cross-port (3000 → 4000).
  origin: process.env.WEB_ORIGIN?.split(",") ?? true,
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
