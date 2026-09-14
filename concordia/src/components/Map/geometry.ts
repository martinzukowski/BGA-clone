/**
 * Pure geometry for drawing the board.
 *
 * None of this is game logic — the rules never see a coordinate. It exists so
 * that a colonist animating along a route follows *exactly* the curve that is
 * drawn, and so province outlines can be derived from city positions rather
 * than hand-authored for every map.
 */

import type { CityDefinition, MapDefinition, RouteDefinition } from '../../game/engine/types';

export interface Point {
  x: number;
  y: number;
}

/* ─────────────────────────────────────────────────────── routes ── */

export interface RouteGeometry {
  readonly from: Point;
  readonly to: Point;
  /** Quadratic control point. */
  readonly control: Point;
  readonly path: string;
  readonly length: number;
}

/**
 * A route is a quadratic Bézier bowed perpendicular to the chord by
 * `route.curve`, so parallel land and sea links between the same two cities
 * never overlap.
 */
export function routeGeometry(route: RouteDefinition, cities: Record<string, CityDefinition>): RouteGeometry {
  const a = cities[route.from]!;
  const b = cities[route.to]!;
  const from = { x: a.x, y: a.y };
  const to = { x: b.x, y: b.y };
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = route.curve ?? 0;
  const control = { x: mx - (dy / len) * bow, y: my + (dx / len) * bow };
  return {
    from,
    to,
    control,
    path: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    length: approximateQuadraticLength(from, control, to),
  };
}

/** Point on the quadratic curve at parameter `t` ∈ [0, 1]. */
export function pointOnRoute(g: RouteGeometry, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * g.from.x + 2 * u * t * g.control.x + t * t * g.to.x,
    y: u * u * g.from.y + 2 * u * t * g.control.y + t * t * g.to.y,
  };
}

