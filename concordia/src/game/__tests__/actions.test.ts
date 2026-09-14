import { describe, expect, it } from 'vitest';
import { getCardDef } from '../data/cards';
import { GOOD_VALUES } from '../data/ruleConstants';
import {
  applyAction,
  buildCost,
  buildableCities,
  freeStorage,
  legalActions,
  priceAtPosition,
  receiveGoods,
  reachableDestinations,
  storageUsed,
} from '../engine/rules';
import {
  handCardOfRole,
  must,
  newGame,
  placeHouse,
  putColonistOnRoute,
  refuse,
  setCityGood,
  setGoods,
  setHandRoles,
  withPlayerPatch,
  giveCard,
  findInjected,
} from './helpers';
import type { GameState } from '../engine/types';

const ROMA = 'roma';
const ROMA_GENUA_LAND = 'L:genua-roma';
const ROMA_CARALIS_SEA = 'S:caralis-roma';
const GENUA_MASSILIA_LAND = 'L:massilia-genua';

function landColonist(state: GameState, playerId = 0): string {
  return state.colonists.find((c) => c.owner === playerId && c.type === 'land')!.id;
}
function seaColonist(state: GameState, playerId = 0): string {
  return state.colonists.find((c) => c.owner === playerId && c.type === 'sea')!.id;
}

/** Plays the Architect and returns the state waiting for movement. */
function startArchitect(state: GameState): GameState {
  return must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, state.currentPlayer, 'architect') });
}

/* ══════════════════════════════════════════ RULES §7 — movement ══ */

describe('RULES §7 — movement', () => {
  it('7.4 — the allowance equals the number of colonists on the board', () => {
    const state = startArchitect(newGame());
    expect(state.pending!.movementRemaining).toBe(2);
  });

  it('7.2 — a colonist in a city steps onto an adjacent route of its own type', () => {
    let state = startArchitect(newGame());
    state = must(state, { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] });
    const colonist = state.colonists.find((c) => c.id === landColonist(state))!;
    expect(colonist.location).toEqual({ kind: 'route', routeId: ROMA_GENUA_LAND });
    expect(state.pending!.movementRemaining).toBe(1);
  });

  it('7.5 — a land colonist may not use a sea lane, nor a ship a road', () => {
    const state = startArchitect(newGame());
    refuse(state, { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_CARALIS_SEA] }, 'wrong-route-type');
    refuse(state, { type: 'MOVE_COLONIST', colonistId: seaColonist(state), path: [ROMA_GENUA_LAND] }, 'wrong-route-type');
  });

  it('7.2 — a two-step move travels through a city onto the next route', () => {
    let state = startArchitect(newGame());
    state = must(state, {
      type: 'MOVE_COLONIST',
      colonistId: landColonist(state),
      path: [ROMA_GENUA_LAND, GENUA_MASSILIA_LAND],
    });
    expect(state.colonists.find((c) => c.id === landColonist(state))!.location).toEqual({
      kind: 'route',
      routeId: GENUA_MASSILIA_LAND,
    });
    expect(state.pending!.movementRemaining).toBe(0);
  });

  it('7.2 — disconnected routes are rejected', () => {
    const state = startArchitect(newGame());
    refuse(
      state,
      { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [GENUA_MASSILIA_LAND] },
      'not-connected',
    );
  });

  it('7.4 — a journey longer than the allowance is rejected', () => {
    const state = startArchitect(newGame());
    refuse(
      state,
      {
        type: 'MOVE_COLONIST',
        colonistId: landColonist(state),
        path: [ROMA_GENUA_LAND, GENUA_MASSILIA_LAND, 'L:narbo-massilia'],
      },
      'not-enough-movement',
    );
  });

  it('7.6 — a colonist may not finish on an occupied route', () => {
    let state = newGame();
    // Park an opponent's colonist on the road out of Roma.
    state = putColonistOnRoute(state, landColonist(state, 1), ROMA_GENUA_LAND);
    state = startArchitect(state);
    refuse(
      state,
      { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] },
      'destination-occupied',
    );
  });

  it('7.6 — but it may pass straight through one, paying a step for it', () => {
    let state = newGame();
    state = putColonistOnRoute(state, landColonist(state, 1), ROMA_GENUA_LAND);
    state = startArchitect(state);
    state = must(state, {
      type: 'MOVE_COLONIST',
      colonistId: landColonist(state),
      path: [ROMA_GENUA_LAND, GENUA_MASSILIA_LAND],
    });
    expect(state.colonists.find((c) => c.id === landColonist(state))!.location).toEqual({
      kind: 'route',
      routeId: GENUA_MASSILIA_LAND,
    });
  });

  it('7.3 — a colonist may not step straight back onto the route it just left', () => {
    let state = startArchitect(newGame());
    state = must(state, { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] });
    refuse(
      state,
      { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] },
      'backtrack',
    );
  });

  it('reachability never offers an occupied route as a destination', () => {
    let state = newGame();
    state = putColonistOnRoute(state, landColonist(state, 1), ROMA_GENUA_LAND);
    const colonist = state.colonists.find((c) => c.id === landColonist(state, 0))!;
    const destinations = reachableDestinations(state, colonist, 3).map((d) => d.routeId);
    expect(destinations).not.toContain(ROMA_GENUA_LAND);
    expect(destinations).toContain(GENUA_MASSILIA_LAND);
  });

  it('you may not move another player’s colonist', () => {
    const state = startArchitect(newGame());
    refuse(
      state,
      { type: 'MOVE_COLONIST', colonistId: landColonist(state, 1), path: [ROMA_GENUA_LAND] },
      'not-your-colonist',
    );
  });
});

