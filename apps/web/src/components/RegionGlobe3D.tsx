"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Viewer,
  Color,
  Ion,
  ImageryLayer,
  UrlTemplateImageryProvider,
  TileMapServiceImageryProvider,
  GeoJsonDataSource,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  IonWorldImageryStyle,
  buildModuleUrl,
  Cartesian3,
  Cartesian2,
  Rectangle,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  ClippingPolygon,
  ClippingPolygonCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  JulianDate,
  NearFarScalar,
  type Entity,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  loadBoundaryFeatures,
  loadContextFeatures,
  boundsOf,
  extendBounds,
  type GeoFeature,
  type GeoJson,
} from "@/lib/boundaries";
import { getEntity, searchEntities } from "@/lib/api";

const hasIon = Boolean(process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN);
if (hasIon) {
  Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN as string;
}

// ESRI tile services (best-effort: used for physical/topographic + reference labels).
const ESRI_TOPO =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
const ESRI_PHYSICAL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}";

type LayerMode = "satellite" | "physical" | "topographic";

// Distinct border colours so adjacent districts/states are easy to tell apart.
const BORDER_PALETTE = [
  "#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#f472b6",
  "#fb923c", "#22d3ee", "#a3e635", "#e879f9", "#2dd4bf", "#facc15",
];

interface RiverInfo {
  name: string;
  slug: string;
  summary: string;
  origin: string;
  mouth: string;
  lengthKm: number;
  flow: string[];
}

interface Selected {
  kind: "district" | "river";
  name: string;
  slug: string;
  summary?: string;
  knownFor?: string[];
  origin?: string;
  mouth?: string;
  lengthKm?: number;
  flow?: string[];
  loading?: boolean;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Build Cesium clipping polygons from a region's GeoJSON outer rings, so the
// globe shows ONLY this region + its neighbours (everything else clipped away).
function buildClippingPolygons(features: GeoFeature[]): ClippingPolygon[] {
  const polys: ClippingPolygon[] = [];
  const addRing = (ring: unknown) => {
    if (!Array.isArray(ring) || ring.length < 3) return;
    const flat: number[] = [];
    for (const pt of ring) {
      if (Array.isArray(pt) && typeof pt[0] === "number" && typeof pt[1] === "number") {
        flat.push(pt[0], pt[1]);
      }
    }
    if (flat.length >= 6) {
      polys.push(new ClippingPolygon({ positions: Cartesian3.fromDegreesArray(flat) }));
    }
  };
  for (const f of features) {
    const g = f.geometry as { type: string; coordinates: unknown };
    if (g.type === "Polygon") addRing((g.coordinates as unknown[])[0]);
    else if (g.type === "MultiPolygon")
      for (const poly of g.coordinates as unknown[][]) addRing(poly[0]);
  }
  return polys;
}

// Flatten a feature's polygon rings into [lng,lat,lng,lat,...] arrays so each
// boundary can be drawn as a thick ground polyline (Cesium polygon outlines are
// hairline-thin, so we draw the rings as real polylines instead).
function polygonRings(f: GeoFeature): number[][] {
  const out: number[][] = [];
  const g = f.geometry as { type: string; coordinates: unknown };
  const addRing = (ring: unknown) => {
    if (!Array.isArray(ring)) return;
    const flat: number[] = [];
    for (const pt of ring) {
      if (Array.isArray(pt) && typeof pt[0] === "number" && typeof pt[1] === "number") {
        flat.push(pt[0], pt[1]);
      }
    }
    if (flat.length >= 6) out.push(flat);
  };
  if (g.type === "Polygon") for (const r of g.coordinates as unknown[]) addRing(r);
  else if (g.type === "MultiPolygon")
    for (const poly of g.coordinates as unknown[][]) for (const r of poly) addRing(r);
  return out;
}

// Centroid of a feature, from its bounding box.
function featureCenter(f: GeoFeature): [number, number] {
  const b: [number, number, number, number] = [180, 90, -180, -90];
  extendBounds(f.geometry.coordinates, b);
  return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
}

interface Props {
  entityType: string;
  name: string;
  iso3?: string | null;
  neighbors?: string[];
  // When set, river paths are drawn + animated and become clickable.
  riversUrl?: string;
}

export function RegionGlobe3D({ entityType, name, iso3, neighbors, riversUrl }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const layersRef = useRef<{
    bing?: ImageryLayer;
    topo?: ImageryLayer;
    physical?: ImageryLayer;
  }>({});
  const districtLabelsRef = useRef<Entity[]>([]);
  const riverEntitiesRef = useRef<Entity[]>([]);
  const riverInfoRef = useRef<Record<string, RiverInfo>>({});

  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [layer, setLayer] = useState<LayerMode>("satellite");
  const [showDistricts, setShowDistricts] = useState(true);
  // Rivers are OFF by default — only animate when the user presses "Rivers".
  const [showRivers, setShowRivers] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);

