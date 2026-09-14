/**
 * Legality.
 *
 * Two complementary functions:
 *
 *  - `isLegal(state, action)` — the authority. It dry-runs the action through
 *    the real resolver, so it can never disagree with what would actually
 *    happen. Use this to test AI output and to grey out a control.
 *  - `legalActions(state)` — an enumeration of the useful choices right now.
 *    It powers move highlighting and AI move generation. It is a *subset-safe*
 *    listing: everything it returns is legal.
 */

import { GOODS, MERCATOR_MAX_GOODS_TYPES } from '../data/ruleConstants';
import { applyAction, diplomatTargets } from './actions';
import { definitionAtPosition, priceAtPosition } from './cards';
import { buildCost, canPayGoods, maxTradeQuantity, resolveCost } from './economy';
import { citiesOf, colonistsOf, freeStorage, getPlayer, stateMap } from './gameState';
import { buildableCities, reachableDestinations, type Destination } from './movement';
import type {
  CityId,
  Colonist,
  ColonistType,
  GameAction,
  GameState,
  Good,
  PlayerId,
  ProvinceId,
} from './types';

/* ─────────────────────────────────────────────────────── authority ── */

/** The definitive answer, by dry-running the resolver. */
export function isLegal(state: GameState, action: GameAction): boolean {
  return applyAction(state, action).ok;
}

/** The reason an action is illegal, or `null` if it is fine. */
export function illegalReason(state: GameState, action: GameAction): string | null {
  const result = applyAction(state, action);
  return result.ok ? null : result.error;
}

/* ───────────────────────────────────────────────── targeted queries ── */

/** Colonists that still have somewhere to go (RULES §7). */
export function movableColonists(state: GameState, playerId: PlayerId): Colonist[] {
  const steps = state.pending?.movementRemaining ?? 0;
  if (steps <= 0) return [];
  return colonistsOf(state, playerId).filter((c) => reachableDestinations(state, c, steps).length > 0);
}

export function destinationsFor(state: GameState, colonistId: string): Destination[] {
  const colonist = state.colonists.find((c) => c.id === colonistId);
  if (!colonist) return [];
  const steps = state.pending?.movementRemaining ?? 0;
  return reachableDestinations(state, colonist, steps);
}

export interface BuildOption {
  readonly cityId: CityId;
  readonly good: Good;
  readonly coins: number;
  readonly goods: readonly Good[];
  readonly multiplier: number;
  readonly affordable: boolean;
}

/**
 * Every city the player stands beside, with its price and whether they can pay.
 * Unaffordable cities are included so the UI can show *why* they are dimmed.
 */
export function buildOptions(state: GameState, playerId: PlayerId): BuildOption[] {
  const player = getPlayer(state, playerId);
  const out: BuildOption[] = [];
  for (const cityId of buildableCities(state, playerId)) {
    const good = state.cityGoods[cityId];
    if (!good) continue;
    const cost = buildCost(good, (state.houses[cityId] ?? []).length);
    out.push({
      cityId,
      good,
      coins: cost.coins,
      goods: cost.goods,
      multiplier: cost.multiplier,
      affordable:
        player.housesRemaining > 0 && player.money >= cost.coins && canPayGoods(player, cost.goods),
    });
  }
  return out;
}

/** RULES 6.2a — provinces whose marker still shows its goods side. */
export function activeProvinces(state: GameState): ProvinceId[] {
  return stateMap(state)
    .provinces.filter((p) => state.bonusMarkers[p.id]?.active)
    .map((p) => p.id);
}

export interface PurchaseOption {
  readonly position: number;
  readonly cardId: string;
  readonly defId: string;
  readonly price: readonly (Good | 'any')[];
  readonly affordable: boolean;
}

export function purchaseOptions(
  state: GameState,
  playerId: PlayerId,
  mode: 'senator' | 'consul',
): PurchaseOption[] {
  const player = getPlayer(state, playerId);
  const out: PurchaseOption[] = [];
  for (let position = 1; position <= state.display.length; position++) {
    const cardId = state.display[position - 1];
    const def = definitionAtPosition(state, position);
    if (!cardId || !def) continue;
    const price = priceAtPosition(state, position, mode) ?? [];
    out.push({
      position,
      cardId,
      defId: def.defId,
      price,
      affordable: resolveCost(player, price).ok,
    });
  }
  return out;
}

/** RULES 6.4a — where a Colonist card may place a new colonist. */
export function recruitCities(state: GameState, playerId: PlayerId): CityId[] {
  const map = stateMap(state);
  return [map.capitalId, ...citiesOf(state, playerId)];
}

export function canRecruit(state: GameState, playerId: PlayerId, type: ColonistType): boolean {
  const player = getPlayer(state, playerId);
  return player.reserveColonists[type] > 0 && canPayGoods(player, ['food', 'tool']);
}

/* ───────────────────────────────────────────────────── enumeration ── */

