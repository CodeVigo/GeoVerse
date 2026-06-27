"use client";

import { useState } from "react";
import { IndiaGiList } from "./IndiaGiList";
import { WorldGiList } from "./WorldGiList";

export function GiExplorer() {
  const [tab, setTab] = useState<"india" | "world">("india");

  return (
    <div className="mt-6">
      <div className="inline-flex rounded-full border border-white/10 bg-ink-900 p-1 text-sm">
        <button
          onClick={() => setTab("india")}
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            tab === "india" ? "bg-brand-500 text-ink-950" : "text-slate-300 hover:text-white"
          }`}
        >
          🇮🇳 India
        </button>
        <button
          onClick={() => setTab("world")}
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            tab === "world" ? "bg-brand-500 text-ink-950" : "text-slate-300 hover:text-white"
          }`}
        >
          🌍 World
        </button>
      </div>

      {tab === "india" ? <IndiaGiList title="India GI Register" /> : <WorldGiList />}
    </div>
  );
}
