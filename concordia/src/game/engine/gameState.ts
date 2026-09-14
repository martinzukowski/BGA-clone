/**
 * State constructors, derived queries and the invariant checker.
 *
 * `validateState` is the engine's safety net: every test asserts it after every
 * action, and the AI simulation harness asserts it after every AI turn. If a
 * rule implementation ever corrupts the state, this is what says so.
 */

import { getMap } from '../data/maps';
import {
  GOODS,
  HOUSES_PER_PLAYER,
  MAX_COLONISTS_ON_BOARD,
  STOREHOUSE_CAPACITY,
} from '../data/ruleConstants';
import type {
  CityId,
  Colonist,
  ColonistType,
  GameState,
  Good,
  GoodsBag,
  MapDefinition,
  PlayerId,
  PlayerState,
  ProvinceId,
} from './types';

/* ─────────────────────────────────────────────────────── goods bags ── */

export function emptyGoods(): GoodsBag {
  return { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };
}

export function cloneGoods(bag: GoodsBag): GoodsBag {
  return { brick: bag.brick, food: bag.food, tool: bag.tool, wine: bag.wine, cloth: bag.cloth };
}

export function totalGoods(bag: GoodsBag): number {
  return bag.brick + bag.food + bag.tool + bag.wine + bag.cloth;
}

export function goodsToList(bag: GoodsBag): Good[] {
  const out: Good[] = [];
  for (const g of GOODS) for (let i = 0; i < bag[g]; i++) out.push(g);
  return out;
}

/* ───────────────────────────────────────────────────── storehouse ── */

/** RULES 10.3 — colonists still in the storehouse occupy spaces too. */
export function storageUsed(p: PlayerState): number {
  return totalGoods(p.goods) + p.reserveColonists.land + p.reserveColonists.sea;
}

export function freeStorage(p: PlayerState): number {
  return Math.max(0, STOREHOUSE_CAPACITY - storageUsed(p));
}

/* ────────────────────────────────────────────────── simple lookups ── */

export function getPlayer(state: GameState, id: PlayerId): PlayerState {
  const p = state.players[id];
  if (!p) throw new Error(`No such player: ${id}`);
  return p;
}

export function currentPlayer(state: GameState): PlayerState {
  return getPlayer(state, state.currentPlayer);
}

export function stateMap(state: GameState): MapDefinition {
  return getMap(state.mapId);
}

export function colonistsOf(state: GameState, playerId: PlayerId): Colonist[] {
  return state.colonists.filter((c) => c.owner === playerId);
}

export function colonistById(state: GameState, id: string): Colonist | undefined {
  return state.colonists.find((c) => c.id === id);
}

/** Cities where the player owns a house. */
export function citiesOf(state: GameState, playerId: PlayerId): CityId[] {
  const out: CityId[] = [];
  for (const cityId of Object.keys(state.houses)) {
    if (state.houses[cityId]!.includes(playerId)) out.push(cityId);
  }
  return out.sort();
}

export function houseCount(state: GameState, playerId: PlayerId): number {
  return citiesOf(state, playerId).length;
}

export function housesInCity(state: GameState, cityId: CityId): readonly PlayerId[] {
  return state.houses[cityId] ?? [];
}

/** `undefined` for the capital, which produces nothing (RULES 3.1). */
export function cityGood(state: GameState, cityId: CityId): Good | undefined {
  return state.cityGoods[cityId];
}

/** Provinces where the player owns at least one house (RULES 16.3). */
export function provincesOf(state: GameState, playerId: PlayerId): ProvinceId[] {
  const map = stateMap(state);
  const seen = new Set<ProvinceId>();
  for (const cityId of citiesOf(state, playerId)) {
    const city = map.cities.find((c) => c.id === cityId);
    if (city?.provinceId) seen.add(city.provinceId);
  }
  return [...seen].sort();
}

/** Distinct goods types produced by the player's houses (RULES 16.4). */
export function producedGoodTypes(state: GameState, playerId: PlayerId): Good[] {
  const seen = new Set<Good>();
  for (const cityId of citiesOf(state, playerId)) {
    const g = state.cityGoods[cityId];
    if (g) seen.add(g);
  }
  return GOODS.filter((g) => seen.has(g));
}

