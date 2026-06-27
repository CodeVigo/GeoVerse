"use client";

import dynamic from "next/dynamic";

// The 3D scene uses three.js / WebGL, so it must only load in the browser.
const SolarSystemScene = dynamic(
  () => import("./SolarSystemScene").then((m) => m.SolarSystemScene),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400">
        Loading the solar system…
      </div>
    ),
  },
);

export function SolarSystem() {
  return <SolarSystemScene />;
}
