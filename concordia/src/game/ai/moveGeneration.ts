/**
 * Candidate turn generation.
 *
 * The real decision unit in this game is not "an action" but "a whole card play,
 * fully parameterised" — an Architect that moves two colonists and builds three
 * houses is one decision. This module produces a bounded, sensible set of those,
 * each as a plain list of engine actions. Nothing here mutates anything: plans
 * are *simulated* through the real engine, so a plan can never be illegal.
 */

import { getCardDef } from '../data/cards';
import { GOODS } from '../data/ruleConstants';
import { diplomatTargets } from '../engine/actions';
import { buildCost, maxTradeQuantity } from '../engine/economy';
import { citiesOf, colonistsOf, freeStorage, getPlayer, stateMap } from '../engine/gameState';
import { adjacentCities, mapIndex, reachableDestinations } from '../engine/movement';
import { applyAction } from '../engine/rules';
import { activeProvinces, buildOptions, purchaseOptions } from '../engine/validation';
import type {
  CardRole,
  ColonistType,
  GameAction,
  GameState,
  Good,
  PlayerId,
} from '../engine/types';
import { buildCostPenalty, goodDemand, houseValue, houseValueContext } from './evaluation';

export interface TurnPlan {
  /** The complete action sequence, beginning with `PLAY_CARD`. */
  readonly actions: readonly GameAction[];
  /** The state after the whole plan has resolved (the next player is to move). */
  readonly result: GameState;
  /** Short description for the AI turn narration in the UI. */
  readonly label: string;
  readonly role: CardRole;
}

export interface GenerationLimits {
  readonly architectVariants: number;
  readonly mercatorPlans: number;
  readonly colonistPlans: number;
  readonly senatorPlans: number;
  readonly diplomatPlansPerTarget: number;
  readonly prefectPlans: number;
}

export const FULL_LIMITS: GenerationLimits = {
  architectVariants: 4,
  mercatorPlans: 14,
  colonistPlans: 8,
  senatorPlans: 14,
  diplomatPlansPerTarget: 6,
  prefectPlans: 14,
};

export const SHALLOW_LIMITS: GenerationLimits = {
  architectVariants: 2,
  mercatorPlans: 5,
  colonistPlans: 4,
  senatorPlans: 6,
  diplomatPlansPerTarget: 3,
  prefectPlans: 6,
};

/* ────────────────────────────────────────────────────── simulation ── */

/** Folds a sequence of actions through the engine. `null` if any step fails. */
export function simulate(state: GameState, actions: readonly GameAction[]): GameState | null {
  let cur = state;
  for (const action of actions) {
    const result = applyAction(cur, action);
    if (!result.ok) return null;
    cur = result.state;
  }
  return cur;
}

function plan(
  base: GameState,
  actions: GameAction[],
  label: string,
  role: CardRole,
): TurnPlan | null {
  const result = simulate(base, actions);
  // A complete plan must have handed the turn on.
  if (!result || result.pending !== null) return null;
  return { actions, result, label, role };
}

/* ───────────────────────────────────────────────────── entry point ── */

/**
 * Every candidate turn for the player to move. Always returns at least one plan
 * (the engine guarantees a legal card play exists — RULES 5.4).
 */
export function generateTurnPlans(
  state: GameState,
  limits: GenerationLimits = FULL_LIMITS,
): TurnPlan[] {
  if (state.phase === 'finished' || state.pending !== null) return [];
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);
  const plans: TurnPlan[] = [];

  for (const cardId of player.hand) {
    const def = getCardDef(state.cards[cardId]!.defId);
    const afterPlay = applyAction(state, { type: 'PLAY_CARD', cardId });
    if (!afterPlay.ok) continue;

    // Atomic roles (specialists) resolve entirely on play.
    if (afterPlay.state.pending === null) {
      plans.push({
        actions: [{ type: 'PLAY_CARD', cardId }],
        result: afterPlay.state,
        label: def.title,
        role: def.role,
      });
      continue;
    }

    const head: GameAction = { type: 'PLAY_CARD', cardId };
    for (const suffix of suffixesFor(afterPlay.state, playerId, def.role, limits)) {
      const p = plan(state, [head, ...suffix.actions], `${def.title} — ${suffix.label}`, def.role);
      if (p) plans.push(p);
    }
  }

  // Absolute fallback: something legal, always.
  if (plans.length === 0) {
    for (const cardId of player.hand) {
      const p = forceComplete(state, [{ type: 'PLAY_CARD', cardId }]);
      if (p) {
        plans.push(p);
        break;
      }
    }
  }

  return plans;
}

