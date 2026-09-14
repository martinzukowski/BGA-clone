/**
 * The whole-system harness.
 *
 * Plays complete AI-only games and asserts, after *every single action*, that
 * the state is structurally sound. This is what catches rule interactions no
 * unit test thought to try.
 */

import { describe, expect, it } from 'vitest';
import { chooseTurn } from '../ai';
import { applyAction, calculateScore, finalStandings, isLegal, setupGame, validateState } from '../engine/rules';
import { STOREHOUSE_CAPACITY, HOUSES_PER_PLAYER, MAX_COLONISTS_ON_BOARD } from '../data/ruleConstants';
import type { AiDifficulty, GameState } from '../engine/types';

/** Far above any plausible real game; a runaway loop trips this, not the clock. */
const TURN_LIMIT = 400;

export interface GameReport {
  readonly turns: number;
  readonly actions: number;
  readonly finalState: GameState;
  readonly scores: readonly number[];
}

function playGame(options: {
  seed: number;
  mapId: string;
  difficulties: AiDifficulty[];
  deepCheck?: boolean;
}): GameReport {
  const { seed, mapId, difficulties, deepCheck = true } = options;

  let state = setupGame({
    seed,
    mapId,
    players: difficulties.map((difficulty, i) => ({
      name: `AI${i}`,
      isHuman: false,
      difficulty,
    })),
  });

  let turns = 0;
  let actions = 0;

  while (state.phase !== 'finished') {
    if (++turns > TURN_LIMIT) {
      throw new Error(`Game (seed ${seed}) did not terminate within ${TURN_LIMIT} turns`);
    }

    const playerId = state.currentPlayer;
    const difficulty = state.players[playerId]!.difficulty ?? 'medium';
    const turn = chooseTurn(state, difficulty);

    expect(turn.actions.length, `AI produced an empty turn on seed ${seed}`).toBeGreaterThan(0);

    for (const action of turn.actions) {
      // The AI must only ever emit actions the engine agrees are legal.
      if (!isLegal(state, action)) {
        throw new Error(
          `AI (${difficulty}) emitted an illegal action on seed ${seed}: ${JSON.stringify(action)}`,
        );
      }
      const result = applyAction(state, action);
      if (!result.ok) throw new Error(`Unexpected rejection: ${result.error}`);
      state = result.state;
      actions++;

      if (deepCheck) {
        const problems = validateState(state);
        if (problems.length) {
          throw new Error(
            `Seed ${seed}: invariants broken after ${action.type}:\n  - ${problems.join('\n  - ')}`,
          );
        }
      }
    }

    // A turn must always hand play on — no card may leave the engine mid-action.
    if (state.phase !== 'finished' && state.pending !== null) {
      throw new Error(`Seed ${seed}: the AI left an action unresolved`);
    }
  }

  return {
    turns,
    actions,
    finalState: state,
    scores: state.players.map((p) => calculateScore(state, p.id).total),
  };
}

/** The properties every finished game must satisfy. */
function assertSoundFinish(report: GameReport, seed: number): void {
  const state = report.finalState;
  expect(state.phase, `seed ${seed}`).toBe('finished');
  expect(state.concordiaHolder, `seed ${seed} finished without anyone taking the Concordia`).not.toBeNull();
  expect(state.pending).toBeNull();
  expect(validateState(state)).toEqual([]);

  for (const p of state.players) {
    expect(p.money, `seed ${seed}: negative money`).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(p.money)).toBe(true);
    for (const g of ['brick', 'food', 'tool', 'wine', 'cloth'] as const) {
      expect(p.goods[g], `seed ${seed}: negative ${g}`).toBeGreaterThanOrEqual(0);
    }
    const used = p.goods.brick + p.goods.food + p.goods.tool + p.goods.wine + p.goods.cloth +
      p.reserveColonists.land + p.reserveColonists.sea;
    expect(used, `seed ${seed}: storehouse overflow`).toBeLessThanOrEqual(STOREHOUSE_CAPACITY);
    expect(p.housesRemaining).toBeGreaterThanOrEqual(0);
    expect(p.housesRemaining).toBeLessThanOrEqual(HOUSES_PER_PLAYER);
    expect(state.colonists.filter((c) => c.owner === p.id).length).toBeLessThanOrEqual(
      MAX_COLONISTS_ON_BOARD,
    );
  }

  // The display is either full or the stack is empty.
  const displayed = state.display.filter(Boolean).length;
  expect(displayed === 7 || state.stack.length === 0).toBe(true);

  // No route holds two colonists.
  const onRoutes = state.colonists.filter((c) => c.location.kind === 'route');
  const routeIds = onRoutes.map((c) => (c.location as { routeId: string }).routeId);
  expect(new Set(routeIds).size).toBe(routeIds.length);

  // Every score is a finite number, and the standings are a total order.
  for (const total of report.scores) {
    expect(Number.isFinite(total), `seed ${seed}: non-finite score`).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  }
  const standings = finalStandings(state);
  expect(standings).toHaveLength(state.players.length);
  expect(standings.map((s) => s.rank)).toEqual(standings.map((_, i) => i + 1));
  for (let i = 1; i < standings.length; i++) {
    expect(standings[i - 1]!.breakdown.total).toBeGreaterThanOrEqual(standings[i]!.breakdown.total);
  }
}

