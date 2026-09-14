/**
 * EVERY TUNABLE NUMBER IN THE GAME.
 *
 * No rule logic lives here and no number lives outside here. If a rule turns out
 * to be wrong, it is corrected in this file and nowhere else.
 *
 * Constants whose value could not be confirmed from a primary source are marked
 *   ⚠ RULE_REVIEW_REQUIRED
 * and are listed in the register at the bottom of docs/RULES.md.
 */

import type { CostItem, Good } from '../engine/types';

/* ─────────────────────────────────────────────── goods & prices (2.3) ── */

export const GOODS: readonly Good[] = ['brick', 'food', 'tool', 'wine', 'cloth'] as const;

/** RULES 2.3 — buy price, sell price, Vesta valuation and bonus-marker ranking. */
export const GOOD_VALUES: Readonly<Record<Good, number>> = {
  brick: 3,
  food: 4,
  tool: 5,
  wine: 6,
  cloth: 7,
};

/* ───────────────────────────────────────────── player components (2.1) ── */

export const HOUSES_PER_PLAYER = 15;
export const STOREHOUSE_CAPACITY = 12;
export const MAX_COLONISTS_ON_BOARD = 6;
export const STARTING_COLONISTS_ON_BOARD = { land: 1, sea: 1 } as const;
export const STARTING_COLONISTS_IN_RESERVE = { land: 2, sea: 2 } as const;

/** RULES 4.7 — 2 food, 1 cloth, 1 wine, 1 brick, 1 tool. */
export const STARTING_GOODS: Readonly<Record<Good, number>> = {
  brick: 1,
  food: 2,
  tool: 1,
  wine: 1,
  cloth: 1,
};

/** RULES 4.8 — start player gets this; each later player one more. */
export const STARTING_MONEY_FIRST_PLAYER = 5;
export const STARTING_MONEY_INCREMENT = 1;

/* ─────────────────────────────────────────────────── construction (8) ── */

/** RULES 8.3 — base coin cost by the city's good type. */
export const BUILD_COIN_COST: Readonly<Record<Good, number>> = {
  brick: 1,
  food: 2,
  tool: 3,
  wine: 4,
  cloth: 5,
};

/**
 * RULES 8.2 — goods cost by the city's good type.
 * A brick city costs 1 food; every other city costs 1 brick + 1 of its own good.
 */
export function buildGoodsCost(cityGood: Good): readonly Good[] {
  return cityGood === 'brick' ? ['food'] : ['brick', cityGood];
}

/* ───────────────────────────────────────────────────── card actions ── */

/** RULES 6.3 step 1. */
export const MERCATOR_MONEY_STARTING_CARD = 3;
export const MERCATOR_MONEY_PURCHASED_CARD = 5;

/** RULES 6.3 step 2 — at most this many distinct goods types per Mercator. */
export const MERCATOR_MAX_GOODS_TYPES = 2;

/** RULES 6.4a / 6.8 step 3 — the price of one new colonist. */
export const COLONIST_COST: readonly Good[] = ['food', 'tool'];

/** RULES 6.4b. */
export const COLONIST_MONEY_BASE = 5;
export const COLONIST_MONEY_PER_COLONIST = 1;

/** RULES 6.8 step 2 — 1₴ per recovered card beyond this many. */
export const TRIBUNE_FREE_CARDS = 3;

/** RULES 6.6. */
export const SENATOR_MAX_PURCHASES = 2;
/** RULES 6.7. */
export const CONSUL_MAX_PURCHASES = 1;

/* ─────────────────────────────────────────────────── card display (12) ── */

export const DISPLAY_SIZE = 7;

/**
 * RULES 12.2 — surcharge added to a card's printed cost, by 1-based position.
 * Index 0 is unused so the array reads like the rulebook's positions.
 *
 * Positions 1, 3, 4 and 6 are confirmed by the publisher's two worked examples.
 * ⚠ RULE_REVIEW_REQUIRED: positions 2, 5 and 7 are interpolated/extrapolated to
 * keep the surcharge monotonically non-decreasing from left to right.
 */
