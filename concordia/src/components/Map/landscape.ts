/**
 * The ground under the board: continents, provinces and their borders.
 *
 * Everything here is presentation. The rules only ever see the city/route
 * graph; this module turns city positions plus a hand-authored coastline into
 * the paths the board paints. It is deterministic — no `Math.random()` — so the
 * map is the same on every render and every machine.
 *
 *  - **Coasts** are authored as coarse control rings (`coastlines.ts`) and then
 *    roughened by midpoint displacement, which is what gives them their jagged,
 *    fractal edge.
 *  - **Provinces** are a Voronoi partition of the cities. Every point of land
 *    belongs to exactly one province, so two provinces can never overlap; the
 *    borders between them are wobbled with noise that depends only on the pair
 *    of cities, so the two sides of a border always agree.
 */

import type { MapDefinition } from '../../game/engine/types';
import { COASTLINES, type CoastRing } from './coastlines';
import { centroid, convexHull, cityMap, pointOnRoute, routeGeometry, type Point } from './geometry';
import {
  assignProvinceColors,
  decorationCountFor,
  hashString,
  pointInPolygon,
  pseudo,
  type TerrainKind,
} from './terrain';

/* ─────────────────────────────────────────────────────────── output ── */

export interface LandProvince {
  readonly id: string;
  /** Even-odd-safe compound path of every Voronoi cell the province owns. */
  readonly path: string;
  /** Index into `PROVINCE_PALETTE`, chosen so neighbouring provinces differ. */
  readonly colorIndex: number;
  readonly centre: Point;
}

export interface Decoration {
  readonly provinceId: string;
  readonly terrain: TerrainKind | undefined;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface Landscape {
  /** Every landmass, with the inland seas cut out. Fill with `evenodd`. */
  readonly landPath: string;
  readonly provinces: readonly LandProvince[];
  /** The capital's own district — it belongs to no province. */
  readonly capitalPath: string;
  /** Only the borders *between* provinces; shared edges inside one are omitted. */
  readonly borderPath: string;
  readonly decorations: readonly Decoration[];
  /** Spots of open water that get a small wave mark. */
  readonly seaMarks: readonly Point[];
  /** Where each province's name is lettered — clear, dry land inside the province. */
  readonly labels: ReadonlyMap<string, Point>;
  readonly contains: (p: Point) => boolean;
}

/* ────────────────────────────────────────────────────── determinism ── */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ──────────────────────────────────────────────────────── coastlines ── */

/** How hard the authored rings are roughened. */
const COAST_ROUGHNESS = 0.15;
const COAST_DECAY = 0.57;
/** Edges are subdivided until they are about this long. */
const COAST_DETAIL = 8;

/**
 * Midpoint displacement: split every edge at its middle, push the new point
 * sideways by a random amount, and repeat on each half with a smaller push.
 * The result keeps the authored silhouette but breaks every straight run into
 * bays, headlands and skerries at every scale.
 */
function roughenRing(ring: CoastRing, seed: string): Point[] {
  const out: Point[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    const from = { x: a[0], y: a[1] };
    const to = { x: b[0], y: b[1] };
    // An optional third number scales the roughness of the edge leaving this
    // vertex; 0 leaves it straight (used for the far edges of the world).
    const factor = a.length > 2 ? (a[2] as number) : 1;
    out.push(from);
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    if (factor <= 0 || len < COAST_DETAIL * 1.5) continue;
    const depth = Math.min(7, Math.max(1, Math.ceil(Math.log2(len / COAST_DETAIL))));
    const rand = mulberry32(hashString(`${seed}:${i}`));
    subdivide(from, to, depth, len * COAST_ROUGHNESS * factor, rand, out);
  }
  return out;
}

function subdivide(
  a: Point,
  b: Point,
  level: number,
  amplitude: number,
  rand: () => number,
  out: Point[],
): void {
  if (level === 0) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const push = (rand() * 2 - 1) * amplitude;
  const mid = {
    x: (a.x + b.x) / 2 - (dy / len) * push,
    y: (a.y + b.y) / 2 + (dx / len) * push,
  };
  subdivide(a, mid, level - 1, amplitude * COAST_DECAY, rand, out);
  out.push(mid);
  subdivide(mid, b, level - 1, amplitude * COAST_DECAY, rand, out);
}

/** When a map has no authored coastline, a single rounded landmass around every city. */
function fallbackCoast(map: MapDefinition): { land: CoastRing[]; seas: CoastRing[] } {
  const samples: Point[] = [];
  for (const c of map.cities) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      samples.push({ x: c.x + Math.cos(a) * 90, y: c.y + Math.sin(a) * 90 });
    }
  }
  return { land: [convexHull(samples).map((p) => [p.x, p.y] as const)], seas: [] };
}

