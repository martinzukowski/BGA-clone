/**
 * RULES §15 (end of game) and §16.8 (ranking and the tiebreak).
 */

import { calculateScore } from './scoring';
import type { FinalStanding, GameState, PlayerId } from './types';

export function isGameOver(state: GameState): boolean {
  return state.phase === 'finished';
}

export function endGameTriggered(state: GameState): boolean {
  return state.concordiaHolder !== null;
}

/** How many turns are still owed before the reckoning (RULES 15.3). */
export function finalTurnsRemaining(state: GameState): number {
  if (state.phase !== 'finalTurns') return 0;
  // The current player is mid-turn, so they count too.
  return state.finalTurnQueue.length + 1;
}

/**
 * RULES 16.8 — the Praefectus Magnus breaks ties. If its holder is not among the
 * tied players, the tie goes to whichever tied player would receive it next,
 * which is the nearest player anticlockwise from the current holder.
 */
function tiebreakRank(state: GameState, playerId: PlayerId): number {
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if ((state.praefectusMagnus - i + n * 2) % n === playerId) return i;
  }
  return n;
}

export function finalStandings(state: GameState): FinalStanding[] {
  const scored = state.players.map((p) => ({
    playerId: p.id,
    breakdown: calculateScore(state, p.id),
    tiebreak: tiebreakRank(state, p.id),
  }));

  scored.sort((a, b) => b.breakdown.total - a.breakdown.total || a.tiebreak - b.tiebreak);

  return scored.map((entry, i) => {
    const tiedWithBetterOrEqual = scored.filter((o) => o.breakdown.total === entry.breakdown.total);
    return {
      playerId: entry.playerId,
      rank: i + 1,
      breakdown: entry.breakdown,
      // Flagged only when the tiebreak actually decided this player's placing.
      wonTiebreak: tiedWithBetterOrEqual.length > 1 && tiedWithBetterOrEqual[0]!.playerId === entry.playerId,
    };
  });
}

export function winner(state: GameState): FinalStanding | null {
  if (!isGameOver(state)) return null;
  return finalStandings(state)[0] ?? null;
}
