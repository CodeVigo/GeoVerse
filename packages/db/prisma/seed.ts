import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";
import { entities, relations, type SeedEntity, type SeedRelation } from "./data/seed-data.js";

const prisma = new PrismaClient();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Auto-generated countries (all 250) merged with hand-curated entities.
// Curated entries win on slug collisions (e.g. India keeps its rich content).
function loadAllSeedData(): { allEntities: SeedEntity[]; allRelations: SeedRelation[] } {
  let genEntities: SeedEntity[] = [];
  let genRelations: SeedRelation[] = [];
  try {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "data/countries.generated.json"), "utf8"),
    ) as { entities: SeedEntity[]; relations: SeedRelation[] };
    const curated = new Set(entities.map((e) => e.slug));
    genEntities = raw.entities.filter((e) => !curated.has(e.slug));
    // Convert population (plain number in JSON) to BigInt for Prisma.
    for (const e of genEntities) {
      const c = e.country as Record<string, unknown> | undefined;
      if (c && c.population != null) c.population = BigInt(c.population as number);
    }
    genRelations = raw.relations ?? [];
  } catch {
    console.warn("⚠️  countries.generated.json not found — seeding curated data only.");
  }
  return {
    allEntities: [...entities, ...genEntities],
    allRelations: [...relations, ...genRelations],
  };
}

async function main() {
  console.log("🌱 Seeding GeoVerse...");

  const { allEntities: entities, allRelations: relations } = loadAllSeedData();
  console.log(`   ${entities.length} entities, ${relations.length} relations to upsert.`);

  const slugToId = new Map<string, string>();

  // Pass 1: create/update all entities WITHOUT parent links (so order doesn't matter).
  for (const e of entities) {
    const entity = await prisma.entity.upsert({
      where: { slug: e.slug },
      update: {
        type: e.type,
        name: e.name,
        centroidLat: e.centroidLat ?? null,
        centroidLng: e.centroidLng ?? null,
        summary: e.summary ?? null,
        metadata: (e.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
      create: {
        type: e.type,
        name: e.name,
        slug: e.slug,
        centroidLat: e.centroidLat ?? null,
        centroidLng: e.centroidLng ?? null,
        summary: e.summary ?? null,
        metadata: (e.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    slugToId.set(e.slug, entity.id);
  }

  // Pass 2: parent links + profiles + content.
  for (const e of entities) {
    const id = slugToId.get(e.slug)!;

    if (e.parentSlug) {
      const parentId = slugToId.get(e.parentSlug);
      if (parentId) await prisma.entity.update({ where: { id }, data: { parentId } });
    }

    if (e.country) {
      const c = e.country as Record<string, any>;
      await prisma.countryProfile.upsert({
        where: { entityId: id },
        update: { ...c, entityId: id },
        create: { ...c, entityId: id },
      });
    }
    if (e.state) {
      const s = e.state as Record<string, any>;
      await prisma.stateProfile.upsert({
        where: { entityId: id },
        update: { ...s, entityId: id },
        create: { ...s, entityId: id },
      });
    }
    if (e.district) {
      const d = e.district as Record<string, any>;
      await prisma.districtProfile.upsert({
        where: { entityId: id },
        update: { ...d, entityId: id },
        create: { ...d, entityId: id },
      });
    }

    // Replace content for idempotent re-seeding.
    await prisma.fact.deleteMany({ where: { entityId: id } });
    if (e.facts?.length) {
      await prisma.fact.createMany({ data: e.facts.map((f) => ({ ...f, entityId: id })) });
    }

    await prisma.memoryTrick.deleteMany({ where: { entityId: id } });
    if (e.tricks?.length) {
      await prisma.memoryTrick.createMany({ data: e.tricks.map((t) => ({ ...t, entityId: id })) });
    }

    await prisma.pyq.deleteMany({ where: { entityId: id } });
    if (e.pyqs?.length) {
      await prisma.pyq.createMany({
        data: e.pyqs.map((p) => ({
          entityId: id,
          exam: p.exam,
          year: p.year ?? null,
          question: p.question,
          options: p.options as Prisma.InputJsonValue,
          answerIndex: p.answerIndex,
          explanation: p.explanation ?? null,
          difficulty: p.difficulty ?? 2,
        })),
      });
    }
  }

  // Relations (knowledge graph edges).
  for (const r of relations) {
    const fromId = slugToId.get(r.fromSlug);
    const toId = slugToId.get(r.toSlug);
    if (!fromId || !toId) {
      console.warn(`⚠️  Skipping relation ${r.fromSlug} -> ${r.toSlug} (missing entity)`);
      continue;
    }
    await prisma.entityRelation.upsert({
      where: { fromId_toId_type: { fromId, toId, type: r.type } },
      update: { metadata: (r.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull },
      create: {
        fromId,
        toId,
        type: r.type,
        metadata: (r.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  const [entityCount, relationCount] = await Promise.all([
    prisma.entity.count(),
    prisma.entityRelation.count(),
  ]);
  console.log(`✅ Seed complete: ${entityCount} entities, ${relationCount} relations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
