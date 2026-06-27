import Link from "next/link";
import { GlobeSection } from "@/components/GlobeSection";

// Google-Earth-style home: the globe is the hero, with only minimal,
// non-blocking chrome floating at the edges.
export default function HomePage() {
  return (
    <section className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <GlobeSection />

      {/* Quick-jump shortcuts, tucked into the bottom-left so the globe stays clear */}
      <div className="pointer-events-auto absolute bottom-6 left-6 z-10 flex flex-wrap items-center gap-2">
        <Link
          href="/india"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_0_24px_rgba(45,212,191,0.35)] transition hover:bg-brand-400"
        >
          Explore India
        </Link>
        <Link
          href="/karnataka"
          className="glass rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Karnataka
        </Link>
        <Link
          href="/solar-system"
          className="glass rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          🪐 Solar System
        </Link>
      </div>
    </section>
  );
}
