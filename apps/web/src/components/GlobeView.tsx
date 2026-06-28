"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Viewer,
  Entity,
  PointGraphics,
  LabelGraphics,
  useCesium,
  type CesiumComponentRef,
} from "resium";
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Color,
  ImageryLayer,
  TileMapServiceImageryProvider,
  UrlTemplateImageryProvider,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  IonWorldImageryStyle,
  buildModuleUrl,
  Ion,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  NearFarScalar,
  HeightReference,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Math as CesiumMath,
} from "cesium";
import gsap from "gsap";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { getGlobePoints, searchEntities, type GlobePoint } from "@/lib/api";

if (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
  Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
}

const TYPE_COLOR: Record<string, Color> = {
  COUNTRY: Color.fromCssColorString("#5eead4"),
  STATE: Color.fromCssColorString("#a5b4fc"),
  DISTRICT: Color.fromCssColorString("#fbbf24"),
  CITY: Color.fromCssColorString("#f472b6"),
  RIVER: Color.fromCssColorString("#38bdf8"),
  CONTINENT: Color.fromCssColorString("#94a3b8"),
  MONUMENT: Color.fromCssColorString("#fbbf24"),
  UNESCO_SITE: Color.fromCssColorString("#f59e0b"),
  LANDMARK: Color.fromCssColorString("#f472b6"),
  MOUNTAIN: Color.fromCssColorString("#a3e635"),
  WATERFALL: Color.fromCssColorString("#38bdf8"),
  DESERT: Color.fromCssColorString("#fb923c"),
};

// Free, offline bundled base imagery (always available as a fallback). Created
// per-mount (NOT a module singleton) — sharing one ImageryLayer across viewer
// mounts gets it destroyed and breaks the imagery collection.
function makeBaseLayer() {
  return ImageryLayer.fromProviderAsync(
    TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII")),
    {},
  );
}

type LayerMode = "esri" | "bing" | "street";

const LAYER_LABELS: Record<LayerMode, string> = {
  esri: "Satellite",
  bing: "Bing",
  street: "Street",
};

// Reliable way to obtain the Cesium Viewer: read it from Resium's context the
// moment it's created, instead of polling an external ref (which never gets
// populated in this Resium version). Rendered as a child of <Viewer>.
function ViewerReady({ onReady }: { onReady: (v: CesiumViewer) => void }) {
  const { viewer } = useCesium();
  useEffect(() => {
    if (viewer) onReady(viewer as unknown as CesiumViewer);
  }, [viewer, onReady]);
  return null;
}