/**
 * A useful, bounded listing of what the current player may do.
 *
 * Movement is enumerated as shortest paths only (there is never a reason to take
 * a longer route to the same square). Trades are enumerated at every legal
 * quantity, which is bounded by the twelve-space storehouse.
 */
export function legalActions(state: GameState): GameAction[] {
  if (state.phase === 'finished') return [];
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);
  const pending = state.pending;

  if (!pending) {
    return player.hand.map((cardId) => ({ type: 'PLAY_CARD', cardId }) as GameAction);
  }

  const out: GameAction[] = [];

  switch (pending.step) {
    case 'architect:move': {
      const steps = pending.movementRemaining ?? 0;
      for (const colonist of colonistsOf(state, playerId)) {
        for (const dest of reachableDestinations(state, colonist, steps)) {
          out.push({ type: 'MOVE_COLONIST', colonistId: colonist.id, path: dest.path });
        }
      }
      out.push({ type: 'END_MOVEMENT' });
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'architect:build': {
      for (const option of buildOptions(state, playerId)) {
        if (option.affordable) out.push({ type: 'BUILD_HOUSE', cityId: option.cityId });
      }
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'prefect:choose': {
      for (const provinceId of activeProvinces(state)) {
        out.push({ type: 'PREFECT_PRODUCE', provinceId });
      }
      out.push({ type: 'PREFECT_CASH' });
      break;
    }

    case 'mercator:trade': {
      const trades = pending.trades ?? [];
      const distinct = new Set(trades.map((t) => t.good));
      for (const good of GOODS) {
        const already = trades.find((t) => t.good === good);
        if (!distinct.has(good) && distinct.size >= 2) continue;
        for (const direction of ['buy', 'sell'] as const) {
          if (already && already.direction !== direction) continue;
          const max = maxTradeQuantity(player, good, direction);
          for (let q = 1; q <= max; q++) {
            out.push({ type: 'TRADE', good, direction, quantity: q });
          }
        }
      }
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'colonist:choose':
    case 'colonist:recruit': {
      for (const type of ['land', 'sea'] as ColonistType[]) {
        if (!canRecruit(state, playerId, type)) continue;
        for (const cityId of recruitCities(state, playerId)) {
          out.push({ type: 'RECRUIT_COLONIST', colonistType: type, cityId });
        }
      }
      if (pending.step === 'colonist:choose') out.push({ type: 'COLONIST_MONEY' });
      else out.push({ type: 'END_ACTION' });
      break;
    }

    case 'diplomat:choose': {
      for (const targetPlayerId of diplomatTargets(state, playerId)) {
        out.push({ type: 'DIPLOMAT_COPY', targetPlayerId });
      }
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'senator:buy':
    case 'consul:buy': {
      const mode = pending.step === 'senator:buy' ? 'senator' : 'consul';
      for (const option of purchaseOptions(state, playerId, mode)) {
        if (option.affordable) out.push({ type: 'BUY_CARD', position: option.position });
      }
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'tribune:colonist': {
      for (const type of ['land', 'sea'] as ColonistType[]) {
        if (canRecruit(state, playerId, type) && freeStorage(player) >= 0) {
          out.push({ type: 'TRIBUNE_COLONIST', colonistType: type });
        }
      }
      out.push({ type: 'END_ACTION' });
      break;
    }

    case 'done':
      break;
  }

  return out;
}

/**
 * A short, human-readable instruction for whatever the engine is waiting for.
 * The UI uses this verbatim so the guidance can never drift from the rules.
 */
export function currentPrompt(state: GameState): string {
  if (state.phase === 'finished') return 'The game is over.';
  const pending = state.pending;
  if (!pending) return 'Choose a personality card to play.';
  switch (pending.step) {
    case 'architect:move': {
      const left = pending.movementRemaining ?? 0;
      return left > 0
        ? `Move your colonists — ${left} step${left === 1 ? '' : 's'} remaining.`
        : 'No movement left. Build houses beside your colonists.';
    }
    case 'architect:build':
      return 'Build houses in cities beside your colonists, or finish.';
    case 'prefect:choose':
      return 'Choose a province to produce, or call in the provinces for coin.';
    case 'mercator:trade': {
      const left = MERCATOR_MAX_GOODS_TYPES - new Set((pending.trades ?? []).map((t) => t.good)).size;
      return left > 0
        ? `Trade with the bank — ${left} new kind${left === 1 ? '' : 's'} of goods remaining.`
        : 'Trade with the bank — you may still trade the kinds you have opened.';
    }
    case 'colonist:choose':
      return 'Raise colonists, or take coin instead.';
    case 'colonist:recruit':
      return 'Raise another colonist, or finish.';
    case 'diplomat:choose':
      return "Copy the card showing on an opponent's discard pile.";
    case 'senator:buy':
      return `Purchase personality cards — ${pending.purchasesRemaining ?? 0} remaining.`;
    case 'consul:buy':
      return 'Purchase one personality card, ignoring its position surcharge.';
    case 'tribune:colonist':
      return 'Raise one colonist in Roma, or finish.';
    case 'done':
      return 'Resolving…';
  }
}
