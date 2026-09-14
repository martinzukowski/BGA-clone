/**
 * MEDIUM — a solid club player.
 *
 * Full candidate generation, the full evaluation, and it simply takes the best
 * resulting position. It understands resource needs, expansion value, card
 * synergy, warehouse pressure and movement efficiency, because all of those are
 * terms in `evaluatePosition` and in the house valuation that drives movement.
 * What it does not do is think about what happens next.
 */

import type { RngCursor } from '../engine/rng';
import type { GameState } from '../engine/types';
import { DEFAULT_WEIGHTS, evaluatePosition } from './evaluation';
import { FULL_LIMITS, generateTurnPlans, type TurnPlan } from './moveGeneration';

export function chooseMedium(state: GameState, rng: RngCursor): TurnPlan | null {
  const plans = generateTurnPlans(state, FULL_LIMITS);
  if (plans.length === 0) return null;
  const me = state.currentPlayer;

  let best: TurnPlan | null = null;
  let bestValue = -Infinity;
  for (const p of plans) {
    // A whisper of noise only, to break ties without changing decisions.
    const value = evaluatePosition(p.result, me, DEFAULT_WEIGHTS) + rng.float() * 0.05;
    if (value > bestValue) {
      bestValue = value;
      best = p;
    }
  }
  return best;
}