export const DISPLAY_POSITION_COSTS: readonly (readonly CostItem[])[] = [
  [], // index 0 — unused
  [], // 1 — confirmed free
  [], // 2 — ⚠ RULE_REVIEW_REQUIRED
  ['any'], // 3 — confirmed
  ['cloth'], // 4 — confirmed
  ['any', 'any'], // 5 — ⚠ RULE_REVIEW_REQUIRED
  ['any', 'cloth'], // 6 — confirmed
  ['any', 'any', 'cloth'], // 7 — ⚠ RULE_REVIEW_REQUIRED
];

/**
 * RULES 6.6 — whether the display slides left between the Senator's two
 * purchases (which would make the second card cheaper).
 * ⚠ RULE_REVIEW_REQUIRED — the rulebook's example is consistent with `false`.
 */
export const SENATOR_COMPACTS_BETWEEN_PURCHASES = false;

/* ────────────────────────────────────────────────── province bonuses ── */

/**
 * RULES 4.4 — coins shown on the reverse of a bonus marker, by its good type.
 * ⚠ RULE_REVIEW_REQUIRED — only the aggregate behaviour is documented
 * (1₴ per visible coin; the publisher's example shows 6 markers worth 10 coins).
 */
export const BONUS_MARKER_COIN_VALUES: Readonly<Record<Good, number>> = {
  brick: 1,
  food: 1,
  tool: 2,
  wine: 2,
  cloth: 3,
};

/* ──────────────────────────────────────────────────────── diplomat ── */

/**
 * RULES 6.5 — a Diplomat showing on top of a discard pile is not a legal copy
 * target. ⚠ RULE_REVIEW_REQUIRED (interpretation of "players who recently used
 * a Diplomat ... cannot be copied").
 */
export const DIPLOMAT_CAN_COPY_DIPLOMAT = false;

/* ───────────────────────────────────────────────────────── scoring ── */

/** RULES 16.4 — VP per distinct good type produced, per Mercurius card. */
export const MERCURIUS_VP_PER_GOOD_TYPE = 2;
/** RULES 16.5 — VP per colonist, per Mars card. */
export const MARS_VP_PER_COLONIST = 2;
/** RULES 16.1 — sestertii per Vesta VP. */
export const VESTA_SESTERTII_PER_VP = 10;
/** RULES 16.7 */
export const CONCORDIA_CARD_VP = 7;

/**
 * RULES 6.9 / 16.6 — Minerva VP per matching city, by specialist good.
 * Food (3), tool (3) and wine (4) are confirmed.
 * ⚠ RULE_REVIEW_REQUIRED: brick (Mason) and cloth (Weaver) are extrapolated from
 * the rarity of those city types.
 */
export const MINERVA_VP: Readonly<Record<Good, number>> = {
  brick: 2, // ⚠ RULE_REVIEW_REQUIRED
  food: 3,
  tool: 3,
  wine: 4,
  cloth: 5, // ⚠ RULE_REVIEW_REQUIRED
};

/* ──────────────────────────────────────────── intermediate scoring (14) ── */

/** Off by default — the publisher recommends it only for a first game. */
export const ENABLE_INTERMEDIATE_SCORING = false;
export const INTERMEDIATE_SCORING_AWARDS = [2, 1] as const;

/* ─────────────────────────────────────────────────────────── misc ── */

/** Save-format version stamped into every `GameState`. Bump on breaking changes. */
export const STATE_VERSION = 1;

/**
 * RULES 4.2 — the global city-token distribution used by `mare-nostrum`.
 * ⚠ RULE_REVIEW_REQUIRED — this is an original map, so this is a design choice:
 * cheap goods are common, expensive goods are rare.
 */
export const CITY_TOKEN_DISTRIBUTION: Readonly<Record<Good, number>> = {
  brick: 9,
  food: 8,
  tool: 6,
  wine: 4,
  cloth: 3,
};