/**
 * Drives a partial plan to completion by taking the first legal terminator at
 * each step. Used only as a safety valve.
 */
function forceComplete(state: GameState, actions: GameAction[]): TurnPlan | null {
  let cur = simulate(state, actions);
  if (!cur) return null;
  const all = [...actions];
  let guard = 0;
  while (cur.pending !== null) {
    if (++guard > 24) return null;
    const terminators: GameAction[] = [
      { type: 'END_ACTION' },
      { type: 'PREFECT_CASH' },
      { type: 'COLONIST_MONEY' },
      { type: 'END_MOVEMENT' },
    ];
    let advanced = false;
    for (const t of terminators) {
      const r = applyAction(cur, t);
      if (r.ok) {
        cur = r.state;
        all.push(t);
        advanced = true;
        break;
      }
    }
    if (!advanced) return null;
  }
  const role = getCardDef(state.cards[(actions[0] as { cardId: string }).cardId]!.defId).role;
  return { actions: all, result: cur, label: 'pass', role };
}

export interface Suffix {
  readonly actions: GameAction[];
  readonly label: string;
}

export function suffixesFor(
  state: GameState,
  playerId: PlayerId,
  role: CardRole,
  limits: GenerationLimits,
): Suffix[] {
  switch (role) {
    case 'architect':
      return architectSuffixes(state, playerId, limits);
    case 'prefect':
      return prefectSuffixes(state, limits);
    case 'mercator':
      return mercatorSuffixes(state, playerId, limits);
    case 'colonist':
      return colonistSuffixes(state, playerId, limits);
    case 'diplomat':
      return diplomatSuffixes(state, playerId, limits);
    case 'senator':
      return purchaseSuffixes(state, playerId, 'senator', limits);
    case 'consul':
      return purchaseSuffixes(state, playerId, 'consul', limits);
    case 'tribune':
      return tribuneSuffixes(state, playerId);
    default:
      return [{ actions: [{ type: 'END_ACTION' }], label: 'resolve' }];
  }
}

/* ───────────────────────────────────────────────────────── ARCHITECT ── */

/** Weightings that make the four movement variants pull in different directions. */
const ARCHITECT_STYLES = [
  { name: 'expand', frontierBias: 1.0, costBias: 1.0 },
  { name: 'reach far', frontierBias: 1.9, costBias: 0.5 },
  { name: 'build cheap', frontierBias: 0.4, costBias: 2.1 },
  { name: 'hold position', frontierBias: 0, costBias: 1.0 },
] as const;

function architectSuffixes(state: GameState, playerId: PlayerId, limits: GenerationLimits): Suffix[] {
  const out: Suffix[] = [];
  const styles = ARCHITECT_STYLES.slice(0, Math.max(1, limits.architectVariants));

  for (const style of styles) {
    const actions: GameAction[] = [];
    let cur = state;

    if (style.name !== 'hold position') {
      const moves = greedyMovement(cur, playerId, style.frontierBias);
      for (const move of moves) {
        const r = applyAction(cur, move);
        if (!r.ok) break;
        cur = r.state;
        actions.push(move);
      }
    }

    const endMove = applyAction(cur, { type: 'END_MOVEMENT' });
    if (!endMove.ok) continue;
    cur = endMove.state;
    actions.push({ type: 'END_MOVEMENT' });

    const builds = greedyBuilds(cur, playerId, style.costBias);
    for (const build of builds) {
      const r = applyAction(cur, build);
      if (!r.ok) break;
      cur = r.state;
      actions.push(build);
    }

    actions.push({ type: 'END_ACTION' });
    const builtCount = actions.filter((a) => a.type === 'BUILD_HOUSE').length;
    out.push({
      actions,
      label: builtCount
        ? `${style.name}, ${builtCount} house${builtCount === 1 ? '' : 's'}`
        : style.name,
    });
  }

  return dedupe(out);
}

/**
 * Greedy movement: repeatedly take the step-allocation with the best value per
 * step, where value is the best *new* house a colonist would unlock.
 */
