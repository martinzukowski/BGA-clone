/**
 * RULES §7 — the route graph, step generation and reachability.
 *
 * This module is the *only* place that understands how pieces travel. It sees an
 * adjacency graph and nothing else: no coordinates, no rendering, no React.
 */

import { getMap } from '../data/maps';
import type {
  CityId,
  Colonist,
  ColonistLocation,
  GameState,
  MapDefinition,
  RouteDefinition,
  RouteId,
  RouteType,
} from './types';

/* ─────────────────────────────────────────────────── graph indexing ── */

export interface MapIndex {
  readonly map: MapDefinition;
  readonly cityById: Readonly<Record<CityId, MapDefinition['cities'][number]>>;
  readonly routeById: Readonly<Record<RouteId, RouteDefinition>>;
  /** Routes incident to a city, split by type. */
  readonly routesAtCity: Readonly<Record<CityId, Readonly<Record<RouteType, readonly RouteId[]>>>>;
  /** Routes sharing an endpoint with this route, same type, excluding itself. */
  readonly adjacentRoutes: Readonly<Record<RouteId, readonly RouteId[]>>;
  readonly provinceOfCity: Readonly<Record<CityId, string | null>>;
}

const INDEX_CACHE = new Map<string, MapIndex>();

export function mapIndex(mapId: string): MapIndex {
  const cached = INDEX_CACHE.get(mapId);
  if (cached) return cached;

  const map = getMap(mapId);
  const cityById: Record<string, MapDefinition['cities'][number]> = {};
  const provinceOfCity: Record<string, string | null> = {};
  for (const c of map.cities) {
    cityById[c.id] = c;
    provinceOfCity[c.id] = c.provinceId;
  }

  const routeById: Record<string, RouteDefinition> = {};
  const routesAtCity: Record<string, { land: RouteId[]; sea: RouteId[] }> = {};
  for (const c of map.cities) routesAtCity[c.id] = { land: [], sea: [] };

  for (const r of map.routes) {
    if (routeById[r.id]) throw new Error(`Duplicate route id ${r.id} in map ${mapId}`);
    if (!cityById[r.from] || !cityById[r.to]) {
      throw new Error(`Route ${r.id} references an unknown city`);
    }
    routeById[r.id] = r;
    routesAtCity[r.from]![r.type].push(r.id);
    routesAtCity[r.to]![r.type].push(r.id);
  }

  const adjacentRoutes: Record<string, RouteId[]> = {};
  for (const r of map.routes) {
    const set = new Set<RouteId>();
    for (const cityId of [r.from, r.to]) {
      for (const other of routesAtCity[cityId]![r.type]) {
        if (other !== r.id) set.add(other);
      }
    }
    adjacentRoutes[r.id] = [...set].sort();
  }

  const index: MapIndex = { map, cityById, routeById, routesAtCity, adjacentRoutes, provinceOfCity };
  INDEX_CACHE.set(mapId, index);
  return index;
}

export function routeEndpoints(idx: MapIndex, routeId: RouteId): [CityId, CityId] {
  const r = idx.routeById[routeId];
  if (!r) throw new Error(`Unknown route ${routeId}`);
  return [r.from, r.to];
}

/** The cities a colonist stands beside — where it can build (RULES 8.1). */
export function adjacentCities(idx: MapIndex, location: ColonistLocation): CityId[] {
  if (location.kind === 'city') return [location.cityId];
  const [a, b] = routeEndpoints(idx, location.routeId);
  return [a, b];
}

/* ────────────────────────────────────────────────────── occupancy ── */

/** RULES 3.3 / 7.6 — at most one colonist may rest on a route. */
export function occupiedRoutes(state: GameState, ignoreColonistId?: string): Set<RouteId> {
  const out = new Set<RouteId>();
  for (const c of state.colonists) {
    if (c.id === ignoreColonistId) continue;
    if (c.location.kind === 'route') out.add(c.location.routeId);
  }
  return out;
}

export function routeOccupant(state: GameState, routeId: RouteId): Colonist | undefined {
  return state.colonists.find((c) => c.location.kind === 'route' && c.location.routeId === routeId);
}

/* ──────────────────────────────────────────────────── reachability ── */

export interface Destination {
  readonly routeId: RouteId;
  /** Number of steps consumed — the length of `path` (RULES 7.2). */
  readonly steps: number;
  /** Routes traversed, in order. The last element is `routeId`. */
  readonly path: readonly RouteId[];
}

