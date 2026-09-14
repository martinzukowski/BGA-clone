/**
 * RULES §12 — the card display (the forum).
 *
 * Pricing, compaction and refill. Purchase *effects* live in `actions.ts`; this
 * module only knows what a card costs and how the row behaves.
 */

import { getCardDef } from '../data/cards';
import { DISPLAY_POSITION_COSTS, DISPLAY_SIZE } from '../data/ruleConstants';
import type { CardDefinition, CardId, CostItem, GameState } from './types';

/** 1-based position → the card sitting there, or `undefined`. */
export function cardAtPosition(state: GameState, position: number): CardId | undefined {
  if (position < 1 || position > DISPLAY_SIZE) return undefined;
  return state.display[position - 1] ?? undefined;
}

export function definitionAtPosition(state: GameState, position: number): CardDefinition | undefined {
  const id = cardAtPosition(state, position);
  if (!id) return undefined;
  const instance = state.cards[id];
  return instance ? getCardDef(instance.defId) : undefined;
}

/** RULES 12.2 — the surcharge printed beneath a display position. */
export function positionSurcharge(position: number): readonly CostItem[] {
  return DISPLAY_POSITION_COSTS[position] ?? [];
}

/**
 * The full price of the card at `position`.
 *
 * A Senator pays card cost + position surcharge (RULES 6.6); a Consul pays the
 * card cost only (RULES 6.7).
 */
export function priceAtPosition(
  state: GameState,
  position: number,
  mode: 'senator' | 'consul',
): readonly CostItem[] | undefined {
  const def = definitionAtPosition(state, position);
  if (!def) return undefined;
  return mode === 'consul' ? def.cost : [...def.cost, ...positionSurcharge(position)];
}

/** Empties a display slot. The gap is closed later by `compactAndRefill`. */
export function removeFromDisplay(state: GameState, position: number): GameState {
  const display = state.display.slice();
  display[position - 1] = null;
  return { ...state, display };
}

export interface RefillResult {
  readonly state: GameState;
  /** Cards drawn from the stack, with the position each landed in. */
  readonly drawn: readonly { readonly cardId: CardId; readonly position: number }[];
  /** True if any card moved left. */
  readonly compacted: boolean;
}

/**
 * RULES 12.3 — slide everything left, then top up to seven from the stack.
 * Called once at the end of a purchasing action.
 */
export function compactAndRefill(state: GameState): RefillResult {
  const before = state.display;
  const kept = before.filter((c): c is CardId => c !== null);
  const compacted = kept.some((id, i) => before[i] !== id);

  const stack = state.stack.slice();
  const drawn: { cardId: CardId; position: number }[] = [];
  const display: (CardId | null)[] = kept.slice();

  while (display.length < DISPLAY_SIZE && stack.length > 0) {
    const cardId = stack.shift()!;
    drawn.push({ cardId, position: display.length + 1 });
    display.push(cardId);
  }
  while (display.length < DISPLAY_SIZE) display.push(null);

  return { state: { ...state, display, stack }, drawn, compacted };
}

/** RULES 15.1 — has the display been emptied? */
export function displayIsEmpty(state: GameState): boolean {
  return state.display.every((c) => c === null);
}

export function displayCardCount(state: GameState): number {
  return state.display.filter((c) => c !== null).length;
}

/** Every occupied position, left to right. */
export function occupiedPositions(state: GameState): number[] {
  const out: number[] = [];
  for (let i = 0; i < state.display.length; i++) if (state.display[i]) out.push(i + 1);
  return out;
}

export function cardDef(state: GameState, cardId: CardId): CardDefinition {
  const inst = state.cards[cardId];
  if (!inst) throw new Error(`Unknown card instance ${cardId}`);
  return getCardDef(inst.defId);
}

/** The card showing on top of a player's discard pile, if any (RULES 5.2). */
export function topOfDiscard(state: GameState, playerId: number): CardId | undefined {
  const p = state.players[playerId];
  if (!p || p.discard.length === 0) return undefined;
  return p.discard[p.discard.length - 1];
}
