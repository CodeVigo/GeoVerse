import type { MetadataRoute } from "next";
import { getGlobePoints } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let entityUrls: MetadataRoute.Sitemap = [];
  try {
    const points = await getGlobePoints();
    entityUrls = points.map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // API not reachable at build time — ship the static routes only.
  }

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...entityUrls,
  ];
}
