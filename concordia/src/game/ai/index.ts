/**
 * The AI's public interface.
 *
 * `chooseTurn` returns a *sequence of engine actions*, never a state. The AI
 * therefore plays by exactly the same rules the human does — it cannot reach
 * into the state, and every AI turn is replayable and animatable.
 */

import { RngCursor } from '../engine/rng';
import type { AiDifficulty, GameAction, GameState } from '../engine/types';
import { chooseEasy } from './easy';
import { chooseHard } from './hard';
import { chooseMedium } from './medium';
import { generateTurnPlans, SHALLOW_LIMITS, type TurnPlan } from './moveGeneration';

export interface AiTurn {
  readonly actions: readonly GameAction[];
  /** A short human-readable description, e.g. "Architectus — expand, 2 houses". */
  readonly label: string;
  readonly difficulty: AiDifficulty;
}

/**
 * Deterministic per state: the same position always produces the same turn.
 * The seed is derived from the game's own RNG plus the turn number, so a game
 * replays identically without the AI having to mutate engine state.
 */
function rngFor(state: GameState): RngCursor {
  return new RngCursor((state.rng.seed ^ Math.imul(state.turnNumber + 1, 2654435761)) >>> 0);
}

export function chooseTurn(state: GameState, difficulty: AiDifficulty): AiTurn {
  const rng = rngFor(state);
  let plan: TurnPlan | null = null;

  switch (difficulty) {
    case 'easy':
      plan = chooseEasy(state, rng);
      break;
    case 'medium':
      plan = chooseMedium(state, rng);
      break;
    case 'hard':
      plan = chooseHard(state, rng);
      break;
  }

  if (!plan) {
    // Should be unreachable — the engine guarantees a legal card play exists.
    const fallback = generateTurnPlans(state, SHALLOW_LIMITS)[0];
    if (!fallback) throw new Error('The AI found no legal turn, which should be impossible.');
    plan = fallback;
  }

  return { actions: plan.actions, label: plan.label, difficulty };
}

export { generateTurnPlans, simulate, type TurnPlan } from './moveGeneration';
export { evaluatePosition, DEFAULT_WEIGHTS, HARD_WEIGHTS, EASY_WEIGHTS } from './evaluation';
