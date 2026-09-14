/**
 * RULES §8 (costs), §10 (storehouse) and §11 (trade).
 *
 * Every goods movement in the game funnels through this module, so capacity and
 * non-negativity are enforced in exactly one place.
 */

import { GOODS, GOOD_VALUES, BUILD_COIN_COST, buildGoodsCost } from '../data/ruleConstants';
import { cloneGoods, freeStorage, totalGoods } from './gameState';
import type { CostItem, Good, GoodsBag, PlayerState } from './types';

/* ─────────────────────────────────────────────────── receiving goods ── */

export interface ReceiptResult {
  readonly player: PlayerState;
  /** What actually went into the storehouse. */
  readonly received: GoodsBag;
  /** What had to be turned away for want of space (RULES 10.4). */
  readonly lost: GoodsBag;
}

/**
 * RULES 10.4 / 10.5 — give a player goods, respecting capacity.
 *
 * When not everything fits, `preference` decides which units are kept: goods are
 * taken in preference order first, then by descending market value, then by the
 * canonical goods order. Deterministic in every case.
 */
export function receiveGoods(
  player: PlayerState,
  incoming: Partial<Record<Good, number>>,
  preference: readonly Good[] = [],
): ReceiptResult {
  const want: GoodsBag = { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };
  for (const g of GOODS) want[g] = Math.max(0, incoming[g] ?? 0);

  const order = orderGoodsByPreference(preference);
  const goods = cloneGoods(player.goods);
  const received: GoodsBag = { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };
  const lost: GoodsBag = { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };

  let space = freeStorage(player);
  for (const g of order) {
    const take = Math.min(want[g], space);
    goods[g] += take;
    received[g] = take;
    lost[g] = want[g] - take;
    space -= take;
  }

  return { player: { ...player, goods }, received, lost };
}

function orderGoodsByPreference(preference: readonly Good[]): Good[] {
  const seen = new Set<Good>();
  const out: Good[] = [];
  for (const g of preference) {
    if (!seen.has(g)) {
      seen.add(g);
      out.push(g);
    }
  }
  // Most valuable first, then the canonical order — RULES 10.5.
  const rest = GOODS.filter((g) => !seen.has(g)).sort(
    (a, b) => GOOD_VALUES[b] - GOOD_VALUES[a] || GOODS.indexOf(a) - GOODS.indexOf(b),
  );
  return [...out, ...rest];
}

/** How many of `incoming` would actually fit — used by the AI and the UI. */
export function fitsInStorehouse(player: PlayerState, count: number): boolean {
  return freeStorage(player) >= count;
}

/* ─────────────────────────────────────────────────────── spending ── */

export function canPayGoods(player: PlayerState, cost: readonly Good[]): boolean {
  const need: Partial<Record<Good, number>> = {};
  for (const g of cost) need[g] = (need[g] ?? 0) + 1;
  return GOODS.every((g) => player.goods[g] >= (need[g] ?? 0));
}

/** Spends goods. Caller must have checked `canPayGoods`. */
export function payGoods(player: PlayerState, cost: readonly Good[]): PlayerState {
  const goods = cloneGoods(player.goods);
  for (const g of cost) goods[g] -= 1;
  return { ...player, goods };
}

/* ────────────────────────────────────────── wildcard cost resolution ── */

export interface ResolvedCost {
  /** Concrete goods to pay, wildcards substituted. */
  readonly goods: readonly Good[];
  readonly ok: boolean;
  readonly reason?: string;
}

/**
 * RULES 12.2 — turn a cost containing `'any'` wildcards into concrete goods.
 *
 * `wildcards` supplies the player's choices in order. When it is short (or
 * absent) the remaining wildcards are auto-filled with the *cheapest* good the
 * player can still spare, which is both the sensible default and deterministic.
 */