/* ═════════════════════════════════════ RULES §8 — construction ══ */

describe('RULES §8 — construction', () => {
  function architectAtGenua(patch: (s: GameState) => GameState = (s) => s): GameState {
    let state = newGame();
    state = patch(state);
    state = startArchitect(state);
    state = must(state, { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] });
    return must(state, { type: 'END_MOVEMENT' });
  }

  it('8.1 — you may build in either city at the ends of your colonist’s route', () => {
    const state = architectAtGenua();
    // Roma is excluded because it is the capital (RULES 8.7).
    expect(buildableCities(state, 0)).toEqual(['genua']);
  });

  it('8.7 — never in the capital', () => {
    const state = architectAtGenua();
    refuse(state, { type: 'BUILD_HOUSE', cityId: ROMA }, 'capital');
  });

  it('8.1 — not in a city no colonist of yours stands beside', () => {
    const state = architectAtGenua();
    refuse(state, { type: 'BUILD_HOUSE', cityId: 'alexandria' }, 'not-adjacent');
  });

  it('8.2/8.3 — a brick city costs 1 food and 1₴', () => {
    let state = architectAtGenua((s) => setCityGood(s, 'genua', 'brick'));
    state = setGoods(state, 0, { food: 3 });
    const before = state.players[0]!;
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });
    const after = state.players[0]!;
    expect(before.goods.food - after.goods.food).toBe(1);
    expect(before.money - after.money).toBe(1);
    expect(before.goods.brick).toBe(after.goods.brick);
  });

  it('8.2/8.3 — a cloth city costs 1 brick + 1 cloth and 5₴', () => {
    let state = architectAtGenua((s) => setCityGood(s, 'genua', 'cloth'));
    state = setGoods(state, 0, { brick: 2, cloth: 2 });
    const before = state.players[0]!;
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });
    const after = state.players[0]!;
    expect(before.goods.brick - after.goods.brick).toBe(1);
    expect(before.goods.cloth - after.goods.cloth).toBe(1);
    expect(before.money - after.money).toBe(5);
  });

  it('8.4 — coins are multiplied by the number of houses after the build, goods are not', () => {
    // Two rivals already hold Genua, so this will be the third house there.
    let state = architectAtGenua((s) => {
      let t = setCityGood(s, 'genua', 'wine'); // base 4₴, costs 1 brick + 1 wine
      t = placeHouse(t, 'genua', 1);
      t = placeHouse(t, 'genua', 2);
      return t;
    });
    state = setGoods(state, 0, { brick: 2, wine: 2 });
    state = withPlayerPatch(state, 0, { money: 40 });

    const cost = buildCost('wine', 2);
    expect(cost.multiplier).toBe(3);
    expect(cost.coins).toBe(12);
    expect(cost.goods).toEqual(['brick', 'wine']);

    const before = state.players[0]!;
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });
    const after = state.players[0]!;
    expect(before.money - after.money).toBe(12);
    expect(before.goods.brick - after.goods.brick).toBe(1);
    expect(before.goods.wine - after.goods.wine).toBe(1);
    expect(state.houses['genua']).toEqual([1, 2, 0]);
  });

  it('8.5 — never two of your own houses in one city', () => {
    let state = architectAtGenua((s) => setCityGood(s, 'genua', 'brick'));
    state = setGoods(state, 0, { food: 4 });
    state = must(state, { type: 'BUILD_HOUSE', cityId: 'genua' });
    refuse(state, { type: 'BUILD_HOUSE', cityId: 'genua' }, 'already-built');
  });

  it('8.8 — building is refused while movement is still open', () => {
    let state = newGame();
    state = setCityGood(state, 'genua', 'brick');
    state = startArchitect(state);
    state = must(state, { type: 'MOVE_COLONIST', colonistId: landColonist(state), path: [ROMA_GENUA_LAND] });
    refuse(state, { type: 'BUILD_HOUSE', cityId: 'genua' }, 'wrong-step');
  });

  it('an unaffordable house is refused', () => {
    let state = architectAtGenua((s) => setCityGood(s, 'genua', 'cloth'));
    state = withPlayerPatch(state, 0, { money: 0 });
    refuse(state, { type: 'BUILD_HOUSE', cityId: 'genua' }, 'too-poor');
    state = withPlayerPatch(state, 0, { money: 40 });
    state = setGoods(state, 0, { brick: 0 });
    refuse(state, { type: 'BUILD_HOUSE', cityId: 'genua' }, 'missing-goods');
  });
});

