/**
 * The Hint button's brain.
 *
 * "Optimal" means exactly what it means for the Hard AI: the same candidate
 * generation, the same evaluation weights, the same lookahead where one is
 * available. A hint is never a separate, weaker opinion of the position — it
 * is the AI's own opinion, made visible.
 *
 * Two shapes of hint, chosen by where you are in your turn:
 *
 *  - **Choosing a card** (`pending === null`): a full `chooseHard`-quality
 *    plan — which card, and what to do with it, right through to `END_ACTION`.
 *  - **Mid-action** (a card is already on the table): the best way to finish
 *    resolving *that* card, reusing the same per-role suffix generation the
 *    AI itself uses. `architect:build` is handled separately, because by then
 *    movement is already spent and the shared suffix generator — built to be
 *    entered only at the start of an Architect action — has nothing to offer.
 */

import {
  buildCostPenalty,
  evaluatePosition,
  HARD_WEIGHTS,
  houseValue,
  houseValueContext,
} from './evaluation';
import { chooseHard } from './hard';
import { FULL_LIMITS, simulate, suffixesFor } from './moveGeneration';
import { RngCursor } from '../engine/rng';
import { buildOptions } from '../engine/validation';
import type { GameAction, GameState, PlayerId } from '../engine/types';

export interface Hint {
  readonly actions: readonly GameAction[];
  readonly label: string;
  /** The card this hint would play, when it starts with one — lets the UI glow it in hand. */
  readonly cardId: string | null;
}

/** Fixed, so the same position always gets the same suggestion. */
const HINT_SEED = 0x4a3c2b1a;

export function computeHint(state: GameState, playerId: PlayerId): Hint | null {
  if (state.phase === 'finished' || state.currentPlayer !== playerId) return null;

  if (state.pending === null) {
    const plan = chooseHard(state, new RngCursor(HINT_SEED));
    if (!plan) return null;
    const first = plan.actions[0];
    const cardId = first && first.type === 'PLAY_CARD' ? first.cardId : null;
    return { actions: plan.actions, label: plan.label, cardId };
  }

  if (state.pending.step === 'architect:build') {
    return bestBuildOnly(state, playerId);
  }

  const suffixes = suffixesFor(state, playerId, state.pending.role, FULL_LIMITS);
  let best: { actions: readonly GameAction[]; label: string; value: number } | null = null;
  for (const suffix of suffixes) {
    const result = simulate(state, suffix.actions);
    if (!result) continue;
    const value = evaluatePosition(result, playerId, HARD_WEIGHTS);
    if (!best || value > best.value) {
      best = { actions: suffix.actions, label: suffix.label, value };
    }
  }
  return best ? { actions: best.actions, label: best.label, cardId: null } : null;
}

/** Ranks the cities still buildable this turn — the one case the shared suffix generator can't reach. */
function bestBuildOnly(state: GameState, playerId: PlayerId): Hint {
  const ctx = houseValueContext(state, playerId);
  let best: { cityId: string; net: number } | null = null;
  for (const option of buildOptions(state, playerId)) {
    if (!option.affordable) continue;
    const net = houseValue(state, option.cityId, ctx) - buildCostPenalty(option.coins, option.goods);
    if (!best || net > best.net) best = { cityId: option.cityId, net };
  }
  if (!best) {
    return { actions: [{ type: 'END_ACTION' }], label: 'finish — nothing worth raising here', cardId: null };
  }
  return {
    actions: [{ type: 'BUILD_HOUSE', cityId: best.cityId }, { type: 'END_ACTION' }],
    label: `build in ${best.cityId}`,
    cardId: null,
  };
}
