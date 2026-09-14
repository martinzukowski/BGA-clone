/**
 * Positional evaluation, shared by all three difficulties.
 *
 * The dominant term is the player's *actual* score under the real scoring rules,
 * so the AI is optimising the thing that wins the game rather than a proxy.
 * Everything else is a small correction for things the scoreboard cannot see:
 * liquidity, action availability, room to expand, and how close the game is to
 * ending.
 */

import { getCardDef } from '../data/cards';
import { GOOD_VALUES } from '../data/ruleConstants';
import { goodsValue } from '../engine/economy';
import {
  freeStorage,
  getPlayer,
  producedGoodTypes,
  provincesOf,
  stateMap,
} from '../engine/gameState';
import { buildableCities } from '../engine/movement';
import { calculateScore, countByGod, ownedCards } from '../engine/scoring';
import type { CardDefinition, GameState, Good, PlayerId } from '../engine/types';

export interface EvalWeights {
  /** Multiplier on the real score. Always the biggest term. */
  readonly score: number;
  /** Value of a sestertius held. */
  readonly money: number;
  /** Value of a sestertius' worth of goods held. */
  readonly goods: number;
  /** Value of holding brick/food/tool, which are what houses are made of. */
  readonly buildingStock: number;
  /** Value of a card sitting in hand — actions you can still take. */
  readonly handCard: number;
  /** Value of owning a personality card at all — the scoring engine. */
  readonly ownedCard: number;
  /** Value of a city you could build in right now. */
  readonly reach: number;
  /** Value of a house still in supply, i.e. room left to grow. */
  readonly housePotential: number;
  /** Value of a colonist still in the storehouse. */
  readonly colonistPotential: number;
  /** Penalty per empty storage space wasted / bonus for having room. */
  readonly storageRoom: number;
  /** How much the leading opponent's score is subtracted. */
  readonly opponent: number;
  /** Bonus for provinces not yet settled that are within reach. */
  readonly frontier: number;
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  score: 1,
  money: 0.055,
  goods: 0.05,
  buildingStock: 1.15,
  handCard: 0.9,
  ownedCard: 0.45,
  reach: 0.35,
  housePotential: 0.04,
  colonistPotential: 0.12,
  storageRoom: 0.08,
  opponent: 0,
  frontier: 0.5,
};

export const EASY_WEIGHTS: EvalWeights = {
  ...DEFAULT_WEIGHTS,
  // A weaker player sees the scoreboard and its purse, and little else.
  buildingStock: 0.3,
  handCard: 0.35,
  ownedCard: 0.1,
  reach: 0.05,
  housePotential: 0,
  colonistPotential: 0.1,
  frontier: 0.05,
  storageRoom: 0,
};

export const HARD_WEIGHTS: EvalWeights = {
  ...DEFAULT_WEIGHTS,
  opponent: 0.32,
  frontier: 0.62,
  handCard: 1.0,
  reach: 0.42,
};

/**
 * How useful each good is for *building*, as opposed to selling (RULES 8.2).
 * Brick and food are in almost every construction cost; the rest are only
 * wanted for their own city type.
 */
const BUILD_USEFULNESS: Readonly<Record<Good, number>> = {
  brick: 1,
  food: 1,
  tool: 0.7,
  wine: 0.6,
  cloth: 0.6,
};

/**
 * The construction worth of a storehouse.
 *
 * Concave *per good*, which is the whole point: seven bricks and no food cannot
 * build anything at all, while three of each builds three houses. A linear term
 * here makes the AI pile up one commodity and stall.
 */
function stockValue(goods: Readonly<Record<Good, number>>): number {
  let total = 0;
  for (const g of Object.keys(BUILD_USEFULNESS) as Good[]) {
    total += Math.sqrt(Math.min(goods[g], 4)) * BUILD_USEFULNESS[g];
  }
  return total;
}

/**
 * The saturating worth of a hand of `n` cards. The first few are precious; the
 * seventh is nearly free. Without this the AI values a Tribune purely by how
 * many cards it returns, and plays almost nothing else.
 */
function handValue(n: number): number {
  const first = Math.min(n, 3);
  const middle = Math.min(Math.max(n - 3, 0), 3);
  const rest = Math.max(n - 6, 0);
  return first + middle * 0.3 + rest * 0.08;
}

export function evaluatePosition(
  state: GameState,
  playerId: PlayerId,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  const player = getPlayer(state, playerId);
  const map = stateMap(state);

  let value = calculateScore(state, playerId).total * weights.score;

  value += player.money * weights.money;
  value += goodsValue(player.goods) * weights.goods;
  value += stockValue(player.goods) * weights.buildingStock;

  // Cards in hand are worth a lot when you are nearly out and almost nothing
  // when you are flush — what they really buy is *not being forced to Tribune*.
  // A linear term here makes the AI hoard cards and play Tribune on loop.
  value += handValue(player.hand.length) * weights.handCard;
  value += (player.hand.length + player.discard.length) * weights.ownedCard;

  // Room to grow is worth something, but with steeply diminishing returns.
  value += Math.sqrt(player.housesRemaining) * weights.housePotential * 3;
  value += (player.reserveColonists.land + player.reserveColonists.sea) * weights.colonistPotential;
  value += Math.min(freeStorage(player), 4) * weights.storageRoom;

  // Places to build right now.
  const reachable = buildableCities(state, playerId);
  value += reachable.length * weights.reach;

  // Provinces you could still claim from where you stand (Saturnus is the
  // steepest scoring curve in the game, so being near a fresh one matters).
  const settled = new Set(provincesOf(state, playerId));
  const frontier = new Set<string>();
  for (const cityId of reachable) {
    const provinceId = map.cities.find((c) => c.id === cityId)?.provinceId;
    if (provinceId && !settled.has(provinceId)) frontier.add(provinceId);
  }
  value += frontier.size * weights.frontier;

  if (weights.opponent > 0) {
    let best = 0;
    for (const other of state.players) {
      if (other.id === playerId) continue;
      best = Math.max(best, calculateScore(state, other.id).total);
    }
    value -= best * weights.opponent;
  }

  return value;
}

