"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type LearningMode = "EXPLORE" | "EXAM";

interface ModeCtx {
  mode: LearningMode;
  setMode: (m: LearningMode) => void;
  toggle: () => void;
}

const Ctx = createContext<ModeCtx | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<LearningMode>("EXPLORE");

  useEffect(() => {
    const saved = window.localStorage.getItem("geoverse-mode") as LearningMode | null;
    if (saved === "EXPLORE" || saved === "EXAM") setMode(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("geoverse-mode", mode);
  }, [mode]);

  return (
    <Ctx.Provider
      value={{ mode, setMode, toggle: () => setMode((m) => (m === "EXPLORE" ? "EXAM" : "EXPLORE")) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
