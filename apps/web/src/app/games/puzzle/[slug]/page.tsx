import { notFound } from "next/navigation";
import { MapPuzzle } from "@/components/MapPuzzle";
import { PUZZLES, getPuzzle } from "@/lib/puzzles";

export function generateStaticParams() {
  return PUZZLES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getPuzzle(slug);
  return { title: def ? `${def.title} Puzzle · GeoVerse` : "Map Puzzle · GeoVerse" };
}

export default async function PuzzlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getPuzzle(slug);
  if (!def) notFound();

  return (
    <MapPuzzle
      title={def.title}
      noun={def.noun}
      src={def.src}
      nameKeys={def.nameKeys}
      filterKey={def.filterKey}
      filterValue={def.filterValue}
      exclude={def.exclude}
      facts={def.facts}
      progressId={def.slug}
    />
  );
}
