/**
 * RULES §4 — building a fresh `GameState` from `SetupOptions`.
 *
 * Deterministic: the same options always produce the same opening position.
 */

import { FOR_SALE_CARD_DEFS, STARTING_CARD_DEFS } from '../data/cards';
import { getMap } from '../data/maps';
import {
  DISPLAY_SIZE,
  ENABLE_INTERMEDIATE_SCORING,
  GOOD_VALUES,
  HOUSES_PER_PLAYER,
  STARTING_COLONISTS_IN_RESERVE,
  STARTING_COLONISTS_ON_BOARD,
  STARTING_GOODS,
  STARTING_MONEY_FIRST_PLAYER,
  STARTING_MONEY_INCREMENT,
  STATE_VERSION,
} from '../data/ruleConstants';
import { appendLog } from './log';
import { createRng, shuffle } from './rng';
import type {
  BonusMarker,
  CardId,
  CardInstance,
  Colonist,
  GameState,
  Good,
  PlayerColorId,
  PlayerState,
  RngState,
  SetupOptions,
} from './types';

const COLOR_ORDER: readonly PlayerColorId[] = ['crimson', 'azure', 'ochre', 'verdigris', 'obsidian'];

export function setupGame(options: SetupOptions): GameState {
  const map = getMap(options.mapId);
  const playerCount = options.players.length;
  if (playerCount < 2 || playerCount > 5) {
    throw new Error(`Unsupported player count: ${playerCount}`);
  }
  if (playerCount < map.minPlayers || playerCount > map.maxPlayers) {
    throw new Error(`Map ${map.id} does not support ${playerCount} players`);
  }

  let rng: RngState = createRng(options.seed);

  /* ── 4.2 city goods ─────────────────────────────────────── */
  const cityGoods: Record<string, Good> = {};
  const groupNames = Object.keys(map.tokenGroups).sort();
  for (const group of groupNames) {
    const members = map.cities
      .filter((c) => c.tokenGroup === group && !c.isCapital)
      .map((c) => c.id)
      .sort();
    const pool = map.tokenGroups[group]!;
    if (pool.length !== members.length) {
      throw new Error(
        `Map ${map.id}: token group ${group} has ${pool.length} goods for ${members.length} cities`,
      );
    }
    const s = shuffle(rng, pool);
    rng = s.rng;
    members.forEach((cityId, i) => {
      cityGoods[cityId] = s.value[i]!;
    });
  }

  /* ── 4.3 bonus markers: the most valuable good in each province ── */
  const bonusMarkers: Record<string, BonusMarker> = {};
  for (const prov of map.provinces) {
    let best: Good | undefined;
    for (const cityId of prov.cityIds) {
      const g = cityGoods[cityId];
      if (g && (!best || GOOD_VALUES[g] > GOOD_VALUES[best])) best = g;
    }
    if (!best) throw new Error(`Province ${prov.id} has no cities with goods`);
    bonusMarkers[prov.id] = { good: best, active: true };
  }

  /* ── players, turn order, colours ───────────────────────── */
  let seatOrder = options.players.map((_, i) => i);
  if (!options.keepPlayerOrder) {
    const s = shuffle(rng, seatOrder);
    rng = s.rng;
    seatOrder = s.value;
  }

  const cards: Record<CardId, CardInstance> = {};
  const colonists: Colonist[] = [];
  const players: PlayerState[] = [];

  seatOrder.forEach((originalIndex, seat) => {
    const opt = options.players[originalIndex]!;
    const hand: CardId[] = [];
    for (const def of STARTING_CARD_DEFS) {
      const id = `p${seat}:${def.defId}`;
      cards[id] = { id, defId: def.defId };
      hand.push(id);
    }

    // 4.7 — one land and one sea colonist start in the capital.
    for (let i = 0; i < STARTING_COLONISTS_ON_BOARD.land; i++) {
      colonists.push({
        id: `p${seat}:land:${i}`,
        owner: seat,
        type: 'land',
        location: { kind: 'city', cityId: map.capitalId },
      });
    }
    for (let i = 0; i < STARTING_COLONISTS_ON_BOARD.sea; i++) {
      colonists.push({
        id: `p${seat}:sea:${i}`,
        owner: seat,
        type: 'sea',
        location: { kind: 'city', cityId: map.capitalId },
      });
    }

    players.push({
      id: seat,
      name: opt.name,
      color: opt.color ?? COLOR_ORDER[seat] ?? 'obsidian',
      isHuman: opt.isHuman,
      ...(opt.difficulty ? { difficulty: opt.difficulty } : {}),
      // 4.8 — 5, 6, 7, … by seat.
      money: STARTING_MONEY_FIRST_PLAYER + seat * STARTING_MONEY_INCREMENT,
      goods: { ...STARTING_GOODS },
      reserveColonists: { ...STARTING_COLONISTS_IN_RESERVE },
      housesRemaining: HOUSES_PER_PLAYER,
      hand,
      discard: [],
      hasScoredIntermediate: false,
      vpMarker: 0,
    });
  });

  /* ── 4.5 the stack: decks I–V, numeral > playerCount removed ── */
  const stack: CardId[] = [];
  for (let numeral = 1; numeral <= playerCount; numeral++) {
    const defs = FOR_SALE_CARD_DEFS.filter((d) => d.deck === numeral);
    const s = shuffle(rng, defs);
    rng = s.rng;
    for (const def of s.value) {
      const id = `sale:${def.defId}`;
      cards[id] = { id, defId: def.defId };
      stack.push(id);
    }
  }

  /* ── 4.6 the display ────────────────────────────────────── */
  const display: (CardId | null)[] = [];
  for (let i = 0; i < DISPLAY_SIZE; i++) display.push(stack.shift() ?? null);

  const houses: Record<string, readonly number[]> = {};
  for (const city of map.cities) houses[city.id] = [];

  const base: GameState = {
    version: STATE_VERSION,
    rng,
    mapId: map.id,
    settings: {
      intermediateScoring: options.intermediateScoring ?? ENABLE_INTERMEDIATE_SCORING,
    },
    players,
    currentPlayer: 0,
    cityGoods,
    houses,
    colonists,
    bonusMarkers,
    cards,
    display,
    stack,
    // 4.9 — the Praefectus Magnus starts with the last player in turn order.
    praefectusMagnus: players.length - 1,
    concordiaHolder: null,
    phase: 'playing',
    finalTurnQueue: [],
    pending: null,
    turnNumber: 1,
    roundNumber: 1,
    log: [],
  };

  const withStart = appendLog(base, [
    {
      kind: 'game-start',
      playerId: null,
      text: `The forum opens at ${map.name}. ${players[0]!.name} moves first.`,
      data: { mapId: map.id, seed: options.seed },
    },
    {
      kind: 'turn-start',
      playerId: 0,
      text: `${players[0]!.name} takes the first turn.`,
      data: { playerId: 0 },
    },
  ]);

  return withStart.state;
}
