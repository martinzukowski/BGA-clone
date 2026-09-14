/**
 * HARD — a merchant who is playing the whole game, not the turn.
 *
 * Three things separate it from Medium:
 *
 *  1. **Opponent awareness.** Its evaluation subtracts the leading opponent's
 *     score, so it will spend a turn denying a runaway rather than padding its
 *     own position by a point.
 *  2. **Lookahead.** The most promising candidates are re-examined one turn
 *     deeper: the AI asks "and what would my *next* turn look like from there?"
 *     This is what stops it from, say, spending its last useful card for a
 *     one-point gain, or moving a colonist somewhere it cannot afford to build.
 *  3. **Endgame timing.** It knows what triggering the end is worth *to it*,
 *     and will either race for the Concordia card or deliberately slow down.
 */

import { colonistsOnBoard, freeStorage, getPlayer } from '../engine/gameState';
import type { RngCursor } from '../engine/rng';
import { calculateScore } from '../engine/scoring';
import type { GameState, PlayerId } from '../engine/types';
import { evaluatePosition, HARD_WEIGHTS } from './evaluation';
import {
  FULL_LIMITS,
  generateTurnPlans,
  SHALLOW_LIMITS,
  type TurnPlan,
} from './moveGeneration';

/** How many candidates survive to the deeper look. */
const LOOKAHEAD_WIDTH = 7;
/** How much a hypothetical *next* turn counts against a real one. */
const LOOKAHEAD_DISCOUNT = 0.5;

export function chooseHard(state: GameState, rng: RngCursor): TurnPlan | null {
  const plans = generateTurnPlans(state, FULL_LIMITS);
  if (plans.length === 0) return null;
  const me = state.currentPlayer;

  const scored = plans
    .map((p) => ({
      plan: p,
      value: evaluatePosition(p.result, me, HARD_WEIGHTS) + endgameAdjustment(state, p, me) + rng.float() * 0.05,
    }))
    .sort((a, b) => b.value - a.value);

  const finalists = scored.slice(0, LOOKAHEAD_WIDTH);
  let best = finalists[0]!;
  let bestValue = -Infinity;

  for (const candidate of finalists) {
    const deep = candidate.value + LOOKAHEAD_DISCOUNT * nextTurnPotential(candidate.plan.result, me);
    if (deep > bestValue) {
      bestValue = deep;
      best = candidate;
    }
  }

  return best.plan;
}

/**
 * The value of the best turn the player could take *next*, evaluated on a
 * hypothetical where the turn comes straight back to them.
 *
 * This deliberately ignores what opponents do in between. Modelling their
 * replies exactly would be far more expensive and, in a game where players
 * mostly cannot take things away from each other, would change very little —
 * the market and the province markers are the only real interaction, and both
 * are already priced into the evaluation.
 */
function nextTurnPotential(state: GameState, me: PlayerId): number {
  if (state.phase === 'finished') return 0;
  const player = getPlayer(state, me);
  if (player.hand.length === 0) return 0;

  const hypothetical: GameState = { ...state, currentPlayer: me, pending: null };
  const plans = generateTurnPlans(hypothetical, SHALLOW_LIMITS);
  if (plans.length === 0) return 0;

  let best = -Infinity;
  for (const p of plans) {
    best = Math.max(best, evaluatePosition(p.result, me, HARD_WEIGHTS));
  }
  const now = evaluatePosition(hypothetical, me, HARD_WEIGHTS);
  return Math.max(0, best - now);
}

/**
 * RULES §15 — what ending the game is worth right now.
 *
 * Triggering the end hands over the Concordia card (7 VP, already counted in the
 * evaluation) but also freezes everyone's position. That is excellent when
 * ahead and poor when behind, and the size of the effect scales with how much
 * growth the player is giving up.
 */
function endgameAdjustment(before: GameState, plan: TurnPlan, me: PlayerId): number {
  const after = plan.result;
  const triggered = before.concordiaHolder === null && after.concordiaHolder !== null;

  let adjustment = 0;

  if (triggered) {
    const myScore = calculateScore(after, me).total;
    let bestOpponent = 0;
    for (const p of after.players) {
      if (p.id === me) continue;
      bestOpponent = Math.max(bestOpponent, calculateScore(after, p.id).total);
    }
    const lead = myScore - bestOpponent;

    if (after.concordiaHolder === me) {
      // Racing is right when ahead, wrong when behind — and the more room the
      // player still has to grow, the more an early finish costs them.
      const unusedPotential =
        getPlayer(after, me).housesRemaining * 0.35 +
        (getPlayer(after, me).reserveColonists.land + getPlayer(after, me).reserveColonists.sea) * 0.6;
      adjustment += lead * 0.55 - unusedPotential;
    }
  }

  // A storehouse with no room is a storehouse that throws production away.
  const player = getPlayer(after, me);
  if (freeStorage(player) === 0) adjustment -= 1.4;

  // Colonists left in the storehouse late in the game are 2 VP each, unclaimed.
  const cardsLeft = after.stack.length + after.display.filter(Boolean).length;
  if (cardsLeft <= 6) {
    const idle = player.reserveColonists.land + player.reserveColonists.sea;
    adjustment -= idle * 0.5;
    // ...and so is money that will never be spent.
    if (colonistsOnBoard(after, me) >= 5) adjustment += 0.4;
  }

  return adjustment;
}
