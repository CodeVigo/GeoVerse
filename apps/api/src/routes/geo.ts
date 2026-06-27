import type { FastifyInstance } from "fastify";
import { prisma } from "@geoverse/db";

export async function geoRoutes(app: FastifyInstance) {
  // Points to render as interactive markers on the 3D globe.
  // Optionally filter by ?type=COUNTRY etc.
  app.get<{ Querystring: { type?: string; featured?: string } }>("/points", async (req) => {
    const { type, featured } = req.query;
    const items = await prisma.entity.findMany({
      where: {
        centroidLat: { not: null },
        centroidLng: { not: null },
        // Continents are layout anchors, not clickable destinations.
        ...(type ? { type: type as never } : { type: { not: "CONTINENT" } }),
        // Only the curated world-famous landmarks (metadata.featured === true).
        ...(featured === "true"
          ? { metadata: { path: ["featured"], equals: true } }
          : {}),
      },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        summary: true,
        centroidLat: true,
        centroidLng: true,
        metadata: true,
      },
    });

    return items.map((e) => {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      return {
        id: e.id,
        type: e.type,
        name: e.name,
        slug: e.slug,
        lat: e.centroidLat,
        lng: e.centroidLng,
        summary: e.summary,
        wiki: (meta.wiki as string) ?? e.name,
        country: (meta.country as string) ?? null,
        category: (meta.category as string) ?? null,
      };
    });
  });
}
