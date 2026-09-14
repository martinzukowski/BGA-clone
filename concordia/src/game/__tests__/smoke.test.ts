import { describe, expect, it } from 'vitest';
import { applyAction, legalActions, setupGame, validateState } from '../engine/rules';
import { RngCursor } from '../engine/rng';
import type { GameState } from '../engine/types';

function randomGame(seed: number, playerCount: number, mapId: string): GameState {
  const rng = new RngCursor(seed);
  let state = setupGame({
    seed,
    mapId,
    players: Array.from({ length: playerCount }, (_, i) => ({
      name: `P${i}`,
      isHuman: false,
      difficulty: 'easy' as const,
    })),
  });

  let guard = 0;
  while (state.phase !== 'finished') {
    if (++guard > 8000) throw new Error('game did not terminate');
    const options = legalActions(state);
    expect(options.length).toBeGreaterThan(0);
    const action = rng.pick(options);
    const result = applyAction(state, action);
    if (!result.ok) {
      throw new Error(`legalActions offered an illegal action: ${JSON.stringify(action)} — ${result.error}`);
    }
    state = result.state;
    const problems = validateState(state);
    if (problems.length) {
      throw new Error(`Invariants broken after ${JSON.stringify(action)}:\n${problems.join('\n')}`);
    }
  }
  return state;
}

describe('engine smoke test — random legal play', () => {
  it('terminates and stays valid on mare-nostrum', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const final = randomGame(seed, 3, 'mare-nostrum');
      expect(final.phase).toBe('finished');
      expect(final.concordiaHolder).not.toBeNull();
    }
  });

  it('terminates and stays valid on italia-antiqua', () => {
    for (let seed = 20; seed <= 24; seed++) {
      const final = randomGame(seed, 2, 'italia-antiqua');
      expect(final.phase).toBe('finished');
    }
  });
});