function ringPath(ring: readonly Point[]): string {
  return ring.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('') + 'Z';
}

/** Even-odd containment across every ring, so a sea ring inside a landmass reads as a hole. */
function makeContains(rings: readonly Point[][]): (p: Point) => boolean {
  const boxes = rings.map((ring) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of ring) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  });
  return (p) => {
    let inside = false;
    for (let i = 0; i < rings.length; i++) {
      const b = boxes[i]!;
      if (p.x < b.minX || p.x > b.maxX || p.y < b.minY || p.y > b.maxY) continue;
      if (pointInPolygon(p, rings[i]!)) inside = !inside;
    }
    return inside;
  };
}

/* ───────────────────────────────────────────────────────── voronoi ── */

interface CellVertex {
  readonly p: Point;
  /** The neighbouring site across the edge that leaves this vertex; -1 for the frame. */
  readonly tag: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Keeps the half of `poly` closer to `s` than to `t`. */
function clipToSite(poly: CellVertex[], s: Point, t: Point, tag: number): CellVertex[] {
  const mx = (s.x + t.x) / 2;
  const my = (s.y + t.y) / 2;
  const nx = t.x - s.x;
  const ny = t.y - s.y;
  const side = (p: Point) => (p.x - mx) * nx + (p.y - my) * ny;
  const out: CellVertex[] = [];
  for (let k = 0; k < poly.length; k++) {
    const cur = poly[k]!;
    const nxt = poly[(k + 1) % poly.length]!;
    const fc = side(cur.p);
    const fn = side(nxt.p);
    const curIn = fc <= 0;
    const nxtIn = fn <= 0;
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      const u = fc / (fc - fn);
      const hit = { x: cur.p.x + (nxt.p.x - cur.p.x) * u, y: cur.p.y + (nxt.p.y - cur.p.y) * u };
      out.push({ p: hit, tag: curIn ? tag : cur.tag });
    }
  }
  return out;
}

function voronoiCells(sites: readonly Point[], b: Bounds): CellVertex[][] {
  return sites.map((s, i) => {
    let poly: CellVertex[] = [
      { p: { x: b.minX, y: b.minY }, tag: -1 },
      { p: { x: b.maxX, y: b.minY }, tag: -1 },
      { p: { x: b.maxX, y: b.maxY }, tag: -1 },
      { p: { x: b.minX, y: b.maxY }, tag: -1 },
    ];
    for (let j = 0; j < sites.length && poly.length >= 3; j++) {
      if (j !== i) poly = clipToSite(poly, s, sites[j]!, j);
    }
    return poly;
  });
}

/* ───────────────────────────────────────────────── border wobble ── */

const BORDER_STEP = 7;
const BORDER_TAPER = 20;
/** wavelength, amplitude — summed, so a border has slow sweeps and small nicks. */
const BORDER_OCTAVES: readonly (readonly [number, number])[] = [
  [130, 9],
  [56, 5.5],
  [24, 3.2],
  [11, 1.6],
];