/** Unit tangent at `t`, used to point ships along their lane. */
export function tangentOnRoute(g: RouteGeometry, t: number): Point {
  const x = 2 * (1 - t) * (g.control.x - g.from.x) + 2 * t * (g.to.x - g.control.x);
  const y = 2 * (1 - t) * (g.control.y - g.from.y) + 2 * t * (g.to.y - g.control.y);
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function approximateQuadraticLength(a: Point, c: Point, b: Point, steps = 16): number {
  let total = 0;
  let prev = a;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const p = {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    };
    total += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return total;
}

/* ────────────────────────────────────────────────────── provinces ── */

/** Andrew's monotone chain. Returns the hull in counter-clockwise order. */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points.slice();
  const pts = points.slice().sort((p, q) => p.x - q.x || p.y - q.y);
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * The raw hull enclosing a province's cities, before smoothing — the shape
 * used both to draw the province and to keep scattered terrain decoration
 * (§terrain.ts) inside it.
 *
 * Each city contributes a ring of sample points, so the hull of the whole set
 * is a rounded blob that works for two cities as well as three — no special
 * cases, and no hand-authored polygons per map.
 */
export function provinceHull(points: Point[], radius = 52): Point[] {
  if (points.length === 0) return [];
  const samples: Point[] = [];
  const RING = 20;
  for (const p of points) {
    for (let i = 0; i < RING; i++) {
      const angle = (i / RING) * Math.PI * 2;
      samples.push({ x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * radius });
    }
  }
  return convexHull(samples);
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pseudoAt(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Perturbs a closed ring of points outward/inward from its centroid: a slow
 * three-lobed wobble for the big irregular sweep of a coastline, plus a
 * faster per-point jag for the small nicks and inlets. Both terms are seeded
 * off `seed`, so the same province always roughens the same way.
 */
export function jitterPolygon(points: readonly Point[], seed: string, amplitude: number): Point[] {
  if (amplitude <= 0 || points.length < 3) return points.slice();
  const c = centroid(points as Point[]);
  const n = points.length;
  const base = hashSeed(seed);
  const phase = (base % 1000) / 1000;
  return points.map((p, i) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const t = i / n;
    const lobe = Math.sin(t * Math.PI * 2 * 3 + phase * Math.PI * 2);
    const jag = pseudoAt(base + i * 97.13) * 2 - 1;
    const offset = amplitude * (lobe * 0.55 + jag * 0.45);
    return { x: p.x + ux * offset, y: p.y + uy * offset };
  });
}

/**
 * A soft, hand-drawn-looking outline enclosing a province's cities.
 *
 * With a `seed`, the hull is roughened first via `jitterPolygon` so every
 * province's coast reads as inked rather than plotted — without a seed it
 * stays a clean smoothed blob, for callers that want that.
 */
export function provinceOutline(
  points: Point[],
  radius = 52,
  seed?: string,
  roughness = 0,
): string {
  const hull = provinceHull(points, radius);
  if (hull.length === 0) return '';
  const rough = seed && roughness > 0 ? jitterPolygon(hull, seed, roughness) : hull;
  return smoothClosedPath(rough, 0.42);
}

/** Catmull-Rom through the points, emitted as a closed cubic Bézier path. */
export function smoothClosedPath(points: Point[], tension = 0.4): string {
  const n = points.length;
  if (n === 0) return '';
  if (n < 3) {
    return `M ${points[0]!.x} ${points[0]!.y}` + points.slice(1).map((p) => ` L ${p.x} ${p.y}`).join('') + ' Z';
  }
  const at = (i: number) => points[((i % n) + n) % n]!;
  let d = `M ${at(0).x.toFixed(2)} ${at(0).y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension * 2, y: p1.y + ((p2.y - p0.y) / 6) * tension * 2 };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension * 2, y: p2.y - ((p3.y - p1.y) / 6) * tension * 2 };
    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/* ────────────────────────────────────────── house arrangement ── */

/**
 * Where each house in a city sits, fanned around the settlement so that even
 * five of them never overlap (RULES §8 — several players may share a city).
 */
export function housePositions(count: number, radius = 19): Point[] {
  if (count <= 0) return [];
  const spread = Math.min(38 + count * 12, 150);
  const start = -90 - spread / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? -90 : start + (spread / (count - 1)) * i;
    const rad = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
  });
}

/* ───────────────────────────────────────────────── camera helpers ── */

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

/**
 * The transform that fits the map's *content* inside a `width × height`
 * viewport. Fitting the declared viewBox instead would leave a wide margin of
 * empty sea whenever the cities do not fill it.
 */
export function fitViewport(
  map: MapDefinition,
  width: number,
  height: number,
  padding = 40,
): Viewport {
  const bounds = contentBounds(map);
  const contentW = bounds.maxX - bounds.minX;
  const contentH = bounds.maxY - bounds.minY;
  const scale = Math.min(
    (width - padding * 2) / contentW,
    (height - padding * 2) / contentH,
  );
  return {
    scale,
    x: (width - contentW * scale) / 2 - bounds.minX * scale,
    y: (height - contentH * scale) / 2 - bounds.minY * scale,
  };
}

/** Bounding box of every city, grown by the land margin drawn around them. */
export function contentBounds(map: MapDefinition): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const xs = map.cities.map((c) => c.x);
  const ys = map.cities.map((c) => c.y);
  const margin = LAND_RADIUS + 34;
  return {
    minX: Math.min(...xs) - margin,
    minY: Math.min(...ys) - margin,
    maxX: Math.max(...xs) + margin,
    maxY: Math.max(...ys) + margin,
  };
}

/**
 * How much land is drawn around a city, and how wide the land is along a road.
 * These are the two numbers that decide whether the board reads as a continent
 * with an inland sea, or as a spindly web of islands.
 */
export const LAND_RADIUS = 44;
export const LAND_ROAD_WIDTH = 78;
export const LAND_CAPITAL_RADIUS = 56;
/** How far the coastline rim extends beyond the land itself. */
export const COAST_WIDTH = 9;

export function clampViewport(v: Viewport, min = 0.35, max = 3.2): Viewport {
  return { ...v, scale: Math.min(max, Math.max(min, v.scale)) };
}

/** Zoom about a fixed screen point, so the map does not slide under the cursor. */
export function zoomAt(v: Viewport, screenX: number, screenY: number, factor: number): Viewport {
  const next = clampViewport({ ...v, scale: v.scale * factor });
  const applied = next.scale / v.scale;
  return {
    scale: next.scale,
    x: screenX - (screenX - v.x) * applied,
    y: screenY - (screenY - v.y) * applied,
  };
}

export function cityMap(map: MapDefinition): Record<string, CityDefinition> {
  return Object.fromEntries(map.cities.map((c) => [c.id, c]));
}
