import { describe, expect, it } from 'vitest';
import { FOR_SALE_CARD_DEFS, STARTING_CARD_DEFS, getCardDef } from '../data/cards';
import { MAPS, getMap } from '../data/maps';
import {
  GOOD_VALUES,
  HOUSES_PER_PLAYER,
  MAX_COLONISTS_ON_BOARD,
  STOREHOUSE_CAPACITY,
} from '../data/ruleConstants';
import { setupGame, storageUsed, validateState } from '../engine/rules';
import { mapIndex } from '../engine/movement';
import { newGame } from './helpers';

describe('RULES §4 — setup', () => {
  it('produces a valid opening position', () => {
    expect(validateState(newGame())).toEqual([]);
  });

  it('4.7 — each player starts with 2 colonists in the capital and 4 in reserve', () => {
    const state = newGame();
    const map = getMap(state.mapId);
    for (const p of state.players) {
      const mine = state.colonists.filter((c) => c.owner === p.id);
      expect(mine).toHaveLength(2);
      expect(mine.filter((c) => c.type === 'land')).toHaveLength(1);
      expect(mine.filter((c) => c.type === 'sea')).toHaveLength(1);
      for (const c of mine) {
        expect(c.location).toEqual({ kind: 'city', cityId: map.capitalId });
      }
      expect(p.reserveColonists).toEqual({ land: 2, sea: 2 });
    }
  });

  it('4.7 — the storehouse starts with 6 goods and 4 colonists, i.e. 10 of 12 spaces', () => {
    const state = newGame();
    for (const p of state.players) {
      expect(p.goods).toEqual({ brick: 1, food: 2, tool: 1, wine: 1, cloth: 1 });
      expect(storageUsed(p)).toBe(10);
      expect(STOREHOUSE_CAPACITY - storageUsed(p)).toBe(2);
    }
  });

  it('4.8 — starting money is 5, 6, 7 … by seat', () => {
    const state = newGame();
    expect(state.players.map((p) => p.money)).toEqual([5, 6, 7]);
  });

  it('4.9 — the Praefectus Magnus starts with the last player', () => {
    const state = newGame();
    expect(state.praefectusMagnus).toBe(state.players.length - 1);
  });

  it('4.10 — every player starts with the same 7 cards, including two Prefects', () => {
    const state = newGame();
    for (const p of state.players) {
      expect(p.hand).toHaveLength(7);
      const roles = p.hand.map((id) => getCardDef(state.cards[id]!.defId).role).sort();
      expect(roles).toEqual([
        'architect',
        'diplomat',
        'mercator',
        'prefect',
        'prefect',
        'senator',
        'tribune',
      ]);
    }
    expect(STARTING_CARD_DEFS).toHaveLength(7);
  });

  it('2.1 — 15 houses per player', () => {
    const state = newGame();
    for (const p of state.players) expect(p.housesRemaining).toBe(HOUSES_PER_PLAYER);
  });

  it('4.5 — cards above the player count are removed, and the stack is ordered I → V', () => {
    for (const playerCount of [2, 3, 4, 5]) {
      const state = setupGame({
        seed: 7,
        mapId: 'mare-nostrum',
        players: Array.from({ length: playerCount }, (_, i) => ({ name: `P${i}`, isHuman: false })),
      });
      const inPlay = [...state.display.filter((c): c is string => c !== null), ...state.stack];
      const decks = inPlay.map((id) => getCardDef(state.cards[id]!.defId).deck!);
      const expected = FOR_SALE_CARD_DEFS.filter((d) => d.deck! <= playerCount).length;
      expect(inPlay).toHaveLength(expected);
      expect(Math.max(...decks)).toBeLessThanOrEqual(playerCount);

      // The stack, read from the display onwards, is non-decreasing in numeral.
      const ordered = decks;
      for (let i = 1; i < ordered.length; i++) {
        expect(ordered[i]!).toBeGreaterThanOrEqual(ordered[i - 1]!);
      }
    }
  });

  it('4.5 — deck sizes are 8 / 7 / 6 / 5 / 4', () => {
    const sizes = [1, 2, 3, 4, 5].map((n) => FOR_SALE_CARD_DEFS.filter((d) => d.deck === n).length);
    expect(sizes).toEqual([8, 7, 6, 5, 4]);
    expect(FOR_SALE_CARD_DEFS).toHaveLength(30);
  });

  it('4.6 — the display holds 7 cards', () => {
    const state = newGame();
    expect(state.display.filter(Boolean)).toHaveLength(7);
  });

  it('4.2 — every non-capital city gets exactly one good, in the declared distribution', () => {
    for (const map of MAPS) {
      const state = setupGame({
        seed: 99,
        mapId: map.id,
        players: [
          { name: 'A', isHuman: false },
          { name: 'B', isHuman: false },
        ],
      });
      const counts: Record<string, number> = {};
      for (const city of map.cities) {
        if (city.isCapital) {
          expect(state.cityGoods[city.id]).toBeUndefined();
          continue;
        }
        const good = state.cityGoods[city.id];
        expect(good, `${city.id} has no good`).toBeDefined();
        counts[good!] = (counts[good!] ?? 0) + 1;
      }
      const expected: Record<string, number> = {};
      for (const pool of Object.values(map.tokenGroups)) {
        for (const g of pool) expected[g] = (expected[g] ?? 0) + 1;
      }
      expect(counts).toEqual(expected);
    }
  });

  it('4.3 — each province gets a marker of its most valuable good, active side up', () => {
    const state = newGame();
    const map = getMap(state.mapId);
    for (const prov of map.provinces) {
      const marker = state.bonusMarkers[prov.id]!;
      expect(marker.active).toBe(true);
      const best = Math.max(...prov.cityIds.map((c) => GOOD_VALUES[state.cityGoods[c]!]));
      expect(GOOD_VALUES[marker.good]).toBe(best);
    }
  });

  it('is deterministic — the same seed gives the same opening', () => {
    const a = newGame({ seed: 4242 });
    const b = newGame({ seed: 4242 });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('different seeds give different economic geography', () => {
    const a = newGame({ seed: 1 });
    const b = newGame({ seed: 2 });
    expect(JSON.stringify(a.cityGoods)).not.toEqual(JSON.stringify(b.cityGoods));
  });
});

describe('map data integrity', () => {
  it.each(MAPS.map((m) => [m.id, m] as const))('%s is well formed', (_id, map) => {
    const idx = mapIndex(map.id);

    // Unique ids.
    expect(new Set(map.cities.map((c) => c.id)).size).toBe(map.cities.length);
    expect(new Set(map.routes.map((r) => r.id)).size).toBe(map.routes.length);
    expect(new Set(map.provinces.map((p) => p.id)).size).toBe(map.provinces.length);

    // Exactly one capital, and it belongs to no province.
    const capitals = map.cities.filter((c) => c.isCapital);
    expect(capitals).toHaveLength(1);
    expect(capitals[0]!.id).toBe(map.capitalId);
    expect(capitals[0]!.provinceId).toBeNull();

    // Every non-capital city is in exactly one province, and provinces hold 2–3.
    const claimed = new Set<string>();
    for (const prov of map.provinces) {
      expect(prov.cityIds.length).toBeGreaterThanOrEqual(2);
      expect(prov.cityIds.length).toBeLessThanOrEqual(3);
      for (const cityId of prov.cityIds) {
        expect(claimed.has(cityId), `${cityId} is in two provinces`).toBe(false);
        claimed.add(cityId);
        expect(idx.cityById[cityId]!.provinceId).toBe(prov.id);
      }
    }
    for (const city of map.cities) {
      if (!city.isCapital) expect(claimed.has(city.id), `${city.id} has no province`).toBe(true);
    }

    // Every city is reachable by something.
    for (const city of map.cities) {
      const routes = idx.routesAtCity[city.id]!;
      expect(routes.land.length + routes.sea.length, `${city.id} is isolated`).toBeGreaterThan(0);
    }

    // The capital must be reachable by both kinds of colonist, since that is
    // where they all start (RULES 4.7).
    const capitalRoutes = idx.routesAtCity[map.capitalId]!;
    expect(capitalRoutes.land.length).toBeGreaterThan(0);
    expect(capitalRoutes.sea.length).toBeGreaterThan(0);

    // Token pools must match group sizes exactly.
    for (const [group, pool] of Object.entries(map.tokenGroups)) {
      const members = map.cities.filter((c) => c.tokenGroup === group && !c.isCapital);
      expect(pool.length, `group ${group}`).toBe(members.length);
    }

    // Both networks are internally connected enough to be playable: the land
    // graph and the sea graph each reach at least half the map from the capital.
    for (const type of ['land', 'sea'] as const) {
      const seen = new Set<string>([map.capitalId]);
      const queue = [map.capitalId];
      while (queue.length) {
        const cityId = queue.shift()!;
        for (const routeId of idx.routesAtCity[cityId]![type]) {
          const r = idx.routeById[routeId]!;
          for (const next of [r.from, r.to]) {
            if (!seen.has(next)) {
              seen.add(next);
              queue.push(next);
            }
          }
        }
      }
      expect(seen.size, `${type} network from the capital`).toBeGreaterThan(map.cities.length / 2);
    }
  });

  it('colonist limits line up with the component counts', () => {
    expect(MAX_COLONISTS_ON_BOARD).toBe(6);
  });
});