function greedyMovement(state: GameState, playerId: PlayerId, frontierBias: number): GameAction[] {
  const idx = mapIndex(state.mapId);
  const ctx = houseValueContext(state, playerId);
  const actions: GameAction[] = [];
  let cur = state;
  let guard = 0;

  while ((cur.pending?.movementRemaining ?? 0) > 0) {
    if (++guard > 8) break;
    const steps = cur.pending!.movementRemaining!;
    let best: { action: GameAction; gain: number } | null = null;

    for (const colonist of colonistsOf(cur, playerId)) {
      const here = new Set(adjacentCities(idx, colonist.location));
      const currentWorth = bestCityWorth(cur, playerId, [...here], ctx, frontierBias);

      for (const dest of reachableDestinations(cur, colonist, steps)) {
        const cities = adjacentCities(idx, { kind: 'route', routeId: dest.routeId });
        const worth = bestCityWorth(cur, playerId, cities, ctx, frontierBias);
        // Reward improvement, charge for the steps it costs.
        const gain = worth - currentWorth * 0.55 - dest.steps * 0.85;
        if (gain > 0.35 && (!best || gain > best.gain)) {
          best = { action: { type: 'MOVE_COLONIST', colonistId: colonist.id, path: dest.path }, gain };
        }
      }
    }

    if (!best) break;
    const r = applyAction(cur, best.action);
    if (!r.ok) break;
    cur = r.state;
    actions.push(best.action);
  }

  return actions;
}

function bestCityWorth(
  state: GameState,
  playerId: PlayerId,
  cityIds: readonly string[],
  ctx: ReturnType<typeof houseValueContext>,
  frontierBias: number,
): number {
  const idx = mapIndex(state.mapId);
  let best = 0;
  for (const cityId of cityIds) {
    const city = idx.cityById[cityId];
    if (!city || city.isCapital) continue;
    if ((state.houses[cityId] ?? []).includes(playerId)) continue;
    const good = state.cityGoods[cityId];
    if (!good) continue;
    const cost = buildCost(good, (state.houses[cityId] ?? []).length);
    let worth = houseValue(state, cityId, ctx) - buildCostPenalty(cost.coins, cost.goods);
    if (city.provinceId && !ctx.settledProvinces.has(city.provinceId)) {
      worth += (frontierBias - 1) * 1.6;
    }
    best = Math.max(best, worth);
  }
  return best;
}

function greedyBuilds(state: GameState, playerId: PlayerId, costBias: number): GameAction[] {
  const actions: GameAction[] = [];
  let cur = state;
  let guard = 0;

  while (guard++ < 12) {
    const ctx = houseValueContext(cur, playerId);
    let best: { cityId: string; net: number } | null = null;
    for (const option of buildOptions(cur, playerId)) {
      if (!option.affordable) continue;
      const net =
        houseValue(cur, option.cityId, ctx) -
        buildCostPenalty(option.coins, option.goods) * costBias;
      if (net > 0.5 && (!best || net > best.net)) best = { cityId: option.cityId, net };
    }
    if (!best) break;
    const action: GameAction = { type: 'BUILD_HOUSE', cityId: best.cityId };
    const r = applyAction(cur, action);
    if (!r.ok) break;
    cur = r.state;
    actions.push(action);
  }
  return actions;
}

/* ───────────────────────────────────────────────────────── PREFECT ── */

function prefectSuffixes(state: GameState, limits: GenerationLimits): Suffix[] {
  const map = stateMap(state);
  const out: Suffix[] = [{ actions: [{ type: 'PREFECT_CASH' }], label: 'call in the provinces' }];
  for (const provinceId of activeProvinces(state).slice(0, limits.prefectPlans)) {
    const name = map.provinces.find((p) => p.id === provinceId)?.name ?? provinceId;
    out.push({ actions: [{ type: 'PREFECT_PRODUCE', provinceId }], label: `produce in ${name}` });
  }
  return out;
}

/* ───────────────────────────────────────────────────────── MERCATOR ── */

