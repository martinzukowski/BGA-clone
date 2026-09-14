/**
 * RULES §16 — final (and intermediate) scoring.
 *
 * `calculateScore` returns a full breakdown with a written explanation for every
 * line, because the scoring screen has to answer "why?" and not just "how much?".
 */

import { getCardDef } from '../data/cards';
import {
  CONCORDIA_CARD_VP,
  MARS_VP_PER_COLONIST,
  MERCURIUS_VP_PER_GOOD_TYPE,
  VESTA_SESTERTII_PER_VP,
} from '../data/ruleConstants';
import { goodsValue } from './economy';
import {
  citiesOf,
  colonistsOnBoard,
  getPlayer,
  producedGoodTypes,
  provincesOf,
  stateMap,
} from './gameState';
import type { CardDefinition, GameState, God, PlayerId, ScoreBreakdown, ScoreLine } from './types';

/** Every personality card a player owns — hand *and* discard pile (RULES §16). */
export function ownedCards(state: GameState, playerId: PlayerId): CardDefinition[] {
  const p = getPlayer(state, playerId);
  return [...p.hand, ...p.discard].map((id) => {
    const inst = state.cards[id];
    if (!inst) throw new Error(`Unknown card ${id}`);
    return getCardDef(inst.defId);
  });
}

export function countByGod(cards: readonly CardDefinition[]): Record<God, number> {
  const counts: Record<God, number> = {
    vesta: 0,
    jupiter: 0,
    saturnus: 0,
    mercurius: 0,
    mars: 0,
    minerva: 0,
  };
  for (const c of cards) counts[c.god]++;
  return counts;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function calculateScore(state: GameState, playerId: PlayerId): ScoreBreakdown {
  const player = getPlayer(state, playerId);
  const map = stateMap(state);
  const cards = ownedCards(state, playerId);
  const counts = countByGod(cards);
  const lines: ScoreLine[] = [];

  /* ── Vesta (16.1) — wealth ─────────────────────────────── */
  const stockValue = goodsValue(player.goods);
  const wealth = player.money + stockValue;
  const vestaPer = Math.floor(wealth / VESTA_SESTERTII_PER_VP);
  lines.push({
    god: 'vesta',
    cards: counts.vesta,
    perCard: vestaPer,
    points: vestaPer * counts.vesta,
    explanation:
      `${player.money}₴ in hand plus ${stockValue}₴ of goods = ${wealth}₴, ` +
      `which is ${vestaPer} VP per Vesta card (1 per full ${VESTA_SESTERTII_PER_VP}₴).`,
  });

  /* ── Jupiter (16.2) — houses outside brick cities ──────── */
  const myCities = citiesOf(state, playerId);
  const nonBrick = myCities.filter((c) => state.cityGoods[c] !== 'brick').length;
  lines.push({
    god: 'jupiter',
    cards: counts.jupiter,
    perCard: nonBrick,
    points: nonBrick * counts.jupiter,
    explanation:
      `${plural(nonBrick, 'house')} in cities that do not make brick ` +
      `(of ${plural(myCities.length, 'house')} in all).`,
  });

  /* ── Saturnus (16.3) — provinces settled ───────────────── */
  const provinces = provincesOf(state, playerId);
  lines.push({
    god: 'saturnus',
    cards: counts.saturnus,
    perCard: provinces.length,
    points: provinces.length * counts.saturnus,
    explanation:
      provinces.length === 0
        ? 'No province holds one of your houses.'
        : `A house in ${plural(provinces.length, 'province')} of ${map.provinces.length}: ` +
          provinces.map((id) => map.provinces.find((p) => p.id === id)?.name ?? id).join(', ') + '.',
  });

  /* ── Mercurius (16.4) — variety of production ──────────── */
  const types = producedGoodTypes(state, playerId);
  const mercPer = types.length * MERCURIUS_VP_PER_GOOD_TYPE;
  lines.push({
    god: 'mercurius',
    cards: counts.mercurius,
    perCard: mercPer,
    points: mercPer * counts.mercurius,
    explanation:
      types.length === 0
        ? 'Your houses produce nothing yet.'
        : `You produce ${plural(types.length, 'kind')} of goods (${types.join(', ')}), ` +
          `worth ${MERCURIUS_VP_PER_GOOD_TYPE} VP each.`,
  });

  /* ── Mars (16.5) — colonists afield ────────────────────── */
  const colonists = colonistsOnBoard(state, playerId);
  const marsPer = colonists * MARS_VP_PER_COLONIST;
  lines.push({
    god: 'mars',
    cards: counts.mars,
    perCard: marsPer,
    points: marsPer * counts.mars,
    explanation: `${plural(colonists, 'colonist')} on the board, worth ${MARS_VP_PER_COLONIST} VP each.`,
  });

  /* ── Minerva (16.6) — each specialist scores alone ─────── */
  const specialists = cards.filter((c) => c.god === 'minerva' && c.specialistGood);
  let minervaPoints = 0;
  const minervaParts: string[] = [];
  for (const card of specialists) {
    const good = card.specialistGood!;
    const matching = myCities.filter((c) => state.cityGoods[c] === good).length;
    const pts = matching * (card.minervaValue ?? 0);
    minervaPoints += pts;
    minervaParts.push(`${card.title} — ${plural(matching, `${good} city`, `${good} cities`)} × ${card.minervaValue} = ${pts}`);
  }
  lines.push({
    god: 'minerva',
    cards: specialists.length,
    perCard: specialists.length ? Math.round(minervaPoints / specialists.length) : 0,
    points: minervaPoints,
    explanation: minervaParts.length ? minervaParts.join('; ') + '.' : 'You own no specialists.',
  });

  /* ── Concordia (16.7) ──────────────────────────────────── */
  if (state.concordiaHolder === playerId) {
    lines.push({
      god: 'concordia',
      cards: 1,
      perCard: CONCORDIA_CARD_VP,
      points: CONCORDIA_CARD_VP,
      explanation: 'You brought the game to its end and took the Concordia card.',
    });
  }

  const total = lines.reduce((s, l) => s + l.points, 0);
  return { playerId, lines, total };
}

/** Just the number — used by the AI's evaluation on hot paths. */
export function scoreTotal(state: GameState, playerId: PlayerId): number {
  return calculateScore(state, playerId).total;
}

/**
 * RULES 14.1 — the same computation, but the Concordia card cannot be in play
 * yet, so this is simply `calculateScore`.
 */
export const intermediateScore = calculateScore;
