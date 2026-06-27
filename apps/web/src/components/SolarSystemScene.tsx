"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";

interface Planet {
  name: string;
  order: number;
  color: string;
  a: number; // semi-major axis (AU)
  periodYears: number;
  l0: number; // mean longitude at J2000 (deg)
  size: number; // 3D display radius (visual only)
  ring?: boolean;
  type: string;
  diameter: string;
  moons: string;
  day: string;
  year: string;
  distance: string;
  blurb: string;
}

const PLANETS: Planet[] = [
  { name: "Mercury", order: 1, color: "#b1a6a0", a: 0.387, periodYears: 0.2408, l0: 252.25, size: 0.3, type: "Terrestrial", diameter: "4,879 km", moons: "0", day: "59 Earth days", year: "88 Earth days", distance: "0.39 AU (~58 M km)", blurb: "The smallest planet and closest to the Sun, with extreme temperature swings and no real atmosphere." },
  { name: "Venus", order: 2, color: "#e6c27a", a: 0.723, periodYears: 0.6152, l0: 181.98, size: 0.5, type: "Terrestrial", diameter: "12,104 km", moons: "0", day: "243 Earth days", year: "225 Earth days", distance: "0.72 AU (~108 M km)", blurb: "The hottest planet (~465 °C) due to a runaway greenhouse effect; it spins backwards." },
  { name: "Earth", order: 3, color: "#4f93d6", a: 1.0, periodYears: 1.0, l0: 100.46, size: 0.52, type: "Terrestrial", diameter: "12,742 km", moons: "1", day: "24 hours", year: "365.25 days", distance: "1 AU (~150 M km)", blurb: "Our home — the only known world with liquid surface water and life." },
  { name: "Mars", order: 4, color: "#d1603f", a: 1.524, periodYears: 1.8808, l0: 355.43, size: 0.4, type: "Terrestrial", diameter: "6,779 km", moons: "2", day: "24.6 hours", year: "687 Earth days", distance: "1.52 AU (~228 M km)", blurb: "The 'Red Planet', home to Olympus Mons — the tallest volcano in the solar system." },
  { name: "Jupiter", order: 5, color: "#d7a06b", a: 5.203, periodYears: 11.862, l0: 34.4, size: 1.7, type: "Gas giant", diameter: "139,820 km", moons: "95+", day: "10 hours", year: "11.9 Earth years", distance: "5.2 AU (~778 M km)", blurb: "The largest planet — its Great Red Spot is a storm bigger than Earth." },
  { name: "Saturn", order: 6, color: "#e3d2a2", a: 9.537, periodYears: 29.457, l0: 49.94, size: 1.45, ring: true, type: "Gas giant", diameter: "116,460 km", moons: "146+", day: "10.7 hours", year: "29.5 Earth years", distance: "9.5 AU (~1.4 B km)", blurb: "Famous for its spectacular ring system of ice and rock." },
  { name: "Uranus", order: 7, color: "#9fe0e0", a: 19.191, periodYears: 84.011, l0: 313.23, size: 0.95, type: "Ice giant", diameter: "50,724 km", moons: "28", day: "17 hours", year: "84 Earth years", distance: "19.2 AU (~2.9 B km)", blurb: "An ice giant tipped on its side — it orbits the Sun essentially rolling on its axis." },
  { name: "Neptune", order: 8, color: "#5b7cf0", a: 30.069, periodYears: 164.79, l0: 304.88, size: 0.92, type: "Ice giant", diameter: "49,244 km", moons: "16", day: "16 hours", year: "165 Earth years", distance: "30.1 AU (~4.5 B km)", blurb: "The farthest planet, a deep-blue ice giant with the fastest winds in the solar system." },
];

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function orbitRadius(a: number) {
  return 6 + 26 * Math.sqrt(a / 30.069);
}
function longitudeDeg(p: Planet, days: number) {
  const l = p.l0 + (360 * days) / (p.periodYears * 365.25);
  return ((l % 360) + 360) % 360;
}

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * Math.PI * 2;
      pts.push([radius * Math.cos(t), 0, radius * Math.sin(t)]);
    }
    return pts;
  }, [radius]);
  return <Line points={points} color="#9fb4d6" lineWidth={1} transparent opacity={0.18} />;
}

function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial color="#ffcf5c" />
      </mesh>
      <pointLight intensity={3} distance={400} decay={0} color="#fff4d6" />
      <Html center distanceFactor={40} position={[0, 3.4, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap text-xs font-semibold text-amber-200">
          Sun
        </div>
      </Html>
    </group>
  );
}

