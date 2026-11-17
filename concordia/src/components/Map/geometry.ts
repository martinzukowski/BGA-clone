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

/* ───────────────────────────────────────────────────── hulls & centres ── */

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
  padding = 12,
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

/** Bounding box of every city, grown by a small margin of coast around them. */
export function contentBounds(map: MapDefinition): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const xs = map.cities.map((c) => c.x);
  const ys = map.cities.map((c) => c.y);
  return {
    minX: Math.min(...xs) - FIT_MARGIN,
    minY: Math.min(...ys) - FIT_MARGIN,
    maxX: Math.max(...xs) + FIT_MARGIN,
    maxY: Math.max(...ys) + FIT_MARGIN,
  };
}

/** Land to show beyond the outermost cities when the camera frames the whole board. */
const FIT_MARGIN = 52;
/** How far the coastline rim extends beyond the land itself. */
export const COAST_WIDTH = 9;

export function clampViewport(v: Viewport, min = 0.5, max = 3.2): Viewport {
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
