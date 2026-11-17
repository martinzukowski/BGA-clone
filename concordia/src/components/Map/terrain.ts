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
 * of an old trade chart. Fourteen clearly different hues, so that
 * `assignProvinceColors` can always find one that stands apart from every
 * neighbour.
 */
export const PROVINCE_PALETTE: readonly string[] = [
  '#c0583c', // terracotta
  '#2f7d79', // deep teal
  '#d4a23a', // ochre
  '#6a8a45', // olive
  '#8e4d7a', // plum
  '#4f7fa8', // steel blue
  '#c4787f', // dusty rose
  '#7a62a8', // violet
  '#d27a35', // burnt orange
  '#3f6b4a', // forest
  '#a33f5b', // raspberry
  '#3fa3a0', // turquoise
  '#a89a4a', // khaki
  '#4a4f94', // indigo
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
    light: mix(base, '#fff6e0', 0.34),
    dark: mix(base, '#140f08', 0.28),
    line: mix(base, '#140f08', 0.6),
  };
}

/** A cheap perceptual colour distance ("redmean"), good enough to rank palette entries. */
function colorDistance(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const rm = (x.r + y.r) / 2;
  const dr = x.r - y.r;
  const dg = x.g - y.g;
  const db = x.b - y.b;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

/**
 * Colours the provinces so that no two that touch look alike.
 *
 * Greedy graph colouring: the most-connected provinces choose first, and each
 * takes the palette entry whose *nearest* already-coloured neighbour is as far
 * away as possible. Ties go to whichever entry has been used least, so the
 * whole palette is spread across the board.
 */
export function assignProvinceColors(
  ids: readonly string[],
  neighbours: ReadonlyMap<string, ReadonlySet<string>>,
): Map<string, number> {
  const order = [...ids].sort(
    (a, b) => (neighbours.get(b)?.size ?? 0) - (neighbours.get(a)?.size ?? 0) || a.localeCompare(b),
  );
  const chosen = new Map<string, number>();
  const used = PROVINCE_PALETTE.map(() => 0);
  for (const id of order) {
    const around = [...(neighbours.get(id) ?? [])]
      .map((n) => chosen.get(n))
      .filter((c): c is number => c !== undefined);
    let best = 0;
    let bestScore = -Infinity;
    PROVINCE_PALETTE.forEach((hex, index) => {
      const gap = around.length
        ? Math.min(...around.map((c) => colorDistance(hex, PROVINCE_PALETTE[c]!)))
        : 1000;
      const score = gap - used[index]! * 40;
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    chosen.set(id, best);
    used[best]! += 1;
  }
  return chosen;
}

/* ───────────────────────────────────────────────── point-in-poly ── */

export function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    const intersects = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
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
