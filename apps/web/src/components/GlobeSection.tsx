"use client";

import dynamic from "next/dynamic";

// react-globe.gl touches `window`, so load it only on the client.
const GlobeView = dynamic(() => import("./GlobeView").then((m) => m.GlobeView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        <p className="text-sm">Spinning up the globe…</p>
      </div>
    </div>
  ),
});

export function GlobeSection() {
  return <GlobeView />;
}
