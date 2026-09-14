import { describe, expect, it } from 'vitest';
import { CONCORDIA_CARD_VP } from '../data/ruleConstants';
import { calculateScore, finalTurnsRemaining, legalActions, winner } from '../engine/rules';
import {
  findInjected,
  giveCard,
  handCardOfRole,
  must,
  newGame,
  placeHouse,
  refuse,
  setCityGood,
  setGoods,
  leaveHouses,
} from './helpers';
import type { GameState } from '../engine/types';

/** Leaves exactly one card in the forum and nothing in the stack. */
function almostEmptyForum(state: GameState): GameState {
  const last = state.display.find((c): c is string => c !== null)!;
  const removed = state.display.filter((c): c is string => c !== null && c !== last);
  return {
    ...state,
    display: [last, null, null, null, null, null, null],
    // Park the surplus cards somewhere legal: a neutral player's discard pile.
    players: state.players.map((p) =>
      p.id === state.players.length - 1 ? { ...p, discard: [...p.discard, ...removed] } : p,
    ),
    stack: [],
  };
}

describe('RULES §15 — the end of the game', () => {
  it('15.1 — buying the last card in the forum triggers the end', () => {
    let state = almostEmptyForum(newGame());
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });

    expect(state.concordiaHolder).toBeNull();
    state = must(state, { type: 'BUY_CARD', position: 1 });

    expect(state.display.filter(Boolean)).toHaveLength(0);
    expect(state.concordiaHolder).toBe(0);
    expect(state.phase).toBe('finalTurns');
  });

  it('15.1 — placing the fifteenth house triggers the end', () => {
    let state = newGame();
    state = setCityGood(state, 'genua', 'brick');
    state = leaveHouses(state, 0, 1, ['genua']);
    state = setGoods(state, 0, { brick: 0, food: 4, tool: 0, wine: 0, cloth: 0 });

    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'architect') });
    const landColonist = state.colonists.find((c) => c.owner === 0 && c.type === 'land')!.id;
    state = must(state, { type: 'MOVE_COLONIST', colonistId: landColonist, path: ['L:genua-roma'] });
    state = must(state, { type: 'END_MOVEMENT' });
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });

    // The trigger fires, but the turn is allowed to finish first (RULES 15.3).
    expect(state.concordiaHolder).toBeNull();
    expect(state.players[0]!.housesRemaining).toBe(0);
    state = must(state, { type: 'END_ACTION' });
    expect(state.concordiaHolder).toBe(0);
    expect(state.phase).toBe('finalTurns');
  });

  it('15.2 — the Concordia card is worth 7 VP to its holder alone', () => {
    let state = newGame();
    state = { ...state, concordiaHolder: 1 };
    const withCard = calculateScore(state, 1).lines.find((l) => l.god === 'concordia');
    expect(withCard!.points).toBe(CONCORDIA_CARD_VP);
    expect(calculateScore(state, 0).lines.some((l) => l.god === 'concordia')).toBe(false);
  });

  it('15.3 — every other player takes exactly one more turn, then the game ends', () => {
    let state = almostEmptyForum(newGame());
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });
    state = must(state, { type: 'BUY_CARD', position: 1 });

    expect(state.phase).toBe('finalTurns');
    expect(state.currentPlayer).toBe(1);
    expect(finalTurnsRemaining(state)).toBe(2); // players 1 and 2

    // Player 1's final turn.
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'prefect') });
    state = must(state, { type: 'PREFECT_CASH' });
    expect(state.phase).toBe('finalTurns');
    expect(state.currentPlayer).toBe(2);

    // Player 2's final turn ends the game; player 0 never plays again.
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 2, 'prefect') });
    state = must(state, { type: 'PREFECT_CASH' });
    expect(state.phase).toBe('finished');
    expect(legalActions(state)).toEqual([]);
  });

  it('nothing may be done once the game is finished', () => {
    let state = almostEmptyForum(newGame());
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });
    state = must(state, { type: 'BUY_CARD', position: 1 });
    for (const p of [1, 2]) {
      state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, p, 'prefect') });
      state = must(state, { type: 'PREFECT_CASH' });
    }
    refuse(state, { type: 'PLAY_CARD', cardId: state.players[0]!.hand[0]! }, 'game-over');
  });

  it('15.4 — a second trigger changes nothing; the Concordia card is already gone', () => {
    let state = almostEmptyForum(newGame());
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });
    state = must(state, { type: 'BUY_CARD', position: 1 });
    expect(state.concordiaHolder).toBe(0);

    // Player 1 now builds their last house during their final turn.
    state = setCityGood(state, 'genua', 'brick');
    state = leaveHouses(state, 1, 1, ['genua']);
    state = setGoods(state, 1, { brick: 0, food: 4, tool: 0, wine: 0, cloth: 0 });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'architect') });
    const colonist = state.colonists.find((c) => c.owner === 1 && c.type === 'land')!.id;
    state = must(state, { type: 'MOVE_COLONIST', colonistId: colonist, path: ['L:genua-roma'] });
    state = must(state, { type: 'END_MOVEMENT' });
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });
    state = must(state, { type: 'END_ACTION' });

    expect(state.concordiaHolder).toBe(0);
    expect(state.currentPlayer).toBe(2);
  });

  it('declares a winner once finished', () => {
    let state = almostEmptyForum(newGame());
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = placeHouse(state, 'genua', 0);
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });
    state = must(state, { type: 'BUY_CARD', position: 1 });
    for (const p of [1, 2]) {
      state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, p, 'prefect') });
      state = must(state, { type: 'PREFECT_CASH' });
    }
    const champion = winner(state);
    expect(champion).not.toBeNull();
    expect(champion!.rank).toBe(1);
    expect(Number.isFinite(champion!.breakdown.total)).toBe(true);
  });
});

describe('RULES §14 — intermediate scoring', () => {
  it('is off by default', () => {
    const state = newGame();
    expect(state.settings.intermediateScoring).toBe(false);
  });

  it('fires on each player’s first Tribune, then awards coin and resets', () => {
    let state = newGame({ intermediateScoring: true });
    for (const p of [0, 1, 2]) {
      expect(state.currentPlayer).toBe(p);
      state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, p, 'tribune') });
      state = must(state, { type: 'END_ACTION' });
      expect(state.players[p]!.hasScoredIntermediate).toBe(true);
    }
    // Everyone has now scored, so the markers are back to zero.
    expect(state.players.every((p) => p.vpMarker === 0)).toBe(true);
    // All three were identical, so all three shared first place and took 2₴.
    expect(state.players.map((p) => p.money)).toEqual([7, 8, 9]);
  });

  it('only fires once per player', () => {
    let state = newGame({ intermediateScoring: true });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    state = must(state, { type: 'END_ACTION' });
    const marker = state.players[0]!.vpMarker;
    state = { ...state, currentPlayer: 0 };
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    state = must(state, { type: 'END_ACTION' });
    expect(state.players[0]!.vpMarker).toBe(marker);
  });
});