// ── Country lookup by point (ray-casting) — lets us resolve a click anywhere on
// land to its country without rendering any extra (laggy) geometry on the globe.
type LngLat = [number, number];
interface CountryFeature {
  properties: Record<string, string>;
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(lng: number, lat: number, geom: CountryFeature["geometry"]): boolean {
  const polys =
    geom.type === "Polygon"
      ? [geom.coordinates as number[][][]]
      : geom.type === "MultiPolygon"
        ? (geom.coordinates as number[][][][])
        : [];
  for (const poly of polys) {
    if (!poly.length) continue;
    if (pointInRing(lng, lat, poly[0] as LngLat[])) {
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInRing(lng, lat, poly[h] as LngLat[])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

export function GlobeView() {
  const router = useRouter();
  const countriesRef = useRef<CountryFeature[] | null>(null);
  const ref = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [mode, setMode] = useState<LayerMode>("bing");
  const [baseLayer] = useState(() => makeBaseLayer());
  // Stable across renders — recreating this inline makes Resium rebuild the
  // whole <Viewer> every render (an infinite recreate loop → lag/blur).
  const [creditContainer] = useState(() =>
    typeof document !== "undefined" ? document.createElement("div") : undefined,
  );
  // Tolerant WebGL options so the globe still starts on mobile GPUs that report
  // a performance caveat. Cesium still auto-falls back to WebGL 1 when WebGL 2
  // is unavailable, so we don't force it (forcing it disables MSAA on desktop).
  const [contextOptions] = useState(() => ({
    webgl: { failIfMajorPerformanceCaveat: false },
  }));
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);
  const [selected, setSelected] = useState<GlobePoint | null>(null);
  const modeRef = useRef<LayerMode>("bing");

  // Show exactly one base layer for the selected mode; the ESRI label/boundary
  // reference layer stays on over both satellite styles (not over the street map).
  const applyLayerVisibility = useCallback(() => {
    const l = layersRef.current;
    const m = modeRef.current;
    if (l.satellite) l.satellite.show = m === "esri";
    if (l.bing) l.bing.show = m === "bing";
    if (l.street) l.street.show = m === "street";
    if (l.reference) l.reference.show = m !== "street";
  }, []);
  const hintRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{
    satellite?: ImageryLayer;
    reference?: ImageryLayer;
    street?: ImageryLayer;
    bing?: ImageryLayer;
  }>({});

  useEffect(() => {
    // Only the curated world-famous landmarks are pinned on the globe — keeps it
    // clean like Google Earth instead of cluttered with every country.
    getGlobePoints({ featured: true })
      .then(setPoints)
      .catch(() => setPoints([]));
  }, []);

  // Premium scene configuration (imagery, anti-aliasing, atmosphere, controls).
  // Runs once the Cesium viewer is available (provided via Resium context).
  useEffect(() => {
    if (!viewer || viewer.isDestroyed?.() || !viewer.scene) return;

    const scene = viewer.scene;

    // Direct CDN URLs (fast; served + cached at ESRI/CARTO's edge).
    const DIRECT: Record<string, string> = {
      sat: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ref: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      street: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    };

    const makeProvider = (layer: string, max: number) =>
      new UrlTemplateImageryProvider({
        url: DIRECT[layer],
        maximumLevel: max,
        credit: "Esri · OpenStreetMap · CARTO",
      });

    // Satellite (ESRI), boundary/label reference, and the street vector map.
    layersRef.current.satellite = viewer.imageryLayers.addImageryProvider(makeProvider("sat", 19));
    const reference = viewer.imageryLayers.addImageryProvider(makeProvider("ref", 19));
    reference.alpha = 0.9;
    layersRef.current.reference = reference;

    const street = viewer.imageryLayers.addImageryProvider(makeProvider("street", 20));
    street.show = false;
    layersRef.current.street = street;

    const hasIon = Boolean(process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN);

    // With a Cesium Ion token, add real 3D terrain (mountains/valleys) — the
    // signature "Google Earth" look. Tilt the view with right-drag to see it.
    if (hasIon) {
      createWorldTerrainAsync({ requestVertexNormals: true })
        .then((terrain) => {
          viewer.terrainProvider = terrain;
        })
        .catch(() => void 0);

      // Bing Aerial as an alternative satellite source (free via Ion). In some
      // regions it is newer/higher-res than ESRI — toggle to compare.
      createWorldImageryAsync({ style: IonWorldImageryStyle.AERIAL })
        .then((bing) => {
          const layer = viewer.imageryLayers.addImageryProvider(bing);
          layer.show = false;
          layersRef.current.bing = layer;
          applyLayerVisibility();
        })
        .catch(() => {
          // Ion/Bing unreachable — fall back to ESRI so the globe isn't blank.
          if (modeRef.current === "bing") setMode("esri");
        });
    }

    // Sharpness: MSAA + FXAA smooth edges, a low screen-space error renders
    // finer tiles, and matching the device pixel ratio keeps everything crisp.
    try {
      scene.msaaSamples = 4;
    } catch {
      /* older Cesium */
    }
    scene.globe.maximumScreenSpaceError = 1.0;
    // Keep many more tiles cached in memory so re-visiting a view is instant,
    // and preload neighbours/parents so zoom feels smooth (Google-Earth-style).
    scene.globe.tileCacheSize = 1000;
    scene.globe.preloadSiblings = true;
    scene.globe.preloadAncestors = true;
    if (scene.postProcessStages?.fxaa) scene.postProcessStages.fxaa.enabled = true;
    // CRITICAL on Windows/HiDPI: render at the screen's true pixel density
    // instead of 1x-then-upscaled (the real cause of the "everything is blurry"
    // look). useBrowserRecommendedResolution={false} makes Cesium honour the
    // device pixel ratio; resolutionScale then sharpens further on hi-dpi.
    viewer.useBrowserRecommendedResolution = false;
    viewer.resolutionScale = 1.0;

    // Even, fully-lit globe so countries stay readable at every zoom level.
    scene.globe.enableLighting = false;
    scene.globe.showGroundAtmosphere = true;
    scene.globe.atmosphereBrightnessShift = 0.1;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
    if (scene.fog) scene.fog.enabled = true;
    scene.backgroundColor = Color.TRANSPARENT;
    scene.globe.baseColor = Color.fromCssColorString("#0a0e1a");
    scene.globe.depthTestAgainstTerrain = false;

    // Allow zooming all the way down to street level for real detail.
    const controls = scene.screenSpaceCameraController;
    controls.minimumZoomDistance = 300;
    controls.maximumZoomDistance = 30000000;
    controls.enableCollisionDetection = false;

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(78.96, 22.59, 16000000),
      duration: 2.6,
    });

    // Gentle auto-rotation that stops on ANY interaction (the old version
    // ignored scroll-zoom, so the globe never settled and looked blurry).
    let spin = true;
    const stop = () => (spin = false);
    viewer.canvas.addEventListener("pointerdown", stop, { once: true });
    viewer.canvas.addEventListener("wheel", stop, { once: true, passive: true });
    viewer.canvas.addEventListener("touchstart", stop, { once: true, passive: true });
    const onTick = viewer.clock.onTick.addEventListener(() => {
      if (spin) viewer.scene.camera.rotate(Cartesian3.UNIT_Z, -0.0008);
    });

    return () => {
      // The viewer may already be destroyed on hot-reload/unmount, in which
      // case `canvas`/`clock` are gone — guard every access.
      try {
        onTick();
      } catch {
        /* clock already disposed */
      }
      const canvas = viewer?.isDestroyed?.() ? null : viewer?.canvas;
      if (canvas) {
        canvas.removeEventListener("pointerdown", stop);
        canvas.removeEventListener("wheel", stop);
        canvas.removeEventListener("touchstart", stop);
      }
    };
  }, [viewer]);

  // Toggle between ESRI satellite, Bing aerial, and the street/vector basemap.
  useEffect(() => {
    modeRef.current = mode;
    applyLayerVisibility();
  }, [mode, viewer, applyLayerVisibility]);

  // Clicking anywhere on a country's land opens its page. We resolve the click
  // to lat/lng on the globe, then do a point-in-polygon lookup against the
  // cached boundaries — no extra geometry is rendered, so there's no lag and the
  // whole landmass is clickable (not just a thin invisible shape).
  useEffect(() => {
    if (countriesRef.current) return;
    fetch("/geo/countries.geojson")
      .then((r) => r.json())
      .then((gj: { features: CountryFeature[] }) => {
        countriesRef.current = gj.features;
      })
      .catch(() => void 0);
  }, []);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed?.() || !viewer.scene) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((m: { position: Cartesian2 }) => {
      // A marker was clicked → let its own handler preview it.
      if (viewer.scene.pick(m.position)?.id) return;
      const feats = countriesRef.current;
      if (!feats) return;
      const cart = viewer.camera.pickEllipsoid(m.position, viewer.scene.globe.ellipsoid);
      if (!cart) return; // clicked space, not the globe
      const carto = Cartographic.fromCartesian(cart);
      const lng = CesiumMath.toDegrees(carto.longitude);
      const lat = CesiumMath.toDegrees(carto.latitude);
      const hit = feats.find((f) => pointInFeature(lng, lat, f.geometry));
      if (!hit) return; // clicked the ocean
      const p = hit.properties;
      const name = p.NAME ?? p.ADMIN ?? p.NAME_LONG;
      if (!name) return;
      searchEntities(String(name))
        .then((res) => {
          const slug = res[0]?.slug;
          if (slug) router.push(`/${slug}`);
        })
        .catch(() => void 0);
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      try {
        handler.destroy();
      } catch {
        /* canvas gone */
      }
    };
  }, [viewer, router]);

  useEffect(() => {
    if (hintRef.current) {
      gsap.fromTo(
        hintRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: "power2.out" },
      );
    }
  }, []);

  // Clicking a marker previews the place (with a photo); the card's button
  // flies in and opens the full page.
  const preview = (p: GlobePoint) => {
    setSelected(p);
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(p.lng, p.lat, 2_600_000),
        duration: 1.0,
      });
    }
  };

  const flyAndOpen = (p: GlobePoint) => {
    if (!viewer) {
      router.push(`/${p.slug}`);
      return;
    }
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(p.lng, p.lat, 1500000),
      duration: 1.1,
      complete: () => router.push(`/${p.slug}`),
    });
    // Safety: navigate even if the flight is interrupted.
    setTimeout(() => router.push(`/${p.slug}`), 1300);
  };

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-auto absolute right-4 top-4 z-10 flex rounded-full border border-white/10 bg-ink-900/70 p-1 text-xs font-semibold backdrop-blur">
        {(["esri", "bing", "street"] as LayerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 transition ${
              mode === m ? "bg-white/90 text-ink-900" : "text-slate-300 hover:text-white"
            }`}
          >
            {LAYER_LABELS[m]}
          </button>
        ))}
      </div>

      <Viewer
        ref={ref}
        full
        baseLayer={baseLayer}
        useBrowserRecommendedResolution={false}
        animation={false}
        timeline={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        infoBox={false}
        selectionIndicator={false}
        creditContainer={creditContainer}
        contextOptions={contextOptions}
      >
        <ViewerReady onReady={setViewer} />
        {points.map((p) => (
          <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat)} onClick={() => preview(p)}>
            <PointGraphics
              pixelSize={10}
              color={TYPE_COLOR[p.type] ?? Color.WHITE}
              outlineColor={Color.WHITE.withAlpha(0.85)}
              outlineWidth={1.5}
              heightReference={HeightReference.CLAMP_TO_GROUND}
            />
            <LabelGraphics
              text={p.name}
              font="600 13px Inter, sans-serif"
              fillColor={Color.WHITE}
              style={LabelStyle.FILL_AND_OUTLINE}
              outlineColor={Color.BLACK.withAlpha(0.85)}
              outlineWidth={3}
              verticalOrigin={VerticalOrigin.BOTTOM}
              pixelOffset={new Cartesian2(0, -16)}
              scaleByDistance={new NearFarScalar(1.5e6, 1.0, 2.0e7, 0.55)}
              translucencyByDistance={new NearFarScalar(2.0e6, 1.0, 2.6e7, 0.0)}
            />
          </Entity>
        ))}
      </Viewer>

      {/* Place preview card (with photo) shown when a marker is clicked */}
      {selected && (
        <div className="pointer-events-auto absolute left-4 top-4 z-20 w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/85 shadow-2xl backdrop-blur">
          <div className="relative h-40 w-full bg-white/5">
            <PlacePhoto wiki={selected.wiki ?? selected.name} name={selected.name} />
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-400">
              {[selected.category, selected.country].filter(Boolean).join(" · ")}
            </p>
            {selected.summary && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-300">
                {selected.summary}
              </p>
            )}
            <button
              onClick={() => flyAndOpen(selected)}
              className="mt-3 w-full rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
            >
              Explore →
            </button>
          </div>
        </div>
      )}

      <div
        ref={hintRef}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 text-sm text-slate-300 backdrop-blur"
      >
        Drag to rotate · scroll to zoom · click a country or marker to explore
      </div>
    </div>
  );
}

// Fetches a place photo from Wikipedia's REST summary endpoint (free, CORS-OK),
// with a small in-memory cache and a graceful gradient fallback.
const wikiImageCache = new Map<string, string | null>();

function PlacePhoto({ wiki, name }: { wiki: string; name: string }) {
  const [src, setSrc] = useState<string | null | undefined>(() =>
    wikiImageCache.has(wiki) ? wikiImageCache.get(wiki) : undefined,
  );

  useEffect(() => {
    let cancelled = false;
    if (wikiImageCache.has(wiki)) {
      setSrc(wikiImageCache.get(wiki));
      return;
    }
    setSrc(undefined);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wiki)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const url: string | null =
          d?.thumbnail?.source ?? d?.originalimage?.source ?? null;
        wikiImageCache.set(wiki, url);
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        wikiImageCache.set(wiki, null);
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [wiki]);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/20 to-accent-500/20">
      <span className="text-sm text-slate-400">
        {src === undefined ? "Loading photo…" : "No photo available"}
      </span>
    </div>
  );
}
