"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/", label: "Globe" },
  { href: "/india", label: "India" },
  { href: "/karnataka", label: "Karnataka" },
  { href: "/games", label: "Quizzes" },
  { href: "/paths", label: "Paths" },
  { href: "/gi", label: "GI Tags" },
];

export function TopBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative inline-block h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 shadow-[0_0_24px_rgba(45,212,191,0.55)]">
              <span className="absolute inset-1 rounded-full border border-white/40" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Geo<span className="text-brand-400">Verse</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-search"))}
            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-ink-800/60 px-3 py-1.5 text-sm text-slate-500 transition hover:border-white/20 hover:text-slate-300 sm:flex"
          >
            <span>Search places…</span>
            <kbd className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
          </button>

          {!loading &&
            (user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/learn"
                  className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 sm:flex"
                  title="Your learning dashboard"
                >
                  <span className="text-amber-400">🔥 {user.streakCount}</span>
                  <span className="text-brand-400">{user.xp} XP</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-sm font-bold text-ink-950"
                  title={`${user.displayName ?? user.email} — click to log out`}
                >
                  {(user.displayName ?? user.email).charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-400 sm:block"
              >
                Sign in
              </Link>
            ))}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-ink-800/60 text-slate-200 md:hidden"
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="border-t border-white/5 bg-ink-950/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event("open-search"));
              }}
              className="mt-1 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              🔍 Search places…
            </button>

            {!loading &&
              (user ? (
                <Link
                  href="/learn"
                  className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  🔥 {user.streakCount} · {user.xp} XP — Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="mt-1 rounded-lg bg-brand-500 px-3 py-2 text-center text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
                >
                  Sign in
                </Link>
              ))}
          </div>
        </nav>
      )}
    </header>
  );
}
