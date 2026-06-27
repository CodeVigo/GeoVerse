import Link from "next/link";
import { GiExplorer } from "@/components/GiExplorer";

export const metadata = {
  title: "GI Tags Explorer · GeoVerse",
  description: "Explore Geographical Indications (GI tags) from India and around the world.",
};

export default function GiExplorerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-6">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Back to globe
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
        🏷️ GI Tags Explorer
      </h1>
      <p className="mt-2 max-w-2xl text-slate-300">
        Geographical Indications — products whose quality and reputation are tied to where they
        come from. Browse India&apos;s full register, or explore GIs by country worldwide.
      </p>
      <GiExplorer />
    </div>
  );
}
