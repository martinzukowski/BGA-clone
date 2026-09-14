/**
 * Deterministic decoration: per-province colour, rough hand-drawn edges, and
 * scattered terrain glyphs (mountains, pines, palms, waves).
 *
 * Everything here is a pure function of stable inputs (a province id, a city
 * id, a point index) — never `Math.random()` — so the map looks the same on
 * every render and every machine, and two provinces never fight for the same
 * jitter.
 */

import type { Point } from './geometry';

/* ─────────────────────────────────────────────────── determinism ── */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable pseudo-random value in [0, 1) for any integer. */
function pseudo(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function noiseAt(seed: string, i: number): number {
  return pseudo(hashString(seed) + i * 97.13);
}

/* ──────────────────────────────────────────────────── colour ─────  */

/**
 * A qualitative palette for provinces — muted, painterly hues in the register
 * of an old trade chart, chosen so neighbours in a typical geographic
 * ordering rarely repeat. Assigned by province index, not by terrain, so a
 * mountain province and its coastal neighbour are never the same colour by
 * accident.
 */
export const PROVINCE_PALETTE: readonly string[] = [
  '#b5533a', // terracotta
  '#4c6b7a', // steel blue
  '#c79a3d', // ochre
  '#5c7a4e', // olive
  '#8a4f6b', // plum
  '#3d7a72', // teal
  '#a4632f', // sienna
  '#6a5a8a', // slate lavender
  '#b08a3f', // mustard
  '#6f8f6a', // sage
  '#9a4a4a', // brick red
  '#4a6a8a', // denim
  '#8a6a3a', // tan
  '#5a7a8a', // slate teal
];

export function provinceColor(index: number): string {
  return PROVINCE_PALETTE[index % PROVINCE_PALETTE.length]!;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.r + (b.r - a.r) * amount, a.g + (b.g - a.g) * amount, a.b + (b.b - a.b) * amount);
}

/** Light and dark stops for a province's fill gradient, from its base hue. */
export function provinceTint(base: string): { light: string; dark: string; line: string } {
  return {
    light: mix(base, '#fff6e0', 0.5),
    dark: mix(base, '#140f08', 0.42),
    line: mix(base, '#140f08', 0.62),
  };
}

/* ───────────────────────────────────────────────── point-in-poly ── */

function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    const intersects = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Scatters `count` points inside `hull`, keeping clear of `avoid` (city
 * markers, mainly) and of each other. Deterministic per `seed`; a province's
 * trees are always in the same clearing.
 */
export function scatterPoints(
  hull: readonly Point[],
  seed: string,
  count: number,
  avoid: readonly Point[],
  minDistFromAvoid = 40,
  minDistFromEachOther = 26,
): Point[] {
  if (hull.length < 3 || count <= 0) return [];
  const bounds = hull.reduce(
    (b, p) => ({
      minX: Math.min(b.minX, p.x),
      maxX: Math.max(b.maxX, p.x),
      minY: Math.min(b.minY, p.y),
      maxY: Math.max(b.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const out: Point[] = [];
  let i = 0;
  let guard = 0;
  const base = hashString(seed);
  while (out.length < count && guard < count * 40) {
    guard++;
    const rx = pseudo(base + i * 131.7 + 11);
    const ry = pseudo(base + i * 131.7 + 53.9);
    i++;
    const x = bounds.minX + rx * (bounds.maxX - bounds.minX);
    const y = bounds.minY + ry * (bounds.maxY - bounds.minY);
    const point = { x, y };
    if (!pointInPolygon(point, hull)) continue;
    if (avoid.some((a) => Math.hypot(a.x - x, a.y - y) < minDistFromAvoid)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < minDistFromEachOther)) continue;
    out.push(point);
  }
  return out;
}

/* ────────────────────────────────────────────────── city variety ── */

export type CityVariant = 'capital' | 'port' | 'hillfort' | 'oasis' | 'town' | 'village';

/**
 * Which settlement glyph a city gets. Coastal cities always read as ports
 * (a pier belongs by the water); inland cities vary by their province's
 * terrain, with a per-city coin flip between a walled town and a looser
 * village so even two food-producing inland cities don't look identical.
 */
export function cityVariant(
  cityId: string,
  isCapital: boolean,
  coastal: boolean,
  terrain: string | undefined,
): CityVariant {
  if (isCapital) return 'capital';
  if (coastal) return 'port';
  if (terrain === 'mountain') return 'hillfort';
  if (terrain === 'desert') return 'oasis';
  return noiseAt(cityId, 3) < 0.5 ? 'town' : 'village';
}

/* ─────────────────────────────────────────── terrain decoration ── */

export type TerrainKind = 'mountain' | 'desert' | 'inland' | 'coast' | 'island';

export function decorationCountFor(terrain: TerrainKind | undefined): number {
  switch (terrain) {
    case 'mountain':
      return 4;
    case 'desert':
      return 3;
    case 'inland':
      return 5;
    case 'coast':
      return 3;
    case 'island':
      return 3;
    default:
      return 2;
  }
}

export { hashString, noiseAt, pseudo };