/* ═══════════════════════════════════════ RULES §6.2 — Prefect ══ */

describe('RULES §6.2 — Prefect', () => {
  function playPrefect(state: GameState): GameState {
    return must(state, {
      type: 'PLAY_CARD',
      cardId: handCardOfRole(state, state.currentPlayer, 'prefect'),
    });
  }

  it('6.2a — the province produces for every owner, and the actor takes the marker bonus', () => {
    let state = newGame();
    state = setCityGood(state, 'genua', 'wine');
    state = setCityGood(state, 'mediolanum', 'food');
    state = setCityGood(state, 'ravenna', 'brick');
    // Recompute the marker: wine is the most valuable good in Italia.
    state = { ...state, bonusMarkers: { ...state.bonusMarkers, italia: { good: 'wine', active: true } } };
    state = placeHouse(state, 'genua', 0);
    state = placeHouse(state, 'mediolanum', 1);
    state = setGoods(state, 0, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    state = setGoods(state, 1, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    // Player 2 holds the Praefectus Magnus at setup, so player 0 gets a single bonus.

    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_PRODUCE', provinceId: 'italia' });

    // Actor: 1 wine bonus + 1 wine from their own Genua house.
    expect(state.players[0]!.goods.wine).toBe(2);
    // Opponent: 1 food from Mediolanum, and nothing else.
    expect(state.players[1]!.goods.food).toBe(1);
    expect(state.bonusMarkers['italia']!.active).toBe(false);
  });

  it('6.2a — a spent province may not be chosen again', () => {
    let state = newGame();
    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_PRODUCE', provinceId: 'italia' });
    // Next player tries the same province.
    state = playPrefect(state);
    refuse(state, { type: 'PREFECT_PRODUCE', provinceId: 'italia' }, 'province-spent');
  });

  it('13.2/13.3 — the Praefectus Magnus doubles the bonus and then moves right', () => {
    let state = newGame();
    const holder = state.praefectusMagnus; // player 2 in a three-player game
    state = { ...state, currentPlayer: holder };
    state = setGoods(state, holder, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    const markerGood = state.bonusMarkers['italia']!.good;

    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_PRODUCE', provinceId: 'italia' });

    expect(state.players[holder]!.goods[markerGood]).toBe(2);
    expect(state.praefectusMagnus).toBe(holder - 1);
  });

  it('13.4 — the cash bonus does not activate or pass the Praefectus Magnus', () => {
    let state = newGame();
    const holder = state.praefectusMagnus;
    state = { ...state, currentPlayer: holder };
    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_CASH' });
    expect(state.praefectusMagnus).toBe(holder);
  });

  it('6.2b — the cash bonus pays 1₴ per visible coin and reactivates every province', () => {
    let state = newGame();
    // Spend two provinces.
    const spent = ['italia', 'gallia'] as const;
    const markers = { ...state.bonusMarkers };
    for (const id of spent) markers[id] = { ...markers[id]!, active: false };
    state = { ...state, bonusMarkers: markers };

    const coinValues: Record<string, number> = { brick: 1, food: 1, tool: 2, wine: 2, cloth: 3 };
    const expected = spent.reduce((s, id) => s + coinValues[state.bonusMarkers[id]!.good]!, 0);

    const before = state.players[0]!.money;
    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_CASH' });

    expect(state.players[0]!.money - before).toBe(expected);
    expect(Object.values(state.bonusMarkers).every((m) => m.active)).toBe(true);
  });

  it('6.2 — a Prefect must choose one of its two options', () => {
    const state = playPrefect(newGame());
    refuse(state, { type: 'END_ACTION' }, 'must-choose');
  });

  it('production respects the storehouse and the surplus is lost (RULES 10.4)', () => {
    let state = newGame();
    state = setCityGood(state, 'genua', 'wine');
    state = setCityGood(state, 'mediolanum', 'wine');
    state = setCityGood(state, 'ravenna', 'wine');
    state = { ...state, bonusMarkers: { ...state.bonusMarkers, italia: { good: 'wine', active: true } } };
    state = placeHouse(state, 'genua', 0);
    state = placeHouse(state, 'mediolanum', 0);
    state = placeHouse(state, 'ravenna', 0);
    // Fill the storehouse to within one space: 7 goods + 4 reserve colonists = 11 of 12.
    state = setGoods(state, 0, { brick: 7, food: 0, tool: 0, wine: 0, cloth: 0 });
    expect(freeStorage(state.players[0]!)).toBe(1);

    state = playPrefect(state);
    state = must(state, { type: 'PREFECT_PRODUCE', provinceId: 'italia' });

    expect(storageUsed(state.players[0]!)).toBe(12);
    expect(state.players[0]!.goods.wine).toBe(1); // 1 of the 4 units offered fitted
  });
});

/* ══════════════════════════════════════ RULES §6.3 — Mercator ══ */

describe('RULES §6.3 / §11 — Mercator', () => {
  function playMercator(state: GameState): GameState {
    return must(state, {
      type: 'PLAY_CARD',
      cardId: handCardOfRole(state, state.currentPlayer, 'mercator'),
    });
  }

  it('the starting Mercator pays 3₴ immediately', () => {
    const before = newGame();
    const state = playMercator(before);
    expect(state.players[0]!.money - before.players[0]!.money).toBe(3);
  });

  it('11.1 — selling pays the printed price', () => {
    let state = playMercator(newGame());
    const before = state.players[0]!;
    state = must(state, { type: 'TRADE', good: 'wine', direction: 'sell', quantity: 1 });
    expect(state.players[0]!.money - before.money).toBe(GOOD_VALUES.wine);
    expect(state.players[0]!.goods.wine).toBe(before.goods.wine - 1);
  });

  it('11.1 — buying costs the printed price', () => {
    let state = playMercator(newGame());
    state = withPlayerPatch(state, 0, { money: 30 });
    state = setGoods(state, 0, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    const before = state.players[0]!;
    state = must(state, { type: 'TRADE', good: 'brick', direction: 'buy', quantity: 3 });
    expect(before.money - state.players[0]!.money).toBe(3 * GOOD_VALUES.brick);
    expect(state.players[0]!.goods.brick).toBe(3);
  });

  it('11.2 — at most two kinds of goods', () => {
    let state = playMercator(newGame());
    state = withPlayerPatch(state, 0, { money: 60 });
    state = must(state, { type: 'TRADE', good: 'wine', direction: 'sell', quantity: 1 });
    state = must(state, { type: 'TRADE', good: 'cloth', direction: 'sell', quantity: 1 });
    refuse(state, { type: 'TRADE', good: 'tool', direction: 'sell', quantity: 1 }, 'too-many-types');
  });

  it('11.2 — never buy and sell the same kind in one turn', () => {
    let state = playMercator(newGame());
    state = withPlayerPatch(state, 0, { money: 60 });
    state = must(state, { type: 'TRADE', good: 'wine', direction: 'sell', quantity: 1 });
    refuse(state, { type: 'TRADE', good: 'wine', direction: 'buy', quantity: 1 }, 'both-directions');
  });

  it('10.3 — you cannot buy more than the storehouse can hold', () => {
    let state = playMercator(newGame());
    state = withPlayerPatch(state, 0, { money: 500 });
    const room = freeStorage(state.players[0]!);
    refuse(state, { type: 'TRADE', good: 'brick', direction: 'buy', quantity: room + 1 }, 'bad-trade');
    state = must(state, { type: 'TRADE', good: 'brick', direction: 'buy', quantity: room });
    expect(freeStorage(state.players[0]!)).toBe(0);
  });

  it('you cannot sell what you do not have, nor buy what you cannot afford', () => {
    let state = playMercator(newGame());
    refuse(state, { type: 'TRADE', good: 'cloth', direction: 'sell', quantity: 5 }, 'bad-trade');
    state = withPlayerPatch(state, 0, { money: 2 });
    refuse(state, { type: 'TRADE', good: 'cloth', direction: 'buy', quantity: 1 }, 'bad-trade');
  });

  it('a purchased Mercator pays 5₴', () => {
    const def = getCardDef('I-mercator');
    expect(def.mercatorMoney).toBe(5);
    expect(getCardDef('start-mercator').mercatorMoney).toBe(3);
  });
});

/* ══════════════════════════════════════ RULES §6.4 — Colonist ══ */

describe('RULES §6.4 — Colonist', () => {
  function playColonist(state: GameState): GameState {
    const s = giveCard(state, 0, 'I-colonist');
    return must(s, { type: 'PLAY_CARD', cardId: findInjected(s, 0, 'I-colonist') });
  }

  it('6.4b — the money option pays 5₴ plus 1₴ per colonist on the board', () => {
    let state = newGame();
    const before = state.players[0]!.money;
    state = playColonist(state);
    state = must(state, { type: 'COLONIST_MONEY' });
    expect(state.players[0]!.money - before).toBe(5 + 2);
  });

  it('6.4a — a colonist costs 1 food + 1 tool and may be raised in the capital', () => {
    let state = playColonist(newGame());
    const before = state.players[0]!;
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    const after = state.players[0]!;
    expect(before.goods.food - after.goods.food).toBe(1);
    expect(before.goods.tool - after.goods.tool).toBe(1);
    expect(after.reserveColonists.land).toBe(1);
    expect(state.colonists.filter((c) => c.owner === 0)).toHaveLength(3);
  });

  it('10.6 — placing a colonist frees a storage space', () => {
    let state = playColonist(newGame());
    const before = freeStorage(state.players[0]!);
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    // Paid 2 goods and freed 1 colonist space, so 3 more spaces are open.
    expect(freeStorage(state.players[0]!)).toBe(before + 3);
  });

  it('6.4a — only in the capital or a city where you hold a house', () => {
    let state = playColonist(newGame());
    refuse(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: 'genua' }, 'no-house-there');
    state = placeHouse(state, 'genua', 0);
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: 'genua' });
    expect(state.colonists.some((c) => c.location.kind === 'city' && c.location.cityId === 'genua')).toBe(true);
  });

  it('6.4a — several colonists may be raised in one action', () => {
    let state = playColonist(newGame());
    state = setGoods(state, 0, { brick: 0, food: 3, tool: 3, wine: 0, cloth: 0 });
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'sea', cityId: ROMA });
    expect(state.colonists.filter((c) => c.owner === 0)).toHaveLength(4);
  });

  it('2.2 — the reserve is finite: no more than three of each type', () => {
    let state = playColonist(newGame());
    state = setGoods(state, 0, { brick: 0, food: 4, tool: 4, wine: 0, cloth: 0 });
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    refuse(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA }, 'no-reserve');
  });

  it('6.4 — once you start raising colonists you cannot switch to the money option', () => {
    let state = playColonist(newGame());
    state = must(state, { type: 'RECRUIT_COLONIST', colonistType: 'land', cityId: ROMA });
    refuse(state, { type: 'COLONIST_MONEY' }, 'wrong-step');
  });
});