function valueNoise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = pseudo(seed + i * 17.31) * 2 - 1;
  const b = pseudo(seed + (i + 1) * 17.31) * 2 - 1;
  return a + (b - a) * u;
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/**
 * The wobbled version of the straight Voronoi edge `a → b` between sites
 * `i` and `j`. The wobble is a function of the position along the *bisector*
 * and of the (unordered) pair of sites — never of the edge's own endpoints —
 * so the cell on either side computes exactly the same line.
 */
function wobbledEdge(
  sites: readonly Point[],
  keys: readonly string[],
  i: number,
  j: number,
  a: Point,
  b: Point,
): Point[] {
  const lo = Math.min(i, j);
  const hi = Math.max(i, j);
  const sl = sites[lo]!;
  const sh = sites[hi]!;
  const nl = Math.hypot(sh.x - sl.x, sh.y - sl.y) || 1;
  const n = { x: (sh.x - sl.x) / nl, y: (sh.y - sl.y) / nl };
  const d = { x: -n.y, y: n.x };
  const mid = { x: (sl.x + sh.x) / 2, y: (sl.y + sh.y) / 2 };
  const along = (p: Point) => (p.x - mid.x) * d.x + (p.y - mid.y) * d.y;

  const sa = along(a);
  const sb = along(b);
  const sMin = Math.min(sa, sb);
  const sMax = Math.max(sa, sb);
  const seed = hashString(`${keys[lo]}|${keys[hi]}`);

  const knots: Point[] = [];
  for (let k = Math.ceil((sMin + 0.5) / BORDER_STEP); k * BORDER_STEP < sMax - 0.5; k++) {
    const s = k * BORDER_STEP;
    let wobble = 0;
    for (let o = 0; o < BORDER_OCTAVES.length; o++) {
      const [wavelength, amp] = BORDER_OCTAVES[o]!;
      wobble += valueNoise(seed + o * 101, s / wavelength) * amp;
    }
    // Vertices are shared by three cells, so they must not move: ease the
    // wobble in from each end.
    wobble *= smooth((s - sMin) / BORDER_TAPER) * smooth((sMax - s) / BORDER_TAPER);
    knots.push({ x: mid.x + d.x * s + n.x * wobble, y: mid.y + d.y * s + n.y * wobble });
  }
  return sa <= sb ? [a, ...knots, b] : [a, ...knots.reverse(), b];
}

/* ──────────────────────────────────────────────────────────── build ── */

const CAPITAL_KEY = '·capital';

const cache = new Map<string, Landscape>();

export function buildLandscape(map: MapDefinition): Landscape {
  const hit = cache.get(map.id);
  if (hit) return hit;
  const built = construct(map);
  cache.set(map.id, built);
  return built;
}

