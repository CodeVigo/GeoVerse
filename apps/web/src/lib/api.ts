// Tiny typed fetch helpers for talking to the GeoVerse API.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface GlobePoint {
  id: string;
  type: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  summary?: string | null;
  wiki?: string | null;
  country?: string | null;
  category?: string | null;
}

export interface RelatedEntity {
  relation: string;
  direction: "outgoing" | "incoming";
  id: string;
  type: string;
  name: string;
  slug: string;
  summary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
}

export interface Fact {
  id: string;
  tier: "MUST_KNOW" | "GOOD_TO_KNOW" | "EXPLORE_MORE";
  importance: number;
  difficulty: number;
  category: string | null;
  title: string;
  body: string;
  examTags: string[];
}

export interface EntityDetail {
  id: string;
  type: string;
  name: string;
  slug: string;
  summary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  metadata: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  facts: Fact[];
  memoryTricks: { id: string; title: string; trick: string; kind: string | null }[];
  pyqs: {
    id: string;
    exam: string;
    year: number | null;
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string | null;
  }[];
  related: RelatedEntity[];
}

async function getJson<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function getGlobePoints(opts?: { type?: string; featured?: boolean }) {
  const params = new URLSearchParams();
  if (opts?.type) params.set("type", opts.type);
  if (opts?.featured) params.set("featured", "true");
  const q = params.toString();
  return getJson<GlobePoint[]>(`/api/geo/points${q ? `?${q}` : ""}`);
}

export interface QuizQuestion {
  id: string;
  flag: string | null;
  wiki?: string | null;
  prompt: string;
  answer: string;
  options: string[];
  hook?: string | null;
}

export interface QuizResponse {
  type: string;
  scope: string;
  questions: QuizQuestion[];
  available: number;
}

export async function getQuiz(opts: { type: string; scope?: string; count?: number }) {
  const params = new URLSearchParams({ type: opts.type });
  if (opts.scope) params.set("scope", opts.scope);
  if (opts.count) params.set("count", String(opts.count));
  // Credentials so the API can personalise (weak/due items first) when logged in.
  const res = await fetch(`${API_URL}/api/quiz?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Quiz failed: ${res.status}`);
  return res.json() as Promise<QuizResponse>;
}

export interface DueCard {
  entityId: string;
  name: string;
  type: string;
  slug: string;
  summary: string | null;
  capital: string | null;
  continent: string | null;
  reps: number;
}

export function getDueCards() {
  return authFetch<{ items: DueCard[]; total: number }>("/api/quiz/due");
}

export function submitQuizAttempt(body: {
  items: { entityId: string; correct: boolean }[];
  quizType: string;
  mode?: string;
}) {
  return authFetch<{ awarded: number; xp: number; streakCount: number }>("/api/quiz/attempt", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface SearchResult {
  name: string;
  slug: string;
  type: string;
  summary: string | null;
  flag: string | null;
}

export function searchEntities(q: string) {
  return getJson<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`, 0);
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  xp: number;
  streakCount: number;
  preferredMode: "EXPLORE" | "EXAM";
}

// Auth calls run from the browser and must carry the httpOnly session cookie.
async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export function apiRegister(body: { email: string; password: string; displayName?: string }) {
  return authFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiLogin(body: { email: string; password: string }) {
  return authFetch<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiLogout() {
  return authFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function apiMe() {
  return authFetch<{ user: AuthUser }>("/api/auth/me");
}

export function apiUpdateMe(body: { preferredMode?: "EXPLORE" | "EXAM"; displayName?: string }) {
  return authFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getEntity(slug: string): Promise<EntityDetail | null> {
  try {
    return await getJson<EntityDetail>(`/api/entities/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}