function mercatorSuffixes(state: GameState, playerId: PlayerId, limits: GenerationLimits): Suffix[] {
  const player = getPlayer(state, playerId);
  const demand = goodDemand(state, playerId);

  // Sell what is least wanted; buy what is most wanted.
  const sellCandidates = GOODS.filter((g) => player.goods[g] > 0).sort(
    (a, b) => demand[a] - demand[b],
  );
  const buyCandidates = [...GOODS].sort((a, b) => demand[b] - demand[a]);

  const sellOptions: (GameAction | null)[] = [null];
  for (const good of sellCandidates.slice(0, 3)) {
    const max = maxTradeQuantity(player, good, 'sell');
    if (max > 0) sellOptions.push({ type: 'TRADE', good, direction: 'sell', quantity: max });
    if (max > 1) sellOptions.push({ type: 'TRADE', good, direction: 'sell', quantity: max - 1 });
  }

  const out: Suffix[] = [];
  for (const sell of sellOptions) {
    const afterSell = sell ? simulate(state, [sell]) : state;
    if (!afterSell) continue;
    const seller = getPlayer(afterSell, playerId);

    const buyOptions: (GameAction | null)[] = [null];
    for (const good of buyCandidates.slice(0, 3)) {
      if (sell && (sell as { good: Good }).good === good) continue;
      const max = Math.min(maxTradeQuantity(seller, good, 'buy'), freeStorage(seller));
      for (const q of uniqueQuantities(max)) {
        buyOptions.push({ type: 'TRADE', good, direction: 'buy', quantity: q });
      }
    }

    for (const buy of buyOptions) {
      const actions: GameAction[] = [];
      if (sell) actions.push(sell);
      if (buy) actions.push(buy);
      actions.push({ type: 'END_ACTION' });
      out.push({ actions, label: describeTrade(sell, buy) });
      if (out.length >= limits.mercatorPlans) return dedupe(out);

      // Two *different* goods may be bought in one Mercator (RULES 11.2), and a
      // balanced pair is usually worth far more than a pile of one commodity.
      if (!sell && buy && buy.type === 'TRADE') {
        const afterBuy = simulate(afterSell, [buy]);
        if (!afterBuy) continue;
        const buyer = getPlayer(afterBuy, playerId);
        for (const good of buyCandidates.slice(0, 3)) {
          if (good === buy.good) continue;
          const max = Math.min(maxTradeQuantity(buyer, good, 'buy'), freeStorage(buyer));
          for (const q of uniqueQuantities(max)) {
            const second: GameAction = { type: 'TRADE', good, direction: 'buy', quantity: q };
            out.push({
              actions: [buy, second, { type: 'END_ACTION' }],
              label: `buy ${buy.quantity} ${buy.good} + ${q} ${good}`,
            });
            if (out.length >= limits.mercatorPlans) return dedupe(out);
          }
        }
      }
    }
  }
  return dedupe(out);
}

function uniqueQuantities(max: number): number[] {
  if (max <= 0) return [];
  const set = new Set<number>([1, Math.ceil(max / 2), max]);
  return [...set].filter((q) => q >= 1 && q <= max).sort((a, b) => a - b);
}

function describeTrade(sell: GameAction | null, buy: GameAction | null): string {
  const parts: string[] = [];
  if (sell && sell.type === 'TRADE') parts.push(`sell ${sell.quantity} ${sell.good}`);
  if (buy && buy.type === 'TRADE') parts.push(`buy ${buy.quantity} ${buy.good}`);
  return parts.length ? parts.join(', ') : 'take coin only';
}

/* ───────────────────────────────────────────────────────── COLONIST ── */

function colonistSuffixes(state: GameState, playerId: PlayerId, limits: GenerationLimits): Suffix[] {
  const out: Suffix[] = [{ actions: [{ type: 'COLONIST_MONEY' }], label: 'take coin' }];
  const idx = mapIndex(state.mapId);
  const map = stateMap(state);

  // Prefer the capital and the player's best-connected cities.
  const cities = [map.capitalId, ...citiesOf(state, playerId)].slice(0, 6);

  for (const cityId of cities) {
    for (const type of ['land', 'sea'] as ColonistType[]) {
      // Only offer a type the city can actually use.
      if ((idx.routesAtCity[cityId]?.[type] ?? []).length === 0) continue;
      const first: GameAction = { type: 'RECRUIT_COLONIST', colonistType: type, cityId };
      const once = simulate(state, [first]);
      if (!once) continue;
      const cityName = idx.cityById[cityId]?.name ?? cityId;
      out.push({
        actions: [first, { type: 'END_ACTION' }],
        label: `raise a ${type === 'sea' ? 'ship' : 'colonist'} in ${cityName}`,
      });

      // A second colonist in the same place, if it is still affordable.
      const second = simulate(once, [first]);
      if (second) {
        out.push({
          actions: [first, first, { type: 'END_ACTION' }],
          label: `raise two in ${cityName}`,
        });
      }
      if (out.length >= limits.colonistPlans) return dedupe(out);
    }
  }
  return dedupe(out);
}

