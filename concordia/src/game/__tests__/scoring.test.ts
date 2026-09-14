import { describe, expect, it } from 'vitest';
import { CONCORDIA_CARD_VP, GOOD_VALUES, MINERVA_VP } from '../data/ruleConstants';
import { calculateScore, finalStandings } from '../engine/rules';
import { giveCard, newGame, placeHouse, setCityGood, setGoods, withPlayerPatch } from './helpers';
import type { GameState, God } from '../engine/types';

function line(state: GameState, playerId: number, god: God | 'concordia') {
  const found = calculateScore(state, playerId).lines.find((l) => l.god === god);
  if (!found) throw new Error(`No ${god} line`);
  return found;
}

/**
 * A player stripped of every card, so each god can be tested in isolation.
 * Their hand and discard are emptied and only the cards under test are added.
 */
function blankPlayer(state: GameState, playerId = 0): GameState {
  return withPlayerPatch(state, playerId, { hand: [], discard: [] });
}

describe('RULES §16 — scoring', () => {
  it('16.1 VESTA — 1 VP per full 10₴ of cash plus goods, per Vesta card', () => {
    let state = blankPlayer(newGame());
    state = withPlayerPatch(state, 0, { money: 13 });
    state = setGoods(state, 0, { brick: 1, food: 0, tool: 3, wine: 0, cloth: 1 });
    // 13₴ + (3 + 15 + 7) = 38₴ → 3 VP per card.
    const wealth = 13 + GOOD_VALUES.brick + 3 * GOOD_VALUES.tool + GOOD_VALUES.cloth;
    expect(wealth).toBe(38);

    expect(line(state, 0, 'vesta').points).toBe(0); // no Vesta cards yet
    state = giveCard(state, 0, 'start-senator');
    expect(line(state, 0, 'vesta').perCard).toBe(3);
    expect(line(state, 0, 'vesta').points).toBe(3);
  });

  it('16.1 VESTA — fractions are discarded', () => {
    let state = blankPlayer(newGame());
    state = giveCard(state, 0, 'start-senator');
    state = setGoods(state, 0, { brick: 0, food: 0, tool: 0, wine: 0, cloth: 0 });
    state = withPlayerPatch(state, 0, { money: 9 });
    expect(line(state, 0, 'vesta').points).toBe(0);
    state = withPlayerPatch(state, 0, { money: 19 });
    expect(line(state, 0, 'vesta').points).toBe(1);
  });

  it('16.2 JUPITER — 1 VP per house outside a brick city, per Jupiter card', () => {
    let state = blankPlayer(newGame());
    state = setCityGood(state, 'genua', 'brick');
    state = setCityGood(state, 'narbo', 'wine');
    state = setCityGood(state, 'salona', 'cloth');
    state = placeHouse(state, 'genua', 0);
    state = placeHouse(state, 'narbo', 0);
    state = placeHouse(state, 'salona', 0);

    state = giveCard(state, 0, 'start-architect'); // Jupiter
    expect(line(state, 0, 'jupiter').perCard).toBe(2);
    expect(line(state, 0, 'jupiter').points).toBe(2);

    state = giveCard(state, 0, 'I-diplomat'); // also Jupiter
    expect(line(state, 0, 'jupiter').points).toBe(4);
  });

  it('16.3 SATURNUS — 1 VP per settled province, per Saturnus card', () => {
    let state = blankPlayer(newGame());
    state = placeHouse(state, 'genua', 0); // Italia
    state = placeHouse(state, 'mediolanum', 0); // Italia again — still one province
    state = placeHouse(state, 'narbo', 0); // Gallia
    state = giveCard(state, 0, 'start-prefect-a');
    expect(line(state, 0, 'saturnus').perCard).toBe(2);
    state = giveCard(state, 0, 'start-prefect-b');
    expect(line(state, 0, 'saturnus').points).toBe(4);
  });

  it('16.4 MERCURIUS — 2 VP per distinct good produced, per Mercurius card', () => {
    let state = blankPlayer(newGame());
    state = setCityGood(state, 'genua', 'wine');
    state = setCityGood(state, 'narbo', 'wine');
    state = setCityGood(state, 'salona', 'tool');
    state = placeHouse(state, 'genua', 0);
    state = placeHouse(state, 'narbo', 0);
    state = placeHouse(state, 'salona', 0);
    state = giveCard(state, 0, 'start-mercator');
    // Two distinct kinds (wine, tool) → 4 VP per card.
    expect(line(state, 0, 'mercurius').perCard).toBe(4);
  });

  it('16.5 MARS — 2 VP per colonist on the board, per Mars card', () => {
    let state = blankPlayer(newGame());
    state = giveCard(state, 0, 'start-tribune');
    expect(line(state, 0, 'mars').perCard).toBe(4); // two starting colonists
    state = giveCard(state, 0, 'I-colonist');
    expect(line(state, 0, 'mars').points).toBe(8);
  });

  it('16.6 MINERVA — each specialist scores alone, at its own rate', () => {
    let state = blankPlayer(newGame());
    for (const city of ['genua', 'narbo', 'salona']) state = setCityGood(state, city, 'wine');
    state = setCityGood(state, 'athenae', 'cloth');
    for (const city of ['genua', 'narbo', 'salona', 'athenae']) state = placeHouse(state, city, 0);

    state = giveCard(state, 0, 'II-vintner');
    expect(line(state, 0, 'minerva').points).toBe(3 * MINERVA_VP.wine);

    // A second specialist adds its own tally rather than multiplying the first.
    state = giveCard(state, 0, 'II-weaver');
    expect(line(state, 0, 'minerva').points).toBe(3 * MINERVA_VP.wine + 1 * MINERVA_VP.cloth);
  });

  it('16.7 — the Concordia card is a flat bonus for whoever ended the game', () => {
    let state = blankPlayer(newGame());
    expect(calculateScore(state, 0).lines.some((l) => l.god === 'concordia')).toBe(false);
    state = { ...state, concordiaHolder: 0 };
    expect(line(state, 0, 'concordia').points).toBe(CONCORDIA_CARD_VP);
    expect(calculateScore(state, 1).lines.some((l) => l.god === 'concordia')).toBe(false);
  });

  it('every line carries an explanation', () => {
    const state = newGame();
    for (const l of calculateScore(state, 0).lines) {
      expect(l.explanation.length).toBeGreaterThan(4);
    }
  });

  it('the worked example from the specification totals correctly', () => {
    // 12 houses: 3 brick, 4 food, 3 tool, 2 cloth, across 7 provinces;
    // 5 colonists; 13₴ plus 1 cloth, 3 tools and 1 brick in store.
    // Cards: 2 Jupiter, 4 Saturnus, 2 Mercurius, 3 Mars, 1 Vesta, 1 Farmer.
    let state = blankPlayer(newGame());

    const layout: [string, 'brick' | 'food' | 'tool' | 'cloth'][] = [
      ['gades', 'brick'], ['corduba', 'brick'], ['tarraco', 'brick'],
      ['narbo', 'food'], ['massilia', 'food'], ['genua', 'food'], ['mediolanum', 'food'],
      ['neapolis', 'tool'], ['brundisium', 'tool'], ['salona', 'tool'],
      ['athenae', 'cloth'], ['byzantium', 'cloth'],
    ];
    for (const [city, good] of layout) {
      state = setCityGood(state, city, good);
      state = placeHouse(state, city, 0);
    }
    // Provinces touched: hispania, gallia, italia, campania, illyricum, graecia, asia = 7.

    state = withPlayerPatch(state, 0, { money: 13 });
    state = setGoods(state, 0, { brick: 1, food: 0, tool: 3, wine: 0, cloth: 1 });
    state = withPlayerPatch(state, 0, { reserveColonists: { land: 1, sea: 0 } });
    state = {
      ...state,
      colonists: [
        ...state.colonists.filter((c) => c.owner !== 0),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `x${i}`,
          owner: 0,
          type: (i < 3 ? 'land' : 'sea') as 'land' | 'sea',
          location: { kind: 'city' as const, cityId: 'roma' },
        })),
      ],
    };

    for (const defId of ['start-architect', 'I-diplomat']) state = giveCard(state, 0, defId); // Jupiter ×2
    for (const defId of ['start-prefect-a', 'start-prefect-b', 'I-prefect', 'II-prefect'])
      state = giveCard(state, 0, defId); // Saturnus ×4
    for (const defId of ['start-mercator', 'I-mercator']) state = giveCard(state, 0, defId); // Mercurius ×2
    for (const defId of ['start-tribune', 'I-colonist', 'II-colonist']) state = giveCard(state, 0, defId); // Mars ×3
    state = giveCard(state, 0, 'start-senator'); // Vesta ×1
    state = giveCard(state, 0, 'I-farmer'); // Minerva
    state = { ...state, concordiaHolder: 0 };

    const score = calculateScore(state, 0);
    const by = (g: God | 'concordia') => score.lines.find((l) => l.god === g)!.points;

    expect(by('vesta')).toBe(3); // 38₴
    expect(by('jupiter')).toBe(18); // 9 non-brick houses × 2 cards
    expect(by('saturnus')).toBe(28); // 7 provinces × 4 cards
    expect(by('mercurius')).toBe(16); // 4 kinds × 2 VP × 2 cards
    expect(by('mars')).toBe(30); // 5 colonists × 2 VP × 3 cards
    expect(by('minerva')).toBe(12); // 4 food cities × 3
    expect(by('concordia')).toBe(7);
    expect(score.total).toBe(114);
  });
});

describe('RULES §16.8 — ranking and the tiebreak', () => {
  it('ranks by total, highest first', () => {
    let state = newGame();
    state = withPlayerPatch(state, 1, { money: 500 });
    const standings = finalStandings(state);
    expect(standings[0]!.playerId).toBe(1);
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it('a tie is broken in favour of the Praefectus Magnus holder', () => {
    const state = newGame(); // all three players are identical at setup
    const holder = state.praefectusMagnus;
    const standings = finalStandings(state);
    const totals = standings.map((s) => s.breakdown.total);
    expect(new Set(totals).size).toBe(1); // genuinely tied
    expect(standings[0]!.playerId).toBe(holder);
    expect(standings[0]!.wonTiebreak).toBe(true);
  });

  it('when the holder is not tied, the tie goes to whoever would get it next', () => {
    let state = newGame();
    const holder = state.praefectusMagnus; // player 2
    // Make the holder run away with it, leaving 0 and 1 tied.
    state = withPlayerPatch(state, holder, { money: 500 });
    const standings = finalStandings(state);
    expect(standings[0]!.playerId).toBe(holder);
    // The card passes to the right, so player 1 is next in line.
    expect(standings[1]!.playerId).toBe(1);
  });
});