export function colonistsOnBoard(state: GameState, playerId: PlayerId): number {
  return colonistsOf(state, playerId).length;
}

export function reserveTotal(p: PlayerState): number {
  return p.reserveColonists.land + p.reserveColonists.sea;
}

/* ─────────────────────────────────────────── immutable update helpers ── */

export function withPlayer(
  state: GameState,
  playerId: PlayerId,
  update: (p: PlayerState) => PlayerState,
): GameState {
  const players = state.players.map((p) => (p.id === playerId ? update(p) : p));
  return { ...state, players };
}

export function addGoods(p: PlayerState, good: Good, n: number): PlayerState {
  const goods = cloneGoods(p.goods);
  goods[good] += n;
  return { ...p, goods };
}

export function addMoney(p: PlayerState, n: number): PlayerState {
  return { ...p, money: p.money + n };
}

/* ───────────────────────────────────────────────── turn order maths ── */

export function nextPlayerId(state: GameState, from: PlayerId): PlayerId {
  return (from + 1) % state.players.length;
}

export function previousPlayerId(state: GameState, from: PlayerId): PlayerId {
  return (from - 1 + state.players.length) % state.players.length;
}

/* ─────────────────────────────────────────────────────── invariants ── */

/**
 * Returns a list of invariant violations. An empty array means the state is
 * structurally sound. This never throws — callers decide how loud to be.
 */
