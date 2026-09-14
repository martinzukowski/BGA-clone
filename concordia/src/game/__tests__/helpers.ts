/**
 * Shared test scaffolding. Nothing here is used by the game itself.
 */

import { expect } from 'vitest';
import { getCardDef } from '../data/cards';
import { getMap as getMapById } from '../data/maps';
import { applyAction, setupGame, validateState } from '../engine/rules';
import type {
  CardRole,
  GameAction,
  GameState,
  Good,
  PlayerId,
  SetupOptions,
} from '../engine/types';

export function newGame(overrides: Partial<SetupOptions> = {}): GameState {
  return setupGame({
    seed: 12345,
    mapId: 'mare-nostrum',
    keepPlayerOrder: true,
    players: [
      { name: 'Alba', isHuman: true },
      { name: 'Betula', isHuman: false, difficulty: 'medium' },
      { name: 'Cedrus', isHuman: false, difficulty: 'medium' },
    ],
    ...overrides,
  });
}

/** Applies an action and fails the test with a readable message if it is illegal. */
export function must(state: GameState, action: GameAction): GameState {
  const result = applyAction(state, action);
  if (!result.ok) {
    throw new Error(`Expected ${action.type} to be legal, but: ${result.error}`);
  }
  const problems = validateState(result.state);
  expect(problems, `invariants after ${action.type}`).toEqual([]);
  return result.state;
}

/** Asserts an action is rejected, optionally with a specific code. */
export function refuse(state: GameState, action: GameAction, code?: string): string {
  const result = applyAction(state, action);
  expect(result.ok, `expected ${action.type} to be illegal`).toBe(false);
  if (!result.ok) {
    if (code) expect(result.code).toBe(code);
    return result.code;
  }
  return '';
}

/** Finds a card of the given role in a player's hand. */
export function handCardOfRole(state: GameState, playerId: PlayerId, role: CardRole): string {
  const found = state.players[playerId]!.hand.find(
    (id) => getCardDef(state.cards[id]!.defId).role === role,
  );
  if (!found) throw new Error(`Player ${playerId} has no ${role} in hand`);
  return found;
}

export function hasRoleInHand(state: GameState, playerId: PlayerId, role: CardRole): boolean {
  return state.players[playerId]!.hand.some(
    (id) => getCardDef(state.cards[id]!.defId).role === role,
  );
}

/* ─────────────────────────────── direct state surgery for fixtures ── */

export function giveMoney(state: GameState, playerId: PlayerId, money: number): GameState {
  return withPlayerPatch(state, playerId, { money });
}

export function setGoods(
  state: GameState,
  playerId: PlayerId,
  goods: Partial<Record<Good, number>>,
): GameState {
  const player = state.players[playerId]!;
  return withPlayerPatch(state, playerId, {
    goods: { ...player.goods, ...goods },
  });
}

export function withPlayerPatch(
  state: GameState,
  playerId: PlayerId,
  patch: Partial<GameState['players'][number]>,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
  };
}

/** Places a house directly, bypassing the Architect. */
export function placeHouse(state: GameState, cityId: string, playerId: PlayerId): GameState {
  const owners = state.houses[cityId] ?? [];
  const player = state.players[playerId]!;
  return {
    ...withPlayerPatch(state, playerId, { housesRemaining: player.housesRemaining - 1 }),
    houses: { ...state.houses, [cityId]: [...owners, playerId] },
  };
}

/** Moves a colonist directly onto a route. */
export function putColonistOnRoute(
  state: GameState,
  colonistId: string,
  routeId: string,
): GameState {
  return {
    ...state,
    colonists: state.colonists.map((c) =>
      c.id === colonistId ? { ...c, location: { kind: 'route', routeId } } : c,
    ),
  };
}

/** Forces a specific good onto a city, so cost tests are not seed-dependent. */
export function setCityGood(state: GameState, cityId: string, good: Good): GameState {
  return { ...state, cityGoods: { ...state.cityGoods, [cityId]: good } };
}

/** Replaces a player's hand with exactly these roles (drawn from the shared pool). */
export function setHandRoles(state: GameState, playerId: PlayerId, roles: CardRole[]): GameState {
  const player = state.players[playerId]!;
  const pool = [...player.hand, ...player.discard];
  const hand: string[] = [];
  const used = new Set<string>();
  for (const role of roles) {
    const found = pool.find((id) => !used.has(id) && getCardDef(state.cards[id]!.defId).role === role);
    if (!found) throw new Error(`No ${role} available for player ${playerId}`);
    used.add(found);
    hand.push(found);
  }
  return withPlayerPatch(state, playerId, {
    hand,
    discard: pool.filter((id) => !used.has(id)),
  });
}

let injected = 0;

/**
 * Adds a brand-new copy of a card definition straight to a player's hand.
 * A fresh instance id is used so the card is not duplicated from the display.
 */
export function giveCard(state: GameState, playerId: PlayerId, defId: string): GameState {
  const id = `test:${defId}:${injected++}`;
  return {
    ...state,
    cards: { ...state.cards, [id]: { id, defId } },
    players: state.players.map((p) => (p.id === playerId ? { ...p, hand: [...p.hand, id] } : p)),
  };
}

/** Finds the instance id of the most recently injected card of a definition. */
export function findInjected(state: GameState, playerId: PlayerId, defId: string): string {
  const found = [...state.players[playerId]!.hand].reverse().find((id) => state.cards[id]!.defId === defId);
  if (!found) throw new Error(`No ${defId} in player ${playerId}'s hand`);
  return found;
}

/**
 * Leaves a player with exactly `remaining` houses in supply by actually building
 * the rest, so the house-accounting invariant stays intact.
 */
export function leaveHouses(
  state: GameState,
  playerId: PlayerId,
  remaining: number,
  avoid: string[] = [],
): GameState {
  const map = getMapFor(state);
  const skip = new Set([map.capitalId, ...avoid]);
  let out = state;
  for (const city of map.cities) {
    if (out.players[playerId]!.housesRemaining <= remaining) break;
    if (skip.has(city.id)) continue;
    if ((out.houses[city.id] ?? []).includes(playerId)) continue;
    out = placeHouse(out, city.id, playerId);
  }
  if (out.players[playerId]!.housesRemaining !== remaining) {
    throw new Error('Not enough free cities to set up the house count');
  }
  return out;
}

function getMapFor(state: GameState) {
  // Local import keeps the helper file free of engine internals elsewhere.
  return getMapById(state.mapId);
}
