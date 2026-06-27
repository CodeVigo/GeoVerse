import type { FastifyInstance } from "fastify";
import { prisma } from "@geoverse/db";

// Serialize BigInt (population fields) safely to JSON.
function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? Number(v) : v)),
  );
}

export async function entityRoutes(app: FastifyInstance) {
  // List entities, optionally filtered by ?type= and ?parent= (slug).
  app.get<{ Querystring: { type?: string; parent?: string; limit?: string } }>(
    "/",
    async (req) => {
      const { type, parent, limit } = req.query;
      const parentEntity = parent
        ? await prisma.entity.findUnique({ where: { slug: parent }, select: { id: true } })
        : null;

      const items = await prisma.entity.findMany({
        where: {
          ...(type ? { type: type as never } : {}),
          ...(parentEntity ? { parentId: parentEntity.id } : {}),
        },
        take: limit ? Number(limit) : 200,
        orderBy: { name: "asc" },
        select: {
          id: true,
          type: true,
          name: true,
          slug: true,
          summary: true,
          centroidLat: true,
          centroidLng: true,
        },
      });
      return jsonSafe(items);
    },
  );

  // Full detail for one entity (by slug): profile + facts + tricks + graph neighbors.
  app.get<{ Params: { slug: string } }>("/:slug", async (req, reply) => {
    const { slug } = req.params;
    const entity = await prisma.entity.findUnique({
      where: { slug },
      include: {
        facts: { orderBy: [{ importance: "desc" }, { tier: "asc" }] },
        memoryTricks: true,
        pyqs: true,
        countryProfile: true,
        stateProfile: true,
        districtProfile: true,
        outgoing: { include: { to: true } },
        incoming: { include: { from: true } },
      },
    });

    if (!entity) return reply.code(404).send({ error: "Entity not found" });

    const related = [
      ...entity.outgoing.map((r) => ({
        relation: r.type,
        direction: "outgoing" as const,
        id: r.to.id,
        type: r.to.type,
        name: r.to.name,
        slug: r.to.slug,
        summary: r.to.summary,
        centroidLat: r.to.centroidLat,
        centroidLng: r.to.centroidLng,
      })),
      ...entity.incoming.map((r) => ({
        relation: r.type,
        direction: "incoming" as const,
        id: r.from.id,
        type: r.from.type,
        name: r.from.name,
        slug: r.from.slug,
        summary: r.from.summary,
        centroidLat: r.from.centroidLat,
        centroidLng: r.from.centroidLng,
      })),
    ];

    const profile =
      entity.countryProfile ?? entity.stateProfile ?? entity.districtProfile ?? null;

    return jsonSafe({
      id: entity.id,
      type: entity.type,
      name: entity.name,
      slug: entity.slug,
      summary: entity.summary,
      centroidLat: entity.centroidLat,
      centroidLng: entity.centroidLng,
      metadata: entity.metadata,
      profile,
      facts: entity.facts,
      memoryTricks: entity.memoryTricks,
      pyqs: entity.pyqs,
      related,
    });
  });
}