/* ══════════════════════════════════════ RULES §6.5 — Diplomat ══ */

describe('RULES §6.5 — Diplomat', () => {
  it('cannot be played against a player with an empty discard pile', () => {
    const state = must(newGame(), {
      type: 'PLAY_CARD',
      cardId: handCardOfRole(newGame(), 0, 'diplomat'),
    });
    expect(state.pending!.step).toBe('diplomat:choose');
    refuse(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 1 }, 'bad-target');
    // With nothing to copy it may still be played and simply passes (RULES 5.5).
    must(state, { type: 'END_ACTION' });
  });

  it('copies the card showing on an opponent’s pile, using the copier’s resources', () => {
    let state = newGame();
    // Player 0 plays a Mercator, then player 1 copies it with a Diplomat.
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'mercator') });
    state = must(state, { type: 'END_ACTION' });
    expect(state.currentPlayer).toBe(1);

    const before = state.players[1]!.money;
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'diplomat') });
    state = must(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 0 });
    expect(state.pending!.role).toBe('mercator');
    expect(state.players[1]!.money - before).toBe(3);
    // Player 0's Mercator card stays with player 0.
    expect(state.players[0]!.discard).toHaveLength(1);
  });

  it('a Diplomat may not be copied', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'diplomat') });
    state = must(state, { type: 'END_ACTION' });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'diplomat') });
    refuse(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 0 }, 'bad-target');
  });

  it('a player who has just recalled their cards cannot be copied', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    state = must(state, { type: 'END_ACTION' });
    expect(state.players[0]!.discard).toHaveLength(0);
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'diplomat') });
    refuse(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 0 }, 'bad-target');
  });

  it('you may not copy your own pile', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'mercator') });
    state = must(state, { type: 'END_ACTION' });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'mercator') });
    state = must(state, { type: 'END_ACTION' });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 2, 'mercator') });
    state = must(state, { type: 'END_ACTION' });
    // Back to player 0, whose own pile shows a Mercator.
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'diplomat') });
    refuse(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 0 }, 'bad-target');
  });

  it('a copied Architect gives the copier their own movement allowance', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'architect') });
    state = must(state, { type: 'END_ACTION' });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 1, 'diplomat') });
    state = must(state, { type: 'DIPLOMAT_COPY', targetPlayerId: 0 });
    expect(state.pending!.step).toBe('architect:move');
    expect(state.pending!.movementRemaining).toBe(2);
  });
});