export function resolveCost(
  player: PlayerState,
  cost: readonly CostItem[],
  wildcards: readonly Good[] = [],
): ResolvedCost {
  const concrete: Good[] = [];
  const spend: GoodsBag = { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };

  // Fixed items first, so auto-filled wildcards know what is left.
  for (const item of cost) {
    if (item !== 'any') {
      concrete.push(item);
      spend[item] += 1;
    }
  }

  let supplied = 0;
  const wildcardCount = cost.filter((c) => c === 'any').length;
  for (let i = 0; i < wildcardCount; i++) {
    const chosen = wildcards[supplied];
    supplied++;
    if (chosen) {
      if (player.goods[chosen] - spend[chosen] < 1) {
        return { goods: concrete, ok: false, reason: `not enough ${chosen} for the wildcard` };
      }
      concrete.push(chosen);
      spend[chosen] += 1;
    } else {
      // Cheapest good still available — RULES 12.2 lets the payer choose.
      const auto = [...GOODS]
        .sort((a, b) => GOOD_VALUES[a] - GOOD_VALUES[b])
        .find((g) => player.goods[g] - spend[g] >= 1);
      if (!auto) return { goods: concrete, ok: false, reason: 'no goods left to pay the wildcard' };
      concrete.push(auto);
      spend[auto] += 1;
    }
  }

  for (const g of GOODS) {
    if (player.goods[g] < spend[g]) {
      return { goods: concrete, ok: false, reason: `not enough ${g}` };
    }
  }
  return { goods: concrete, ok: true };
}

/* ──────────────────────────────────────────────────── construction ── */

export interface BuildCost {
  readonly goods: readonly Good[];
  readonly coins: number;
  /** Houses that will stand in the city after this build (RULES 8.4). */
  readonly multiplier: number;
  readonly baseCoins: number;
}

/** RULES 8.2–8.4. */
export function buildCost(cityGood: Good, housesAlreadyThere: number): BuildCost {
  const multiplier = housesAlreadyThere + 1;
  const baseCoins = BUILD_COIN_COST[cityGood];
  return {
    goods: buildGoodsCost(cityGood),
    coins: baseCoins * multiplier,
    multiplier,
    baseCoins,
  };
}

export function canAffordBuild(player: PlayerState, cost: BuildCost): boolean {
  return player.money >= cost.coins && canPayGoods(player, cost.goods);
}

/* ───────────────────────────────────────────────────────── trade ── */

export interface TradeQuote {
  readonly ok: boolean;
  readonly reason?: string;
  readonly total: number;
}

/** RULES §11 — quote a single-type buy or sell. */
export function quoteTrade(
  player: PlayerState,
  good: Good,
  direction: 'buy' | 'sell',
  quantity: number,
): TradeQuote {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, reason: 'quantity must be a positive whole number', total: 0 };
  }
  const total = GOOD_VALUES[good] * quantity;
  if (direction === 'buy') {
    if (player.money < total) return { ok: false, reason: 'not enough sestertii', total };
    if (freeStorage(player) < quantity) return { ok: false, reason: 'not enough storage space', total };
  } else {
    if (player.goods[good] < quantity) return { ok: false, reason: `not enough ${good} to sell`, total };
  }
  return { ok: true, total };
}

/** Applies a quoted trade. Caller must have checked `quoteTrade`. */
export function applyTrade(
  player: PlayerState,
  good: Good,
  direction: 'buy' | 'sell',
  quantity: number,
): PlayerState {
  const total = GOOD_VALUES[good] * quantity;
  const goods = cloneGoods(player.goods);
  if (direction === 'buy') {
    goods[good] += quantity;
    return { ...player, goods, money: player.money - total };
  }
  goods[good] -= quantity;
  return { ...player, goods, money: player.money + total };
}

/** The largest legal quantity for a trade — powers the UI's max button. */
export function maxTradeQuantity(player: PlayerState, good: Good, direction: 'buy' | 'sell'): number {
  if (direction === 'sell') return player.goods[good];
  return Math.min(Math.floor(player.money / GOOD_VALUES[good]), freeStorage(player));
}

/* ────────────────────────────────────────────────────── valuation ── */

/** RULES 16.1 — the sale value of everything in the storehouse. */
export function goodsValue(bag: GoodsBag): number {
  return GOODS.reduce((sum, g) => sum + bag[g] * GOOD_VALUES[g], 0);
}

export function goodsCount(bag: GoodsBag): number {
  return totalGoods(bag);
}