/* ─────────────────────────────────────────── house-level valuation ── */

export interface HouseValueContext {
  readonly jupiter: number;
  readonly saturnus: number;
  readonly mercurius: number;
  readonly minervaByGood: Readonly<Partial<Record<Good, number>>>;
  readonly settledProvinces: ReadonlySet<string>;
  readonly producedGoods: ReadonlySet<Good>;
  /**
   * How much the AI values a good it does not yet produce, over and above the
   * gods — it expects to buy more cards before the game ends.
   */
  readonly speculative: number;
}

export function houseValueContext(
  state: GameState,
  playerId: PlayerId,
  speculative = 1.4,
): HouseValueContext {
  const cards: CardDefinition[] = ownedCards(state, playerId);
  const counts = countByGod(cards);
  const minervaByGood: Partial<Record<Good, number>> = {};
  for (const c of cards) {
    if (c.god === 'minerva' && c.specialistGood) {
      minervaByGood[c.specialistGood] =
        (minervaByGood[c.specialistGood] ?? 0) + (c.minervaValue ?? 0);
    }
  }
  return {
    jupiter: counts.jupiter,
    saturnus: counts.saturnus,
    mercurius: counts.mercurius,
    minervaByGood,
    settledProvinces: new Set(provincesOf(state, playerId)),
    producedGoods: new Set(producedGoodTypes(state, playerId)),
    speculative,
  };
}

/**
 * Roughly what a house in this city would be worth, in victory points, if the
 * game ended with the player's current card mix — plus a speculative allowance
 * for cards they have not bought yet.
 */
export function houseValue(
  state: GameState,
  cityId: string,
  ctx: HouseValueContext,
): number {
  const good = state.cityGoods[cityId];
  if (!good) return 0;
  const map = stateMap(state);
  const provinceId = map.cities.find((c) => c.id === cityId)?.provinceId ?? null;

  let value = 0;
  if (good !== 'brick') value += ctx.jupiter + ctx.speculative * 0.9;
  if (provinceId && !ctx.settledProvinces.has(provinceId)) {
    value += ctx.saturnus + ctx.speculative * 1.5;
  }
  if (!ctx.producedGoods.has(good)) value += 2 * ctx.mercurius + ctx.speculative * 1.1;
  value += ctx.minervaByGood[good] ?? 0;

  // A house is also an income stream: it produces its good whenever the province
  // is prefected or the matching specialist is played.
  value += GOOD_VALUES[good] * 0.28;

  return value;
}

/** What a build actually costs, expressed in the same units as `houseValue`. */
export function buildCostPenalty(coins: number, goods: readonly Good[]): number {
  const goodsWorth = goods.reduce((s, g) => s + GOOD_VALUES[g], 0);
  return (coins + goodsWorth) * 0.09;
}

/** How badly the player wants each good right now — drives Mercator decisions. */
export function goodDemand(state: GameState, playerId: PlayerId): Record<Good, number> {
  const player = getPlayer(state, playerId);
  const ctx = houseValueContext(state, playerId);
  const demand: Record<Good, number> = { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 };

  // Bricks and food build almost everything; tools build the middling cities.
  demand.brick += 2.4;
  demand.food += 2.0;
  demand.tool += 1.0;

  // Goods needed for the specific cities within reach.
  for (const cityId of buildableCities(state, playerId)) {
    const good = state.cityGoods[cityId];
    if (!good) continue;
    const worth = houseValue(state, cityId, ctx);
    if (good === 'brick') demand.food += worth * 0.25;
    else {
      demand.brick += worth * 0.18;
      demand[good] += worth * 0.3;
    }
  }

  // Goods needed to buy the cards currently on offer.
  for (const cardId of state.display) {
    if (!cardId) continue;
    const inst = state.cards[cardId];
    if (!inst) continue;
    // Cheap proxy: the card's printed cost is what it will take.
    for (const item of costOf(state, cardId)) {
      if (item !== 'any') demand[item] += 0.5;
    }
  }

  // Appetite falls away sharply once a few units are in store — a fourth brick
  // is worth far less than a first food.
  for (const g of Object.keys(demand) as Good[]) {
    demand[g] = Math.max(0, demand[g] / (1 + player.goods[g] * 0.9));
  }
  return demand;
}

function costOf(state: GameState, cardId: string): readonly (Good | 'any')[] {
  const inst = state.cards[cardId];
  return inst ? getCardDef(inst.defId).cost : [];
}