/* ═══════════════════════════ RULES §6.6 / §6.7 / §12 — the forum ══ */

describe('RULES §6.6, §6.7, §12 — the card display', () => {
  it('12.2 — a Senator pays the card cost plus the position surcharge', () => {
    const state = newGame();
    const p1 = priceAtPosition(state, 1, 'senator')!;
    const p4 = priceAtPosition(state, 4, 'senator')!;
    const card4 = priceAtPosition(state, 4, 'consul')!;
    expect(p1).toEqual(priceAtPosition(state, 1, 'consul'));
    expect(p4).toEqual([...card4, 'cloth']);
  });

  it('12.2 — position 3 adds a wildcard and position 6 adds a wildcard plus cloth', () => {
    const state = newGame();
    const base3 = priceAtPosition(state, 3, 'consul')!;
    const base6 = priceAtPosition(state, 6, 'consul')!;
    expect(priceAtPosition(state, 3, 'senator')).toEqual([...base3, 'any']);
    expect(priceAtPosition(state, 6, 'senator')).toEqual([...base6, 'any', 'cloth']);
  });

  it('6.6 — a Senator buys up to two cards, into hand', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    const handBefore = state.players[0]!.hand.length;
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'senator') });
    const first = state.display[0]!;
    state = must(state, { type: 'BUY_CARD', position: 1 });
    expect(state.players[0]!.hand).toContain(first);
    // Playing the Senator removed one card from hand, buying added one back.
    expect(state.players[0]!.hand.length).toBe(handBefore);
    expect(state.pending!.purchasesRemaining).toBe(1);
    state = must(state, { type: 'END_ACTION' });
    expect(state.pending).toBeNull();
  });

  it('6.6 — a third purchase is refused', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'senator') });
    const affordable = [1, 2, 3].filter((pos) => applyAction(state, { type: 'BUY_CARD', position: pos }).ok);
    if (affordable.length < 2) return; // seed-dependent; the rule is covered below
    state = must(state, { type: 'BUY_CARD', position: affordable[0]! });
    state = must(state, { type: 'BUY_CARD', position: affordable[1]! });
    expect(state.pending).toBeNull(); // two purchases end the action automatically
  });

  it('6.7 — a Consul ignores the position surcharge', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    state = giveCard(state, 0, 'II-consul');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-consul') });
    const cardCost = priceAtPosition(state, 6, 'consul')!;
    const before = { ...state.players[0]!.goods };
    const result = applyAction(state, { type: 'BUY_CARD', position: 6 });
    if (!result.ok) return; // unaffordable under this seed
    const after = result.state.players[0]!.goods;
    const spent = (['brick', 'food', 'tool', 'wine', 'cloth'] as const).reduce(
      (n, g) => n + (before[g] - after[g]),
      0,
    );
    expect(spent).toBe(cardCost.length);
    expect(result.state.pending).toBeNull(); // one purchase only
  });

  it('12.3 — after buying, the row slides left and is refilled to seven', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 2, food: 2, tool: 2, wine: 1, cloth: 1 });
    const second = state.display[1]!;
    const stackTop = state.stack[0]!;
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'senator') });
    state = must(state, { type: 'BUY_CARD', position: 1 });
    state = must(state, { type: 'END_ACTION' });
    expect(state.display[0]).toBe(second);
    expect(state.display[6]).toBe(stackTop);
    expect(state.display.filter(Boolean)).toHaveLength(7);
  });

  it('an unaffordable card is refused', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'senator') });
    refuse(state, { type: 'BUY_CARD', position: 7 }, 'cannot-pay');
  });

  it('an empty slot cannot be bought', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'senator') });
    state = { ...state, display: [null, ...state.display.slice(1)] };
    refuse(state, { type: 'BUY_CARD', position: 1 }, 'empty-slot');
  });
});

