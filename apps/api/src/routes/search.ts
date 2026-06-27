import type { FastifyInstance } from "fastify";
import { prisma } from "@geoverse/db";

export async function searchRoutes(app: FastifyInstance) {
  // GET /api/search?q=ind  → fuzzy-ish name search across all entities.
  app.get<{ Querystring: { q?: string; limit?: string } }>("/", async (req) => {
    const q = (req.query.q ?? "").trim();
    if (q.length < 1) return [];
    const limit = Math.min(Number(req.query.limit ?? 12), 25);

    const items = await prisma.entity.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: limit * 2,
      select: {
        name: true,
        slug: true,
        type: true,
        summary: true,
        countryProfile: { select: { flagEmoji: true } },
      },
    });

    const lower = q.toLowerCase();
    // Rank: exact > starts-with > contains; then shorter names first.
    const ranked = items
      .map((e) => {
        const n = e.name.toLowerCase();
        const rank = n === lower ? 0 : n.startsWith(lower) ? 1 : 2;
        return { e, rank };
      })
      .sort((a, b) => a.rank - b.rank || a.e.name.length - b.e.name.length)
      .slice(0, limit)
      .map(({ e }) => ({
        name: e.name,
        slug: e.slug,
        type: e.type,
        summary: e.summary,
        flag: e.countryProfile?.flagEmoji ?? null,
      }));

    return ranked;
  });
}
