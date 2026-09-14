/**
 * EASY — a merchant who has understood the rules but not the game.
 *
 * It generates only a shallow set of candidates, judges them with a blunt
 * evaluation that mostly notices the scoreboard and its purse, and then picks
 * with a lot of noise. It will build, trade and buy cards — it just will not
 * plan. It quite often takes a visibly second-best option.
 */

import type { RngCursor } from '../engine/rng';
import type { GameState } from '../engine/types';
import { EASY_WEIGHTS, evaluatePosition } from './evaluation';
import { generateTurnPlans, SHALLOW_LIMITS, type TurnPlan } from './moveGeneration';

/** How often the easy AI ignores its own judgement entirely. */
const BLUNDER_RATE = 0.3;

export function chooseEasy(state: GameState, rng: RngCursor): TurnPlan | null {
  const plans = generateTurnPlans(state, SHALLOW_LIMITS);
  if (plans.length === 0) return null;
  const me = state.currentPlayer;

  if (rng.float() < BLUNDER_RATE) return rng.pick(plans);

  const scored = plans
    .map((p) => ({ p, v: evaluatePosition(p.result, me, EASY_WEIGHTS) + rng.float() * 2.5 }))
    .sort((a, b) => b.v - a.v);

  // Choose from the better half rather than the best — competent, not sharp.
  const pool = scored.slice(0, Math.max(1, Math.ceil(scored.length / 2)));
  return rng.pick(pool).p;
}