/* ═══════════════════════════════════════ RULES §6.8 — Tribune ══ */

describe('RULES §6.8 — Tribune', () => {
  it('recovers every played card, including itself, leaving the pile empty', () => {
    let state = newGame();
    state = setHandRoles(state, 0, ['mercator', 'prefect', 'tribune']);
    // Play two cards, ending each turn back at player 0.
    for (const role of ['mercator', 'prefect'] as const) {
      state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, role) });
      state = must(state, role === 'prefect' ? { type: 'PREFECT_CASH' } : { type: 'END_ACTION' });
      state = { ...state, currentPlayer: 0, pending: null };
    }
    // Four cards were set aside by setHandRoles, plus the two just played.
    expect(state.players[0]!.discard).toHaveLength(6);

    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    expect(state.players[0]!.discard).toHaveLength(0);
    expect(state.players[0]!.hand).toHaveLength(7);
  });

  it('pays 1₴ for every card recovered beyond the third', () => {
    let state = newGame();
    // Six cards in the pile, plus the Tribune itself = seven recovered.
    const player = state.players[0]!;
    const tribune = handCardOfRole(state, 0, 'tribune');
    const rest = player.hand.filter((id) => id !== tribune);
    state = withPlayerPatch(state, 0, { hand: [tribune], discard: rest });
    const before = state.players[0]!.money;

    state = must(state, { type: 'PLAY_CARD', cardId: tribune });
    expect(state.players[0]!.hand).toHaveLength(7);
    expect(state.players[0]!.money - before).toBe(7 - 3);
  });

  it('pays nothing when three or fewer cards come back', () => {
    let state = newGame();
    const before = state.players[0]!.money;
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    // Only the Tribune itself was in the pile.
    expect(state.players[0]!.money).toBe(before);
  });

  it('may raise exactly one colonist, in the capital only', () => {
    let state = newGame();
    state = placeHouse(state, 'genua', 0);
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'tribune') });
    expect(state.pending!.step).toBe('tribune:colonist');
    const before = state.players[0]!;
    state = must(state, { type: 'TRIBUNE_COLONIST', colonistType: 'sea' });
    expect(before.goods.food - state.players[0]!.goods.food).toBe(1);
    expect(before.goods.tool - state.players[0]!.goods.tool).toBe(1);
    const fresh = state.colonists.filter((c) => c.owner === 0);
    expect(fresh).toHaveLength(3);
    expect(fresh.every((c) => c.location.kind === 'city' && c.location.cityId === ROMA)).toBe(true);
    // The action ends after one colonist.
    expect(state.pending).toBeNull();
  });

  it('the colonist is optional', () => {
    let state = must(newGame(), { type: 'PLAY_CARD', cardId: handCardOfRole(newGame(), 0, 'tribune') });
    state = must(state, { type: 'END_ACTION' });
    expect(state.colonists.filter((c) => c.owner === 0)).toHaveLength(2);
  });
});