describe('AI-only simulations', () => {
  it('runs 120 complete games without a single invalid state', () => {
    const rotations: AiDifficulty[][] = [
      ['easy', 'easy'],
      ['medium', 'medium'],
      ['easy', 'medium', 'hard'],
      ['medium', 'medium', 'medium'],
      ['hard', 'medium', 'easy', 'medium'],
      ['easy', 'easy', 'medium', 'hard'],
    ];
    const maps = ['mare-nostrum', 'italia-antiqua'];

    let played = 0;
    let totalTurns = 0;
    let totalActions = 0;

    for (let seed = 1; seed <= 120; seed++) {
      const difficulties = rotations[seed % rotations.length]!;
      const mapId =
        difficulties.length <= 4 ? maps[seed % maps.length]! : 'mare-nostrum';
      const report = playGame({ seed, mapId, difficulties });
      assertSoundFinish(report, seed);
      played++;
      totalTurns += report.turns;
      totalActions += report.actions;
    }

    expect(played).toBe(120);
    // A sanity band on game length: a game that ends in three turns, or drags on
    // for hundreds, means something is badly wrong even if nothing threw.
    const averageTurns = totalTurns / played;
    expect(averageTurns).toBeGreaterThan(15);
    expect(averageTurns).toBeLessThan(220);
    expect(totalActions).toBeGreaterThan(played * 20);
  });

  it('five-player games on the large map also terminate cleanly', () => {
    for (let seed = 500; seed < 506; seed++) {
      const report = playGame({
        seed,
        mapId: 'mare-nostrum',
        difficulties: ['hard', 'medium', 'medium', 'easy', 'easy'],
      });
      assertSoundFinish(report, seed);
    }
  });

  it('games are perfectly reproducible from their seed', () => {
    const a = playGame({ seed: 777, mapId: 'mare-nostrum', difficulties: ['hard', 'medium', 'easy'], deepCheck: false });
    const b = playGame({ seed: 777, mapId: 'mare-nostrum', difficulties: ['hard', 'medium', 'easy'], deepCheck: false });
    expect(a.scores).toEqual(b.scores);
    expect(a.turns).toBe(b.turns);
    expect(JSON.stringify(a.finalState.houses)).toBe(JSON.stringify(b.finalState.houses));
  });
});

describe('AI strength', () => {
  it('hard beats easy over a run of games', () => {
    let hardWins = 0;
    let easyWins = 0;
    const games = 24;

    for (let seed = 2000; seed < 2000 + games; seed++) {
      // Alternate seating so neither difficulty gets a turn-order advantage.
      const hardFirst = seed % 2 === 0;
      const difficulties: AiDifficulty[] = hardFirst ? ['hard', 'easy'] : ['easy', 'hard'];
      const report = playGame({ seed, mapId: 'italia-antiqua', difficulties, deepCheck: false });
      const standings = finalStandings(report.finalState);
      const championDifficulty = report.finalState.players[standings[0]!.playerId]!.difficulty;
      if (championDifficulty === 'hard') hardWins++;
      else easyWins++;
    }

    // Not a claim of perfection — a claim that the difficulties are genuinely
    // different players and that the stronger one is stronger.
    expect(hardWins).toBeGreaterThan(easyWins);
    expect(hardWins / games).toBeGreaterThan(0.6);
  });

  it('medium beats easy over a run of games', () => {
    let mediumWins = 0;
    const games = 20;
    for (let seed = 3000; seed < 3000 + games; seed++) {
      const difficulties: AiDifficulty[] = seed % 2 === 0 ? ['medium', 'easy'] : ['easy', 'medium'];
      const report = playGame({ seed, mapId: 'italia-antiqua', difficulties, deepCheck: false });
      const standings = finalStandings(report.finalState);
      if (report.finalState.players[standings[0]!.playerId]!.difficulty === 'medium') mediumWins++;
    }
    expect(mediumWins / games).toBeGreaterThan(0.55);
  });

  it('the three difficulties genuinely play differently from the same position', () => {
    const state = setupGame({
      seed: 9,
      mapId: 'mare-nostrum',
      keepPlayerOrder: true,
      players: [
        { name: 'A', isHuman: false, difficulty: 'easy' },
        { name: 'B', isHuman: false, difficulty: 'medium' },
        { name: 'C', isHuman: false, difficulty: 'hard' },
      ],
    });
    const labels = (['easy', 'medium', 'hard'] as AiDifficulty[]).map(
      (d) => chooseTurn(state, d).label,
    );
    // Medium and hard may agree on an obviously best opening; all three being
    // identical across a whole game would be the real red flag, and the
    // head-to-head results above cover that.
    expect(new Set(labels).size).toBeGreaterThanOrEqual(2);
  });
});
