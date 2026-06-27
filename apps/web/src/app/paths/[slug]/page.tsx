import { notFound } from "next/navigation";
import { PathView } from "@/components/PathView";
import { getPath, PATHS } from "@/lib/paths";

export function generateStaticParams() {
  return PATHS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const path = getPath(params.slug);
  return { title: path ? `${path.title} · GeoVerse` : "Learning Path · GeoVerse" };
}

export default function PathPage({ params }: { params: { slug: string } }) {
  const path = getPath(params.slug);
  if (!path) notFound();
  return <PathView path={path} />;
}
