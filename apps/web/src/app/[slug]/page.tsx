import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RESERVED_SLUGS } from "@geoverse/shared";
import { getEntity } from "@/lib/api";
import { EntityDetailView } from "@/components/EntityDetailView";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (RESERVED_SLUGS.has(params.slug)) return {};
  const entity = await getEntity(params.slug);
  if (!entity) return { title: "Not found" };
  const title = `${entity.name}`;
  const description =
    entity.summary ?? `Explore ${entity.name} on GeoVerse — facts, maps, and exam-ready notes.`;
  return {
    title,
    description,
    openGraph: { title: `${title} · GeoVerse`, description },
    alternates: { canonical: `/${entity.slug}` },
  };
}

export default async function EntityPage({ params }: Props) {
  if (RESERVED_SLUGS.has(params.slug)) notFound();

  const entity = await getEntity(params.slug);
  if (!entity) notFound();

  // JSON-LD structured data for richer Google results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: entity.name,
    description: entity.summary ?? undefined,
    ...(entity.centroidLat != null && entity.centroidLng != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: entity.centroidLat,
            longitude: entity.centroidLng,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EntityDetailView entity={entity} />
    </>
  );
}