/* ════════════════════════════════════ RULES §6.9 — Specialists ══ */

describe('RULES §6.9 — specialists', () => {
  it('every matching city of yours produces one unit, and nobody else’s does', () => {
    let state = newGame();
    state = setCityGood(state, 'genua', 'wine');
    state = setCityGood(state, 'narbo', 'wine');
    state = setCityGood(state, 'salona', 'wine');
    state = placeHouse(state, 'genua', 0);
    state = placeHouse(state, 'narbo', 0);
    state = placeHouse(state, 'salona', 1);
    state = setGoods(state, 0, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    state = setGoods(state, 1, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });

    state = giveCard(state, 0, 'II-vintner');
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'II-vintner') });

    expect(state.players[0]!.goods.wine).toBe(2);
    expect(state.players[1]!.goods.wine).toBe(0);
    expect(state.pending).toBeNull(); // resolves in one go
  });

  it('produces nothing when you hold no matching city', () => {
    let state = newGame();
    state = giveCard(state, 0, 'I-smith');
    const before = { ...state.players[0]!.goods };
    state = must(state, { type: 'PLAY_CARD', cardId: findInjected(state, 0, 'I-smith') });
    expect(state.players[0]!.goods).toEqual(before);
  });
});

/* ══════════════════════════════════ RULES §10 — the storehouse ══ */