  const isState = entityType === "STATE" || entityType === "UNION_TERRITORY";

  // ── Layer mode: flip imagery visibility ───────────────────────────────
  const applyLayer = useCallback((mode: LayerMode) => {
    const { bing, topo, physical } = layersRef.current;
    if (bing) bing.show = mode === "satellite";
    if (topo) topo.show = mode === "topographic";
    if (physical) physical.show = mode === "physical";
    viewerRef.current?.scene.requestRender();
  }, []);

  useEffect(() => applyLayer(layer), [layer, applyLayer, status]);

  // Physical maps are about terrain + water — auto-surface the rivers there.
  useEffect(() => {
    if (layer === "physical" && riversUrl) setShowRivers(true);
  }, [layer, riversUrl]);

  useEffect(() => {
    for (const e of districtLabelsRef.current) e.show = showDistricts;
    viewerRef.current?.scene.requestRender();
  }, [showDistricts, status]);

  useEffect(() => {
    for (const e of riverEntitiesRef.current) e.show = showRivers;
    viewerRef.current?.scene.requestRender();
  }, [showRivers, status]);

  // ── Fullscreen ─────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      // Let Cesium re-fit the canvas to the new size.
      setTimeout(() => {
        viewerRef.current?.resize();
        viewerRef.current?.scene.requestRender();
      }, 60);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Build the scene ──────────────────────────────────────────────────
  useEffect(() => {
    if (!ref.current) return;
    let viewer: Viewer | null = null;
    let cancelled = false;
    let handler: ScreenSpaceEventHandler | null = null;

    (async () => {
      const query = { entityType, name, iso3 };
      const features = await loadBoundaryFeatures(query).catch(() => []);
      if (cancelled || !ref.current) return;
      if (!features.length) {
        setStatus("empty");
        return;
      }
      const context = await loadContextFeatures(query, features, neighbors).catch(() => ({
        groups: [],
        labels: [],
      }));
      const contextFeatures = context.groups.flatMap((g) => g.features);

      viewer = new Viewer(ref.current, {
        baseLayer: false as never,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        // These maps are static (no spin/animation), so render only when
        // something actually changes — huge CPU/GPU saving = far less lag.
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        creditContainer: document.createElement("div"),
      });
      viewerRef.current = viewer;

      const scene = viewer.scene;
      scene.globe.depthTestAgainstTerrain = true;
      // 2.0 loads noticeably fewer tiles than 1.5 (faster, still crisp at region scale).
      scene.globe.maximumScreenSpaceError = 2.0;
      if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
      scene.globe.showGroundAtmosphere = false;
      // The globe is clipped to this region + neighbours, so everything else
      // (including the surrounding ocean) shows the background colour. Use a deep
      // sea blue so coastal regions like Karnataka visibly sit in the Arabian Sea.
      scene.backgroundColor = Color.fromCssColorString("#0a2a43");
      scene.globe.baseColor = Color.fromCssColorString("#0a2a43");
      try {
        scene.msaaSamples = 4;
      } catch {
        /* older Cesium */
      }

      // Clip the globe to this region + neighbours.
      try {
        const clipPolys = buildClippingPolygons([...features, ...contextFeatures]);
        if (clipPolys.length) {
          scene.globe.clippingPolygons = new ClippingPolygonCollection({
            polygons: clipPolys,
            inverse: true,
          });
        }
      } catch {
        /* clipping unsupported */
      }

      // Bottom: offline Natural Earth II — a physical relief base that always loads.
      viewer.imageryLayers.add(
        ImageryLayer.fromProviderAsync(
          TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII")),
          {},
        ),
      );

      // Physical + topographic overlays (best-effort over corporate proxy).
      try {
        const physical = viewer.imageryLayers.addImageryProvider(
          new UrlTemplateImageryProvider({ url: ESRI_PHYSICAL, maximumLevel: 8 }),
        );
        physical.show = false;
        layersRef.current.physical = physical;
        const topo = viewer.imageryLayers.addImageryProvider(
          new UrlTemplateImageryProvider({ url: ESRI_TOPO, maximumLevel: 19 }),
        );
        topo.show = false;
        layersRef.current.topo = topo;
      } catch {
        /* blocked — Natural Earth still shows */
      }

      // Satellite: Bing aerial WITH labels via Ion (also labels seas/oceans).
      if (hasIon) {
        createWorldImageryAsync({ style: IonWorldImageryStyle.AERIAL_WITH_LABELS })
          .then((bing) => {
            if (!viewer || viewer.isDestroyed()) return;
            const bingLayer = viewer.imageryLayers.addImageryProvider(bing);
            layersRef.current.bing = bingLayer;
            applyLayer(layer);
          })
          .catch(() => void 0);

        createWorldTerrainAsync({ requestVertexNormals: true })
          .then((t) => {
            if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = t;
          })
          .catch(() => void 0);
      }

      // Bordering regions: distinct colours + visible borders + bold labels.
      const NEIGHBOR_COLORS = [
        "#fca5a5", "#fcd34d", "#86efac", "#93c5fd", "#c4b5fd", "#f9a8d4", "#fdba74", "#67e8f9",
      ];
      for (let gi = 0; gi < context.groups.length; gi++) {
        const group = context.groups[gi];
        const c = Color.fromCssColorString(NEIGHBOR_COLORS[gi % NEIGHBOR_COLORS.length]);
        const ctxFc: GeoJson = { type: "FeatureCollection", features: group.features };
        const ctxDs = await GeoJsonDataSource.load(ctxFc as never, {
          stroke: c.withAlpha(0.95),
          fill: c.withAlpha(0.28),
          strokeWidth: 2.5,
          clampToGround: true,
        });
        if (cancelled || !viewer || viewer.isDestroyed()) return;
        viewer.dataSources.add(ctxDs);
      }
      // Reveal labels only as the user zooms in — at the initial framing the map
      // shows just coloured borders (no text clutter). Thresholds scale with the
      // region's size so it works for India, a state, or a single district.
      const fb = boundsOf(features);
      const spanM = Math.max(Math.max(fb[2] - fb[0], fb[3] - fb[1]) * 111000, 60000);
      const labelFade = new NearFarScalar(spanM * 0.12, 1.0, spanM * 0.55, 0.0);

      for (const lbl of context.labels) {
        viewer.entities.add({
          position: Cartesian3.fromDegrees(lbl.lng, lbl.lat),
          label: {
            text: lbl.name,
            font: "700 16px Inter, sans-serif",
            fillColor: Color.WHITE,
            style: LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Color.BLACK.withAlpha(0.9),
            outlineWidth: 4,
            verticalOrigin: VerticalOrigin.CENTER,
            translucencyByDistance: labelFade,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }

      // Draw sub-region borders as THICK coloured ground polylines (one colour
      // per district/state) so adjacent regions are easy to tell apart — with a
      // dark casing underneath for contrast against any imagery.
      const drawColoredBorders = (
        feats: GeoFeature[],
        keyOf: (f: GeoFeature) => string,
        width: number,
      ) => {
        const groups = new Map<string, GeoFeature[]>();
        for (const f of feats) {
          const k = keyOf(f) || `_${groups.size}`;
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k)!.push(f);
        }
        let i = 0;
        for (const [, fs] of groups) {
          const c = Color.fromCssColorString(BORDER_PALETTE[i % BORDER_PALETTE.length]);
          i++;
          for (const f of fs) {
            for (const flat of polygonRings(f)) {
              const positions = Cartesian3.fromDegreesArray(flat);
              viewer!.entities.add({
                polyline: {
                  positions,
                  width: width + 3,
                  material: Color.BLACK.withAlpha(0.5),
                  clampToGround: true,
                },
              });
              viewer!.entities.add({
                polyline: { positions, width, material: c, clampToGround: true },
              });
            }
          }
        }
      };

      if (isState) {
        // Karnataka etc.: colour each DISTRICT border distinctly.
        drawColoredBorders(features, (f) => (f.properties.district as string) ?? "", 4);
      } else {
        const isIndia = (iso3 ?? "").toUpperCase() === "IND" || name.toLowerCase() === "india";
        if (isIndia) {
          // India: draw every STATE outline ONCE from the state-level file. This
          // traces the national perimeter exactly once (no doubled border) and
          // shows the internal state boundaries in a single clean style.
          const indiaData: GeoJson = await fetch("/geo/india-states.geojson")
            .then((r) => r.json())
            .catch(() => ({ type: "FeatureCollection", features: [] }) as GeoJson);
          if (cancelled || !viewer || viewer.isDestroyed()) return;
          const ds = await GeoJsonDataSource.load(indiaData as never, {
            stroke: Color.fromCssColorString("#5eead4"),
            fill: Color.fromCssColorString("#2dd4bf").withAlpha(0.04),
            strokeWidth: 2.5,
            clampToGround: true,
          });
          if (cancelled || !viewer || viewer.isDestroyed()) return;
          viewer.dataSources.add(ds);

          // State names, revealed as the user zooms in (deduped, like districts).
          const seenStates = new Set<string>();
          for (const f of indiaData.features) {
            const sn = (f.properties.ST_NM as string) ?? "";
            if (!sn || seenStates.has(sn)) continue;
            seenStates.add(sn);
            const [lng, lat] = featureCenter(f);
            viewer.entities.add({
              position: Cartesian3.fromDegrees(lng, lat),
              properties: { ST_NM: sn },
              label: {
                text: sn,
                font: "700 14px Inter, sans-serif",
                fillColor: Color.WHITE,
                style: LabelStyle.FILL_AND_OUTLINE,
                outlineColor: Color.BLACK.withAlpha(0.9),
                outlineWidth: 3,
                verticalOrigin: VerticalOrigin.CENTER,
                horizontalOrigin: HorizontalOrigin.CENTER,
                translucencyByDistance: labelFade,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            });
          }
        } else {
          // Other countries: bold outline of the country itself.
          const fc: GeoJson = { type: "FeatureCollection", features };
          const ds = await GeoJsonDataSource.load(fc as never, {
            stroke: Color.fromCssColorString("#5eead4"),
            fill: Color.fromCssColorString("#2dd4bf").withAlpha(0.03),
            strokeWidth: 4,
            clampToGround: true,
          });
          if (cancelled || !viewer || viewer.isDestroyed()) return;
          viewer.dataSources.add(ds);
        }
      }

      // District labels (states only) — clickable text at each district centroid.
      districtLabelsRef.current = [];
      if (isState) {
        const seen = new Set<string>();
        for (const f of features) {
          const dn = (f.properties.district as string) ?? "";
          if (!dn || seen.has(dn)) continue;
          seen.add(dn);
          const [lng, lat] = featureCenter(f);
          const e = viewer.entities.add({
            position: Cartesian3.fromDegrees(lng, lat),
            properties: { district: dn },
            label: {
              text: dn,
              font: "600 13px Inter, sans-serif",
              fillColor: Color.fromCssColorString("#f0fdfa"),
              style: LabelStyle.FILL_AND_OUTLINE,
              outlineColor: Color.BLACK.withAlpha(0.85),
              outlineWidth: 3,
              verticalOrigin: VerticalOrigin.CENTER,
              horizontalOrigin: HorizontalOrigin.CENTER,
              // Hidden at the wide view; fade in as the user zooms into the state.
              translucencyByDistance: labelFade,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
          districtLabelsRef.current.push(e);
        }
      }

      // ── Rivers: static highlighted lines on the map (no animation), clickable ──
      riverEntitiesRef.current = [];
      riverInfoRef.current = {};
      if (riversUrl) {
        try {
          const rivers: GeoJson = await fetch(riversUrl).then((r) => r.json());
          if (!cancelled && viewer && !viewer.isDestroyed()) {
            for (const f of rivers.features) {
              const p = f.properties as Record<string, unknown>;
              const coords = (f.geometry as { coordinates: number[][] }).coordinates;
              const flat = coords.flat();
              const color = Color.fromCssColorString((p.color as string) ?? "#38bdf8");
              const slug = (p.slug as string) ?? slugify(p.name as string);
              riverInfoRef.current[`river-${slug}`] = {
                name: p.name as string,
                slug,
                summary: (p.summary as string) ?? "",
                origin: (p.origin as string) ?? "",
                mouth: (p.mouth as string) ?? "",
                lengthKm: Number(p.length_km ?? 0),
                flow: Array.isArray(p.flow) ? (p.flow as string[]) : [],
              };

              const positions = Cartesian3.fromDegreesArray(flat);
              // White casing for contrast, then the bright coloured river on top.
              const casing = viewer.entities.add({
                id: `rivercase-${slug}`,
                polyline: {
                  positions,
                  width: 8,
                  material: Color.WHITE.withAlpha(0.55),
                  clampToGround: true,
                },
              });
              riverEntitiesRef.current.push(casing);
              const line = viewer.entities.add({
                id: `river-${slug}`,
                polyline: { positions, width: 4, material: color, clampToGround: true },
              });
              riverEntitiesRef.current.push(line);

              // River name at the source, fading with zoom like other labels.
              const nameLabel = viewer.entities.add({
                id: `riverlabel-${slug}`,
                position: Cartesian3.fromDegrees(coords[0][0], coords[0][1]),
                label: {
                  text: p.name as string,
                  font: "italic 600 13px Inter, sans-serif",
                  fillColor: color,
                  style: LabelStyle.FILL_AND_OUTLINE,
                  outlineColor: Color.BLACK.withAlpha(0.85),
                  outlineWidth: 3,
                  pixelOffset: new Cartesian2(0, -10),
                  translucencyByDistance: labelFade,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
              });
              riverEntitiesRef.current.push(nameLabel);
            }
            // Apply current toggle (rivers default OFF).
            for (const e of riverEntitiesRef.current) e.show = showRivers;
          }
        } catch {
          /* rivers file missing — skip */
        }
      }

      // ── Click to inspect districts + rivers ─────────────────────────────
      handler = new ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((movement: { position: Cartesian2 }) => {
        const picked = scene.pick(movement.position);
        const id = picked?.id as Entity | undefined;
        if (!id) {
          setSelected(null);
          return;
        }
        // River? (line, casing or label all map back to the river key)
        const eid = typeof id.id === "string" ? id.id : "";
        let riverKey = "";
        if (eid.startsWith("river-")) riverKey = eid;
        else if (eid.startsWith("rivercase-"))
          riverKey = `river-${eid.slice("rivercase-".length)}`;
        else if (eid.startsWith("riverlabel-"))
          riverKey = `river-${eid.slice("riverlabel-".length)}`;
        const river = riverKey ? riverInfoRef.current[riverKey] : undefined;
        if (river) {
          setSelected({
            kind: "river",
            name: river.name,
            slug: river.slug,
            summary: river.summary,
            origin: river.origin,
            mouth: river.mouth,
            lengthKm: river.lengthKm,
            flow: river.flow,
          });
          return;
        }
        // District? (from label entity or polygon feature properties)
        let dn = "";
        try {
          const prop = (id.properties as unknown as Record<string, { getValue?: (t: JulianDate) => unknown }>)
            ?.district;
          dn = (prop?.getValue?.(JulianDate.now()) as string) ?? "";
        } catch {
          /* not a district */
        }
        if (dn) {
          const dslug = slugify(dn);
          setSelected({ kind: "district", name: dn, slug: dslug, loading: true });
          getEntity(dslug)
            .then((ent) => {
              setSelected((cur) =>
                cur && cur.slug === dslug
                  ? {
                      ...cur,
                      loading: false,
                      summary: ent?.summary ?? undefined,
                      knownFor:
                        ((ent?.profile as Record<string, unknown>)?.data as Record<string, unknown>)
                          ?.knownFor as string[] | undefined,
                    }
                  : cur,
              );
            })
            .catch(() => setSelected((cur) => (cur ? { ...cur, loading: false } : cur)));
          return;
        }
        // State (India map)? Open that state's page.
        let sn = "";
        try {
          const prop = (id.properties as unknown as Record<string, { getValue?: (t: JulianDate) => unknown }>)
            ?.ST_NM;
          sn = (prop?.getValue?.(JulianDate.now()) as string) ?? "";
        } catch {
          /* not a state */
        }
        if (sn) {
          searchEntities(sn)
            .then((res) => {
              const slug = res[0]?.slug;
              if (slug) router.push(`/${slug}`);
            })
            .catch(() => void 0);
          return;
        }
        setSelected(null);
      }, ScreenSpaceEventType.LEFT_CLICK);

      // Frame the focus region top-down, north-up.
      const [w, s, e, n] = boundsOf(features);
      const padX = Math.max((e - w) * 0.18, 0.5);
      const padY = Math.max((n - s) * 0.18, 0.5);
      viewer.camera.flyTo({
        destination: Rectangle.fromDegrees(w - padX, s - padY, e + padX, n + padY),
        duration: 2.0,
      });
      setStatus("ready");
    })();

    return () => {
      cancelled = true;
      handler?.destroy();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      layersRef.current = {};
      districtLabelsRef.current = [];
      riverEntitiesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, name, iso3, (neighbors ?? []).join("|"), riversUrl]);

  if (status === "empty") return null;

  const LAYERS: { id: LayerMode; label: string }[] = [
    { id: "satellite", label: "Satellite" },
    { id: "physical", label: "Physical" },
    { id: "topographic", label: "Topographic" },
  ];

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a2a43] ${
        fullscreen ? "h-screen rounded-none" : "h-[68vh] min-h-[460px]"
      }`}
    >
      <div ref={ref} className="h-full w-full [&_.cesium-viewer-bottom]:hidden" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          Loading 3D terrain…
        </div>
      )}

      {/* Top-left: layer modes */}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1 rounded-xl bg-ink-950/70 p-1 backdrop-blur">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLayer(l.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              layer === l.id ? "bg-brand-500 text-ink-950" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Top-right: toggles + fullscreen */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-ink-950/70 p-1 backdrop-blur">
        {isState && (
          <Toggle on={showDistricts} onClick={() => setShowDistricts((v) => !v)}>
            Districts
          </Toggle>
        )}
        {riversUrl && (
          <Toggle on={showRivers} onClick={() => setShowRivers((v) => !v)}>
            Rivers
          </Toggle>
        )}
        <button
          onClick={toggleFullscreen}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          title="Fullscreen"
        >
          {fullscreen ? "Exit ⤢" : "Fullscreen ⤢"}
        </button>
      </div>

      {/* Info panel for a clicked district / river */}
      {selected && (
        <div className="absolute bottom-3 left-3 max-w-xs rounded-2xl border border-white/10 bg-ink-950/85 p-4 text-sm backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                {selected.kind === "river" ? "River" : "District"}
              </div>
              <h3 className="text-base font-semibold text-white">{selected.name}</h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {selected.kind === "river" && (
            <div className="mt-2 space-y-2 text-slate-300">
              {selected.summary && <p className="leading-relaxed">{selected.summary}</p>}
              {selected.flow && selected.flow.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Its journey
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
                    {selected.flow.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span
                          className={
                            i === 0
                              ? "font-semibold text-emerald-300"
                              : i === selected.flow!.length - 1
                                ? "font-semibold text-sky-300"
                                : "text-slate-300"
                          }
                        >
                          {step}
                        </span>
                        {i < selected.flow!.length - 1 && <span className="text-slate-600">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400">
                {selected.lengthKm ? `Length: ${selected.lengthKm} km` : ""}
              </p>
            </div>
          )}

          {selected.kind === "district" && (
            <div className="mt-2 space-y-2 text-slate-300">
              {selected.loading && <p className="text-slate-500">Loading…</p>}
              {selected.summary && <p className="leading-relaxed">{selected.summary}</p>}
              {selected.knownFor && selected.knownFor.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.knownFor.map((k) => (
                    <span key={k} className="chip text-[11px] text-slate-200">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link
            href={`/${selected.slug}`}
            className="mt-3 inline-block text-xs font-semibold text-brand-400 hover:underline"
          >
            View full details →
          </Link>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] uppercase tracking-wider text-slate-400">
        {name} · click a {riversUrl ? "river / " : ""}district · right-drag to tilt
      </div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        on ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