/**
 * Every route a colonist could *finish* on, given `maxSteps`.
 *
 * Traversal may pass through occupied routes (each still costs a step); only the
 * final route must be free (RULES 7.6). Breadth-first, so each destination is
 * reached by a shortest path — which is also the cheapest.
 *
 * Deterministic: routes are visited in sorted id order.
 */
export function reachableDestinations(
  state: GameState,
  colonist: Colonist,
  maxSteps: number,
): Destination[] {
  if (maxSteps <= 0) return [];
  const idx = mapIndex(state.mapId);
  const blocked = occupiedRoutes(state, colonist.id);

  const firstRoutes: RouteId[] =
    colonist.location.kind === 'city'
      ? [...(idx.routesAtCity[colonist.location.cityId]?.[colonist.type] ?? [])].sort()
      : [...(idx.adjacentRoutes[colonist.location.routeId] ?? [])].sort();

  const bestPath = new Map<RouteId, RouteId[]>();
  let frontier: RouteId[] = [];

  for (const r of firstRoutes) {
    if (!bestPath.has(r)) {
      bestPath.set(r, [r]);
      frontier.push(r);
    }
  }

  for (let depth = 1; depth < maxSteps && frontier.length > 0; depth++) {
    const next: RouteId[] = [];
    for (const from of frontier) {
      const path = bestPath.get(from)!;
      for (const to of idx.adjacentRoutes[from] ?? []) {
        if (bestPath.has(to)) continue;
        bestPath.set(to, [...path, to]);
        next.push(to);
      }
    }
    frontier = next.sort();
  }

  const out: Destination[] = [];
  for (const [routeId, path] of bestPath) {
    if (blocked.has(routeId)) continue;
    out.push({ routeId, steps: path.length, path });
  }
  out.sort((a, b) => (a.steps - b.steps) || a.routeId.localeCompare(b.routeId));
  return out;
}

/* ───────────────────────────────────────────────── path validation ── */

export type PathError =
  | 'empty-path'
  | 'unknown-route'
  | 'wrong-route-type'
  | 'not-connected'
  | 'backtrack'
  | 'destination-occupied';

/**
 * Checks a caller-supplied path against RULES 7.2, 7.3, 7.5 and 7.6.
 * Returns `null` when the path is legal.
 */
export function validatePath(
  state: GameState,
  colonist: Colonist,
  path: readonly RouteId[],
): PathError | null {
  if (path.length === 0) return 'empty-path';
  const idx = mapIndex(state.mapId);
  const blocked = occupiedRoutes(state, colonist.id);

  for (const rid of path) {
    const r = idx.routeById[rid];
    if (!r) return 'unknown-route';
    if (r.type !== colonist.type) return 'wrong-route-type';
  }

  // First step: out of the starting city, or off the starting route.
  const first = path[0]!;
  if (colonist.location.kind === 'city') {
    const allowed = idx.routesAtCity[colonist.location.cityId]?.[colonist.type] ?? [];
    if (!allowed.includes(first)) return 'not-connected';
  } else {
    if (first === colonist.location.routeId) return 'backtrack';
    if (!(idx.adjacentRoutes[colonist.location.routeId] ?? []).includes(first)) return 'not-connected';
  }

  // Subsequent steps: through a shared city onto a different route.
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]!;
    const cur = path[i]!;
    if (prev === cur) return 'backtrack';
    if (!(idx.adjacentRoutes[prev] ?? []).includes(cur)) return 'not-connected';
  }

  if (blocked.has(path[path.length - 1]!)) return 'destination-occupied';
  return null;
}

/* ───────────────────────────────────────────────────── movement fx ── */

/** Returns a new colonist array with `colonistId` relocated. Pure. */
export function relocateColonist(
  state: GameState,
  colonistId: string,
  location: ColonistLocation,
): readonly Colonist[] {
  return state.colonists.map((c) => (c.id === colonistId ? { ...c, location } : c));
}

/**
 * Cities where `playerId` could legally build right now (RULES 8.1), before
 * affordability is considered. Sorted for determinism.
 */
export function buildableCities(state: GameState, playerId: number): CityId[] {
  const idx = mapIndex(state.mapId);
  const out = new Set<CityId>();
  for (const c of state.colonists) {
    if (c.owner !== playerId) continue;
    for (const cityId of adjacentCities(idx, c.location)) {
      const city = idx.cityById[cityId];
      if (!city || city.isCapital) continue; // RULES 8.7
      if ((state.houses[cityId] ?? []).includes(playerId)) continue; // RULES 8.5
      out.add(cityId);
    }
  }
  return [...out].sort();
}
