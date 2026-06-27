"use client";

import { useEffect, useRef, useState } from "react";

// Lazily fetches a thumbnail from Wikipedia for `title`, only once the element
// scrolls near the viewport (so a 600-item list doesn't fire 600 requests).
const cache = new Map<string, string | null>();

interface Props {
  title: string;
  fallback?: string;
  className?: string;
}

export function WikiThumb({ title, fallback = "🏷️", className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | null | undefined>(() =>
    cache.has(title) ? cache.get(title) : undefined,
  );

  useEffect(() => {
    if (cache.has(title)) {
      setSrc(cache.get(title));
      return;
    }
    const el = ref.current;
    if (!el) return;

    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const url: string | null = d?.thumbnail?.source ?? null;
          cache.set(title, url);
          setSrc(url);
        })
        .catch(() => {
          cache.set(title, null);
          setSrc(null);
        });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [title]);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center overflow-hidden bg-white/[0.03] ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl opacity-60">{fallback}</span>
      )}
    </div>
  );
}