function construct(map: MapDefinition): Landscape {
  /* ── coast ───────────────────────────────────────────────── */
  const coast = COASTLINES[map.id] ?? fallbackCoast(map);
  const landRings = coast.land.map((ring, i) => roughenRing(ring, `${map.id}:land${i}`));
  const seaRings = coast.seas.map((ring, i) => roughenRing(ring, `${map.id}:sea${i}`));
  const allRings = [...landRings, ...seaRings];
  const landPath = allRings.map(ringPath).join('');
  const contains = makeContains(allRings);

  /* ── frame for the Voronoi cells: just bigger than all the land ── */
  const frame: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const ring of allRings) {
    for (const p of ring) {
      frame.minX = Math.min(frame.minX, p.x);
      frame.minY = Math.min(frame.minY, p.y);
      frame.maxX = Math.max(frame.maxX, p.x);
      frame.maxY = Math.max(frame.maxY, p.y);
    }
  }
  frame.minX -= 80;
  frame.minY -= 80;
  frame.maxX += 80;
  frame.maxY += 80;

  /* ── provinces ───────────────────────────────────────────── */
  const sites = map.cities.map((c) => ({ x: c.x, y: c.y }));
  const keys = map.cities.map((c) => c.provinceId ?? CAPITAL_KEY);
  const cells = voronoiCells(sites, frame);

  const paths = new Map<string, string>();
  const borderParts: string[] = [];
  const neighbours = new Map<string, Set<string>>();

  cells.forEach((cell, i) => {
    const key = keys[i]!;
    const ring: Point[] = [];
    for (let k = 0; k < cell.length; k++) {
      const v = cell[k]!;
      const w = cell[(k + 1) % cell.length]!;
      ring.push(v.p);
      if (v.tag < 0 || keys[v.tag] === key) continue;

      const line = wobbledEdge(sites, keys, i, v.tag, v.p, w.p);
      for (let m = 1; m < line.length - 1; m++) ring.push(line[m]!);

      // Draw each border once, and note which provinces touch on dry land.
      if (v.tag > i) {
        borderParts.push(
          line.map((p, m) => `${m === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(''),
        );
      }
      const other = keys[v.tag]!;
      if (key !== CAPITAL_KEY && other !== CAPITAL_KEY && line.some((p) => contains(p))) {
        if (!neighbours.has(key)) neighbours.set(key, new Set());
        if (!neighbours.has(other)) neighbours.set(other, new Set());
        neighbours.get(key)!.add(other);
        neighbours.get(other)!.add(key);
      }
    }
    paths.set(key, (paths.get(key) ?? '') + ringPath(ring));
  });

  const provinceIds = map.provinces.map((p) => p.id);
  const colorIndices = assignProvinceColors(provinceIds, neighbours);
  const cityById = cityMap(map);
  const provinces: LandProvince[] = map.provinces.map((p) => ({
    id: p.id,
    path: paths.get(p.id) ?? '',
    colorIndex: colorIndices.get(p.id) ?? 0,
    centre: centroid(p.cityIds.map((id) => ({ x: cityById[id]!.x, y: cityById[id]!.y }))),
  }));

  /* ── roads, sampled — decoration keeps clear of them ───────── */
  const roadPoints: Point[] = [];
  for (const route of map.routes) {
    const g = routeGeometry(route, cityById);
    const steps = Math.max(2, Math.ceil(g.length / 14));
    for (let s = 0; s <= steps; s++) roadPoints.push(pointOnRoute(g, s / steps));
  }
  const landRoadPoints: Point[] = [];
  for (const route of map.routes) {
    if (route.type !== 'land') continue;
    const g = routeGeometry(route, cityById);
    const steps = Math.max(2, Math.ceil(g.length / 30));
    for (let s = 0; s <= steps; s++) landRoadPoints.push(pointOnRoute(g, s / steps));
  }

  /* ── terrain glyphs ──────────────────────────────────────── */
  const siteKey = (p: Point): string => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < sites.length; i++) {
      const d = (sites[i]!.x - p.x) ** 2 + (sites[i]!.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return keys[best]!;
  };

  const decorations: Decoration[] = [];
  for (const province of map.provinces) {
    const own = province.cityIds.map((id) => ({ x: cityById[id]!.x, y: cityById[id]!.y }));
    const anchors = [...own, ...landRoadPoints.filter((p) => siteKey(p) === province.id)];
    const target = Math.round(decorationCountFor(province.terrain as TerrainKind) * 1.7);
    const base = hashString(`${province.id}:deco`);
    const placed: Point[] = [];
    for (let attempt = 0; placed.length < target && attempt < target * 60; attempt++) {
      // Candidates start beside a random anchor, so glyphs hug the roads.
      const anchor = anchors[Math.floor(pseudo(base + attempt * 3.7) * anchors.length)]!;
      const angle = pseudo(base + attempt * 5.3 + 1) * Math.PI * 2;
      const dist = 34 + pseudo(base + attempt * 7.9 + 2) * 78;
      const p = { x: anchor.x + Math.cos(angle) * dist, y: anchor.y + Math.sin(angle) * dist };
      if (!contains(p) || siteKey(p) !== province.id) continue;
      if (!contains({ x: p.x + 14, y: p.y }) || !contains({ x: p.x - 14, y: p.y })) continue;
      if (sites.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < 46)) continue;
      if (roadPoints.some((r) => Math.hypot(r.x - p.x, r.y - p.y) < 20)) continue;
      if (placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 36)) continue;
      placed.push(p);
    }
    placed.forEach((p, j) =>
      decorations.push({
        provinceId: province.id,
        terrain: province.terrain as TerrainKind | undefined,
        x: p.x,
        y: p.y,
        scale: 0.9 + ((j * 37) % 5) * 0.07,
      }),
    );
  }

  /* ── where each province's name (and bonus marker) sits ──────
     The roomiest bit of its own, dry, coloured land: far from cities and
     roads, with level ground either side for the lettering, and as close to
     the middle of the province as that allows. */
  const labels = new Map<string, Point>();
  for (const province of map.provinces) {
    const own = province.cityIds.map((id) => ({ x: cityById[id]!.x, y: cityById[id]!.y }));
    const middle = centroid(own);
    const reach = [...own, ...landRoadPoints];
    let best: { p: Point; score: number } | null = null;
    for (let y = middle.y - 150; y <= middle.y + 150; y += 10) {
      for (let x = middle.x - 190; x <= middle.x + 190; x += 10) {
        const p = { x, y };
        if (!contains(p) || siteKey(p) !== province.id) continue;
        if (!contains({ x: x - 70, y }) || !contains({ x: x + 70, y })) continue;
        if (!contains({ x, y: y + 34 }) || !contains({ x, y: y - 16 })) continue;
        let wash = Infinity;
        for (const r of reach) wash = Math.min(wash, Math.hypot(r.x - x, r.y - y));
        if (wash > 78) continue;
        let clear = Infinity;
        for (const s of sites) clear = Math.min(clear, Math.hypot(s.x - x, s.y - y));
        for (const r of roadPoints) clear = Math.min(clear, Math.hypot(r.x - x, r.y - y) * 1.35);
        const score = Math.min(clear, 70) - Math.hypot(x - middle.x, y - middle.y) * 0.18;
        if (!best || score > best.score) best = { p, score };
      }
    }
    labels.set(province.id, best?.p ?? { x: middle.x, y: middle.y - 40 });
  }

  /* ── wave marks in open water ────────────────────────────── */
  const seaMarks: Point[] = [];
  const seaBase = hashString(`${map.id}:sea`);
  const near = (p: Point, pts: readonly Point[], r: number) => pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < r);
  const xs = sites.map((s) => s.x);
  const ys = sites.map((s) => s.y);
  const left = Math.min(...xs) - 40;
  const top = Math.min(...ys) - 40;
  const width = Math.max(...xs) + 40 - left;
  const height = Math.max(...ys) + 40 - top;
  for (let attempt = 0; seaMarks.length < 46 && attempt < 900; attempt++) {
    const p = {
      x: left + pseudo(seaBase + attempt * 2.3) * width,
      y: top + pseudo(seaBase + attempt * 2.3 + 9) * height,
    };
    if (contains(p)) continue;
    // Keep off the coast (so marks never touch land) and off sea lanes.
    let clear = true;
    for (let a = 0; a < 8 && clear; a++) {
      const ang = (a / 8) * Math.PI * 2;
      if (contains({ x: p.x + Math.cos(ang) * 30, y: p.y + Math.sin(ang) * 30 })) clear = false;
    }
    if (!clear || near(p, roadPoints, 26) || near(p, seaMarks, 70)) continue;
    seaMarks.push(p);
  }

  return {
    landPath,
    provinces,
    capitalPath: paths.get(CAPITAL_KEY) ?? '',
    borderPath: borderParts.join(''),
    decorations,
    seaMarks,
    labels,
    contains,
  };
}