export function validateState(state: GameState): string[] {
  const problems: string[] = [];
  const map = stateMap(state);
  const cityIds = new Set(map.cities.map((c) => c.id));
  const routeIds = new Set(map.routes.map((r) => r.id));

  // ── players ────────────────────────────────────────────────
  for (const p of state.players) {
    if (p.money < 0) problems.push(`P${p.id} has negative money (${p.money})`);
    if (!Number.isInteger(p.money)) problems.push(`P${p.id} money is not an integer`);
    for (const g of GOODS) {
      if (p.goods[g] < 0) problems.push(`P${p.id} has negative ${g} (${p.goods[g]})`);
      if (!Number.isInteger(p.goods[g])) problems.push(`P${p.id} ${g} is not an integer`);
    }
    const used = storageUsed(p);
    if (used > STOREHOUSE_CAPACITY) {
      problems.push(`P${p.id} storehouse over capacity (${used}/${STOREHOUSE_CAPACITY})`);
    }
    if (p.reserveColonists.land < 0 || p.reserveColonists.sea < 0) {
      problems.push(`P${p.id} has negative reserve colonists`);
    }
    if (p.housesRemaining < 0 || p.housesRemaining > HOUSES_PER_PLAYER) {
      problems.push(`P${p.id} housesRemaining out of range (${p.housesRemaining})`);
    }
    if (p.housesRemaining + houseCount(state, p.id) !== HOUSES_PER_PLAYER) {
      problems.push(
        `P${p.id} house accounting broken: ${p.housesRemaining} in supply + ` +
          `${houseCount(state, p.id)} built ≠ ${HOUSES_PER_PLAYER}`,
      );
    }

    // Colonist budget: on board + reserve must equal the per-type maximum.
    for (const t of ['land', 'sea'] as ColonistType[]) {
      const onBoard = state.colonists.filter((c) => c.owner === p.id && c.type === t).length;
      const total = onBoard + p.reserveColonists[t];
      if (total !== MAX_COLONISTS_ON_BOARD / 2) {
        problems.push(`P${p.id} ${t} colonist accounting broken (${onBoard} + ${p.reserveColonists[t]})`);
      }
    }
    if (colonistsOnBoard(state, p.id) > MAX_COLONISTS_ON_BOARD) {
      problems.push(`P${p.id} exceeds the colonist limit`);
    }

    // Cards must exist and must not be in two places at once.
    for (const id of [...p.hand, ...p.discard]) {
      if (!state.cards[id]) problems.push(`P${p.id} holds unknown card ${id}`);
    }
    const dupes = [...p.hand, ...p.discard].filter((id, i, arr) => arr.indexOf(id) !== i);
    if (dupes.length) problems.push(`P${p.id} holds duplicate cards: ${dupes.join(', ')}`);
  }

  // ── cards are globally unique across all zones ────────────
  const seen = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const prev = seen.get(id);
    if (prev) problems.push(`Card ${id} is in two places: ${prev} and ${where}`);
    else seen.set(id, where);
  };
  state.players.forEach((p) => {
    p.hand.forEach((id) => claim(id, `P${p.id}.hand`));
    p.discard.forEach((id) => claim(id, `P${p.id}.discard`));
  });
  state.display.forEach((id, i) => id && claim(id, `display[${i}]`));
  state.stack.forEach((id) => claim(id, 'stack'));

  // ── display ────────────────────────────────────────────────
  if (state.display.length !== 7) problems.push(`Display has ${state.display.length} slots, expected 7`);
  // Between actions the display must be compacted: no gaps before a card.
  if (!state.pending) {
    let sawGap = false;
    for (const slot of state.display) {
      if (slot === null) sawGap = true;
      else if (sawGap) {
        problems.push('Display has a gap to the left of a card outside an action');
        break;
      }
    }
    const filled = state.display.filter((s) => s !== null).length;
    if (filled < 7 && state.stack.length > 0) {
      problems.push(`Display not refilled (${filled}/7) while ${state.stack.length} cards remain`);
    }
  }

  // ── board ──────────────────────────────────────────────────
  const routeOccupants = new Map<string, number>();
  for (const c of state.colonists) {
    if (c.location.kind === 'city') {
      if (!cityIds.has(c.location.cityId)) problems.push(`Colonist ${c.id} in unknown city`);
    } else {
      const rid = c.location.routeId;
      if (!routeIds.has(rid)) problems.push(`Colonist ${c.id} on unknown route ${rid}`);
      routeOccupants.set(rid, (routeOccupants.get(rid) ?? 0) + 1);
      const route = map.routes.find((r) => r.id === rid);
      if (route && route.type !== c.type) {
        problems.push(`Colonist ${c.id} (${c.type}) is on a ${route.type} route`);
      }
    }
  }
  for (const [rid, n] of routeOccupants) {
    if (n > 1) problems.push(`Route ${rid} holds ${n} colonists (RULES 3.3 allows one)`);
  }

  for (const [cityId, owners] of Object.entries(state.houses)) {
    if (!cityIds.has(cityId)) problems.push(`Houses in unknown city ${cityId}`);
    const city = map.cities.find((c) => c.id === cityId);
    if (city?.isCapital && owners.length > 0) problems.push('Houses built in the capital (RULES 8.7)');
    if (new Set(owners).size !== owners.length) {
      problems.push(`City ${cityId} has two houses from the same player (RULES 8.5)`);
    }
  }

  // ── province markers ───────────────────────────────────────
  for (const prov of map.provinces) {
    if (!state.bonusMarkers[prov.id]) problems.push(`Province ${prov.id} has no bonus marker`);
  }

  // ── city goods ─────────────────────────────────────────────
  for (const city of map.cities) {
    if (city.isCapital) {
      if (state.cityGoods[city.id]) problems.push('The capital was assigned a good');
    } else if (!state.cityGoods[city.id]) {
      problems.push(`City ${city.id} has no good`);
    }
  }

  // ── phase ──────────────────────────────────────────────────
  if (state.phase === 'finished' && state.pending) {
    problems.push('Game is finished but an action is still pending');
  }
  if (state.currentPlayer < 0 || state.currentPlayer >= state.players.length) {
    problems.push(`currentPlayer out of range (${state.currentPlayer})`);
  }

  return problems;
}

/** Throwing variant, for tests and development builds. */
export function assertValidState(state: GameState, context = ''): void {
  const problems = validateState(state);
  if (problems.length) {
    throw new Error(
      `Invalid game state${context ? ` after ${context}` : ''}:\n  - ${problems.join('\n  - ')}`,
    );
  }
}