/* ───────────────────────────────────────────────────────── DIPLOMAT ── */

function diplomatSuffixes(state: GameState, playerId: PlayerId, limits: GenerationLimits): Suffix[] {
  const out: Suffix[] = [];
  const targets = diplomatTargets(state, playerId);
  if (targets.length === 0) return [{ actions: [{ type: 'END_ACTION' }], label: 'nothing to copy' }];

  const inner: GenerationLimits = {
    ...limits,
    architectVariants: Math.min(limits.architectVariants, 2),
    mercatorPlans: Math.min(limits.mercatorPlans, 4),
    colonistPlans: Math.min(limits.colonistPlans, 3),
    senatorPlans: Math.min(limits.senatorPlans, 4),
    prefectPlans: Math.min(limits.prefectPlans, 5),
    diplomatPlansPerTarget: 1,
  };

  for (const targetPlayerId of targets) {
    const head: GameAction = { type: 'DIPLOMAT_COPY', targetPlayerId };
    const copied = applyAction(state, head);
    if (!copied.ok) continue;
    const name = getPlayer(state, targetPlayerId).name;

    if (copied.state.pending === null) {
      out.push({ actions: [head], label: `copy ${name}` });
      continue;
    }
    const role = copied.state.pending.role;
    const subs = suffixesFor(copied.state, playerId, role, inner).slice(
      0,
      limits.diplomatPlansPerTarget,
    );
    for (const sub of subs) {
      out.push({ actions: [head, ...sub.actions], label: `copy ${name}: ${sub.label}` });
    }
  }
  return out.length ? out : [{ actions: [{ type: 'END_ACTION' }], label: 'nothing to copy' }];
}

/* ─────────────────────────────────────────────── SENATOR / CONSUL ── */

function purchaseSuffixes(
  state: GameState,
  playerId: PlayerId,
  mode: 'senator' | 'consul',
  limits: GenerationLimits,
): Suffix[] {
  const out: Suffix[] = [{ actions: [{ type: 'END_ACTION' }], label: 'buy nothing' }];
  const affordable = purchaseOptions(state, playerId, mode).filter((o) => o.affordable);

  for (const first of affordable) {
    const buy: GameAction = { type: 'BUY_CARD', position: first.position };
    const after = simulate(state, [buy]);
    if (!after) continue;
    const firstName = getCardDef(first.defId).title;

    if (after.pending === null) {
      out.push({ actions: [buy], label: `buy ${firstName}` });
    } else {
      out.push({ actions: [buy, { type: 'END_ACTION' }], label: `buy ${firstName}` });

      if (mode === 'senator') {
        for (const second of purchaseOptions(after, playerId, mode).filter((o) => o.affordable)) {
          const buy2: GameAction = { type: 'BUY_CARD', position: second.position };
          const twice = simulate(after, [buy2]);
          if (!twice) continue;
          out.push({
            actions: twice.pending === null ? [buy, buy2] : [buy, buy2, { type: 'END_ACTION' }],
            label: `buy ${firstName} + ${getCardDef(second.defId).title}`,
          });
          if (out.length >= limits.senatorPlans) return dedupe(out);
        }
      }
    }
    if (out.length >= limits.senatorPlans) break;
  }
  return dedupe(out);
}

/* ────────────────────────────────────────────────────────── TRIBUNE ── */

function tribuneSuffixes(state: GameState, playerId: PlayerId): Suffix[] {
  const out: Suffix[] = [{ actions: [{ type: 'END_ACTION' }], label: 'recall cards' }];
  const idx = mapIndex(state.mapId);
  const capital = stateMap(state).capitalId;
  for (const type of ['land', 'sea'] as ColonistType[]) {
    if ((idx.routesAtCity[capital]?.[type] ?? []).length === 0) continue;
    const action: GameAction = { type: 'TRIBUNE_COLONIST', colonistType: type };
    if (simulate(state, [action])) {
      out.push({
        actions: [action],
        label: `recall cards, raise a ${type === 'sea' ? 'ship' : 'colonist'}`,
      });
    }
  }
  void playerId;
  return out;
}

/* ──────────────────────────────────────────────────────────── utils ── */

function dedupe(suffixes: Suffix[]): Suffix[] {
  const seen = new Set<string>();
  const out: Suffix[] = [];
  for (const s of suffixes) {
    const key = JSON.stringify(s.actions);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