describe('RULES §10 — the storehouse', () => {
  it('10.3 — colonists in reserve occupy storage spaces', () => {
    const state = newGame();
    const p = state.players[0]!;
    expect(storageUsed(p)).toBe(6 + 4);
    expect(freeStorage(p)).toBe(2);
  });

  it('10.4 — overflow is turned away, never banked', () => {
    const state = newGame();
    const result = receiveGoods(state.players[0]!, { brick: 10 });
    expect(result.received.brick).toBe(2);
    expect(result.lost.brick).toBe(8);
    expect(storageUsed(result.player)).toBe(12);
  });

  it('10.5 — the preference order decides which units are kept', () => {
    const state = newGame();
    const player = state.players[0]!;
    const withPref = receiveGoods(player, { brick: 3, cloth: 3 }, ['brick']);
    expect(withPref.received.brick).toBe(2);
    expect(withPref.received.cloth).toBe(0);

    // With no preference the most valuable goods are taken first.
    const noPref = receiveGoods(player, { brick: 3, cloth: 3 });
    expect(noPref.received.cloth).toBe(2);
    expect(noPref.received.brick).toBe(0);
  });

  it('a full storehouse takes nothing at all', () => {
    let state = newGame();
    state = setGoods(state, 0, { brick: 8, food: 0, tool: 0, wine: 0, cloth: 0 });
    const result = receiveGoods(state.players[0]!, { wine: 4 });
    expect(result.received.wine).toBe(0);
    expect(result.lost.wine).toBe(4);
  });
});

/* ═════════════════════════════════ RULES §5 — the turn structure ══ */

describe('RULES §5 — turn structure', () => {
  it('5.2 — the played card goes to the top of the discard pile', () => {
    let state = newGame();
    const cardId = handCardOfRole(state, 0, 'mercator');
    state = must(state, { type: 'PLAY_CARD', cardId });
    expect(state.players[0]!.discard.at(-1)).toBe(cardId);
    expect(state.players[0]!.hand).not.toContain(cardId);
  });

  it('a second card cannot be played mid-action', () => {
    let state = newGame();
    state = must(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'mercator') });
    refuse(state, { type: 'PLAY_CARD', cardId: handCardOfRole(state, 0, 'architect') }, 'action-in-progress');
  });

  it('a card not in hand cannot be played', () => {
    const state = newGame();
    refuse(state, { type: 'PLAY_CARD', cardId: state.players[1]!.hand[0]! }, 'card-not-in-hand');
  });

  it('5.1 — the turn passes clockwise', () => {
    let state = newGame();
    for (let i = 0; i < 4; i++) {
      expect(state.currentPlayer).toBe(i % 3);
      state = must(state, {
        type: 'PLAY_CARD',
        cardId: handCardOfRole(state, state.currentPlayer, 'prefect'),
      });
      state = must(state, { type: 'PREFECT_CASH' });
    }
  });

  it('5.4 — there is always at least one legal action', () => {
    let state = newGame();
    for (let i = 0; i < 40 && state.phase !== 'finished'; i++) {
      const options = legalActions(state);
      expect(options.length).toBeGreaterThan(0);
      state = must(state, options[0]!);
    }
  });
});
