import { type NextRequest } from "next/server";

// Same-origin map-tile proxy. The browser requests tiles from our own origin
// (no CORS), and the server fetches the real tile upstream. This sidesteps
// corporate proxies that strip CORS headers and break Cesium's WebGL textures.

export const dynamic = "force-dynamic";

type TileFn = (z: string, x: string, y: string) => string;

// Note: ESRI ArcGIS tiles use /tile/{level}/{row}/{col} = z/y/x order.
const UPSTREAM: Record<string, TileFn> = {
  sat: (z, x, y) =>
    `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  ref: (z, x, y) =>
    `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`,
  street: (z, x, y) =>
    `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { seg: string[] } },
) {
  const [layer, z, x, y] = params.seg ?? [];
  const fn = layer ? UPSTREAM[layer] : undefined;
  if (!fn || !z || !x || !y) {
    return new Response("Bad tile request", { status: 400 });
  }

  const url = fn(z, x, y);

  // Small in-memory cache so repeated tiles aren't re-fetched from upstream.
  const cached = tileCache.get(url);
  if (cached) {
    return new Response(cached.body, {
      status: 200,
      headers: cacheHeaders(cached.type),
    });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "GeoVerse/1.0 (+local)" },
    });
    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, { status: 502 });
    }
    const body = await upstream.arrayBuffer();
    const type = upstream.headers.get("content-type") ?? "image/jpeg";
    putTile(url, body, type);
    return new Response(body, { status: 200, headers: cacheHeaders(type) });
  } catch {
    return new Response("Tile fetch failed", { status: 502 });
  }
}

function cacheHeaders(type: string): HeadersInit {
  return {
    "Content-Type": type,
    // Long-lived immutable cache: the browser keeps tiles, so panning/zooming
    // back to a view is instant and never re-hits the server.
    "Cache-Control": "public, max-age=604800, immutable",
    "Access-Control-Allow-Origin": "*",
  };
}

// Bounded in-memory LRU-ish tile cache (per server process).
const tileCache = new Map<string, { body: ArrayBuffer; type: string }>();
const MAX_TILES = 800;

function putTile(url: string, body: ArrayBuffer, type: string) {
  if (tileCache.size >= MAX_TILES) {
    const oldest = tileCache.keys().next().value;
    if (oldest) tileCache.delete(oldest);
  }
  tileCache.set(url, { body, type });
}