function Bodies({
  playing,
  offsetRef,
  selected,
  onSelect,
}: {
  playing: boolean;
  offsetRef: React.MutableRefObject<number>;
  selected: string | null;
  onSelect: (p: Planet) => void;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const spins = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (playing) offsetRef.current += delta * 12;
    const days = (Date.now() - J2000) / 86_400_000 + offsetRef.current;
    PLANETS.forEach((p, i) => {
      const lon = (longitudeDeg(p, days) * Math.PI) / 180;
      const r = orbitRadius(p.a);
      const g = groups.current[i];
      if (g) g.position.set(r * Math.cos(lon), 0, -r * Math.sin(lon));
      const s = spins.current[i];
      if (s) s.rotation.y += delta * 0.6;
    });
  });

  return (
    <>
      {PLANETS.map((p, i) => (
        <group
          key={p.name}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh
            ref={(el) => {
              spins.current[i] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(p);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <sphereGeometry args={[p.size, 32, 32]} />
            <meshStandardMaterial color={p.color} roughness={0.85} metalness={0.1} />
          </mesh>

          {p.ring && (
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
              <ringGeometry args={[p.size * 1.4, p.size * 2.2, 64]} />
              <meshBasicMaterial color="#d9c9a0" side={THREE.DoubleSide} transparent opacity={0.55} />
            </mesh>
          )}

          {selected === p.name && (
            <mesh>
              <sphereGeometry args={[p.size * 1.35, 24, 24]} />
              <meshBasicMaterial color={p.color} wireframe transparent opacity={0.5} />
            </mesh>
          )}

          <Html center distanceFactor={42} position={[0, p.size + 1.1, 0]}>
            <div
              onClick={() => onSelect(p)}
              className="pointer-events-auto cursor-pointer select-none whitespace-nowrap text-[11px] font-semibold text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            >
              {p.name}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

export function SolarSystemScene() {
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Planet | null>(null);
  const [shownDate, setShownDate] = useState(() => new Date());
  const offsetRef = useRef(0);

  // Keep the displayed date roughly in sync with the simulated offset.
  useEffect(() => {
    const id = setInterval(() => {
      setShownDate(new Date(Date.now() + offsetRef.current * 86_400_000));
    }, 400);
    return () => clearInterval(id);
  }, []);

  const days = (shownDate.getTime() - J2000) / 86_400_000;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link href="/" className="text-sm text-brand-400 hover:underline">
        ← Back to globe
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            🪐 The Solar System
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            A 3D model of the eight planets at their real positions for the current date.
            Drag to orbit the camera, scroll to zoom, and click a planet to learn about it.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink-950 transition hover:bg-brand-400"
          >
            {playing ? "⏸ Pause" : "▶ Play orbits"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              offsetRef.current = 0;
              setShownDate(new Date());
            }}
            className="glass rounded-full px-4 py-2 font-semibold text-white transition hover:bg-white/10"
          >
            Today
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-400">
        Showing:{" "}
        <span className="font-semibold text-slate-200">
          {shownDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </span>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="card overflow-hidden p-0" style={{ height: "32rem" }}>
          <Canvas
            camera={{ position: [0, 26, 46], fov: 50 }}
            onPointerMissed={() => setSelected(null)}
            dpr={[1, 2]}
          >
            <color attach="background" args={["#05070f"]} />
            <ambientLight intensity={0.28} />
            <Stars radius={300} depth={60} count={6000} factor={4} saturation={0} fade speed={0.6} />
            <Sun />
            {PLANETS.map((p) => (
              <OrbitRing key={`o-${p.name}`} radius={orbitRadius(p.a)} />
            ))}
            <Bodies
              playing={playing}
              offsetRef={offsetRef}
              selected={selected?.name ?? null}
              onSelect={setSelected}
            />
            <OrbitControls
              enablePan={false}
              minDistance={10}
              maxDistance={120}
              autoRotate={!playing && !selected}
              autoRotateSpeed={0.3}
            />
          </Canvas>
        </div>

        <div>
          {selected ? (
            <div className="card">
              <div className="flex items-center gap-3">
                <span className="inline-block h-8 w-8 rounded-full" style={{ background: selected.color }} />
                <div>
                  <h2 className="text-xl font-semibold text-white">{selected.name}</h2>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Planet #{selected.order} · {selected.type}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="ml-auto text-sm text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{selected.blurb}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Diameter", selected.diameter],
                  ["Moons", selected.moons],
                  ["Distance from Sun", selected.distance],
                  ["Day length", selected.day],
                  ["Year length", selected.year],
                  ["Current position", `${longitudeDeg(selected, days).toFixed(0)}° · ${ZODIAC[Math.floor(longitudeDeg(selected, days) / 30) % 12]}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-white/[0.04] p-2.5">
                    <dt className="text-[11px] uppercase tracking-wider text-slate-400">{k}</dt>
                    <dd className="mt-0.5 font-medium text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="card">
              <h2 className="section-title">Order from the Sun</h2>
              <ul className="space-y-1.5">
                {PLANETS.map((p) => {
                  const lon = longitudeDeg(p, days);
                  return (
                    <li key={p.name}>
                      <button
                        onClick={() => setSelected(p)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.06]"
                      >
                        <span className="w-5 text-xs text-slate-500">{p.order}</span>
                        <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                        <span className="font-medium text-white">{p.name}</span>
                        <span className="ml-auto text-xs text-slate-400">
                          {lon.toFixed(0)}° · {ZODIAC[Math.floor(lon / 30) % 12]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                Orbit sizes are compressed to fit the view; the planets&apos; angular positions
                around the Sun are computed from real orbital data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
