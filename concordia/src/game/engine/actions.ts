/**
 * RULES §5, §6, §13, §14, §15 — resolving actions.
 *
 * `applyAction` is the single entry point through which the whole game changes.
 * It is pure, total (never throws for bad input) and deterministic.
 */

import {
  BONUS_MARKER_COIN_VALUES,
  COLONIST_COST,
  COLONIST_MONEY_BASE,
  COLONIST_MONEY_PER_COLONIST,
  CONSUL_MAX_PURCHASES,
  DIPLOMAT_CAN_COPY_DIPLOMAT,
  GOODS,
  INTERMEDIATE_SCORING_AWARDS,
  MERCATOR_MAX_GOODS_TYPES,
  SENATOR_COMPACTS_BETWEEN_PURCHASES,
  SENATOR_MAX_PURCHASES,
  TRIBUNE_FREE_CARDS,
} from '../data/ruleConstants';
import { cardDef, compactAndRefill, displayIsEmpty, priceAtPosition, removeFromDisplay, topOfDiscard } from './cards';
import {
  applyTrade,
  buildCost,
  canPayGoods,
  payGoods,
  quoteTrade,
  receiveGoods,
  resolveCost,
} from './economy';
import {
  citiesOf,
  colonistById,
  colonistsOf,
  colonistsOnBoard,
  getPlayer,
  previousPlayerId,
  stateMap,
  withPlayer,
} from './gameState';
import { appendLog, trimLog, type LogDraft } from './log';
import { adjacentCities, mapIndex, validatePath } from './movement';
import { calculateScore } from './scoring';
import type {
  ActionResult,
  CardDefinition,
  CardId,
  ColonistType,
  GameAction,
  GameState,
  Good,
  PendingAction,
  PendingStep,
  PlayerId,
} from './types';

/* ────────────────────────────────────────────────────────── helpers ── */

function fail(code: string, error: string): ActionResult {
  return { ok: false, code, error };
}

interface Work {
  state: GameState;
  drafts: LogDraft[];
}

function nameOf(state: GameState, playerId: PlayerId): string {
  return getPlayer(state, playerId).name;
}

/** Hands a player goods, logging both the receipt and anything lost to capacity. */
function giveGoods(
  work: Work,
  playerId: PlayerId,
  incoming: Partial<Record<Good, number>>,
  preference: readonly Good[] = [],
  reason = 'production',
): Work {
  const player = getPlayer(work.state, playerId);
  const result = receiveGoods(player, incoming, preference);
  const state = withPlayer(work.state, playerId, () => result.player);
  const drafts = [...work.drafts];

  const gained = GOODS.filter((g) => result.received[g] > 0);
  if (gained.length) {
    drafts.push({
      kind: reason === 'bonus' ? 'bonus-received' : 'production',
      playerId,
      text: `${nameOf(state, playerId)} receives ${gained.map((g) => `${result.received[g]} ${g}`).join(', ')}.`,
      data: { playerId, goods: { ...result.received }, reason },
    });
  }
  const lost = GOODS.filter((g) => result.lost[g] > 0);
  if (lost.length) {
    drafts.push({
      kind: 'goods-lost',
      playerId,
      text: `${nameOf(state, playerId)}'s storehouse is full — ${lost
        .map((g) => `${result.lost[g]} ${g}`)
        .join(', ')} turned away.`,
      data: { playerId, goods: { ...result.lost } },
    });
  }
  return { state, drafts };
}

/* ────────────────────────────────────────────── entering a card role ── */

const INITIAL_STEP: Record<string, PendingStep> = {
  architect: 'architect:move',
  prefect: 'prefect:choose',
  mercator: 'mercator:trade',
  colonist: 'colonist:choose',
  diplomat: 'diplomat:choose',
  senator: 'senator:buy',
  consul: 'consul:buy',
  tribune: 'tribune:colonist',
  mason: 'done',
  farmer: 'done',
  smith: 'done',
  vintner: 'done',
  weaver: 'done',
};

/**
 * Applies the immediate, non-optional part of a role and returns the pending
 * action that waits for the player's choices. Shared by `PLAY_CARD` and by the
 * Diplomat's copy, which is what makes a copied card behave identically.
 */
function enterRole(work: Work, playerId: PlayerId, def: CardDefinition, pending: PendingAction): Work & { pending: PendingAction } {
  let { state, drafts } = work;
  let next: PendingAction = { ...pending, role: def.role, effectiveDefId: def.defId, step: INITIAL_STEP[def.role]! };

  switch (def.role) {
    case 'architect': {
      next = { ...next, movementRemaining: colonistsOnBoard(state, playerId) };
      break;
    }

    case 'mercator': {
      const money = def.mercatorMoney ?? 0;
      state = withPlayer(state, playerId, (p) => ({ ...p, money: p.money + money }));
      drafts.push({
        kind: 'money',
        playerId,
        text: `${nameOf(state, playerId)} takes ${money}₴ from the bank.`,
        data: { playerId, amount: money },
      });
      next = { ...next, trades: [] };
      break;
    }

    case 'tribune': {
      // RULES 6.8 — recover everything played, including this Tribune.
      const p = getPlayer(state, playerId);
      const recovered = p.discard.length;
      const payment = Math.max(0, recovered - TRIBUNE_FREE_CARDS);
      state = withPlayer(state, playerId, (pl) => ({
        ...pl,
        hand: [...pl.hand, ...pl.discard],
        discard: [],
        money: pl.money + payment,
      }));
      drafts.push({
        kind: 'cards-recovered',
        playerId,
        text:
          `${nameOf(state, playerId)} recalls ${recovered} personality card${recovered === 1 ? '' : 's'}` +
          (payment > 0 ? ` and takes ${payment}₴.` : '.'),
        data: { playerId, recovered, payment, cardIds: p.discard.slice() },
      });

      if (state.settings.intermediateScoring && !p.hasScoredIntermediate) {
        const res = runIntermediateScoring({ state, drafts }, playerId);
        state = res.state;
        drafts = res.drafts;
      }
      next = { ...next, colonistsPlaced: 0 };
      break;
    }

    case 'senator': {
      next = { ...next, purchasesRemaining: SENATOR_MAX_PURCHASES };
      break;
    }

    case 'consul': {
      next = { ...next, purchasesRemaining: CONSUL_MAX_PURCHASES };
      break;
    }

    case 'colonist': {
      next = { ...next, colonistsPlaced: 0 };
      break;
    }

    case 'mason':
    case 'farmer':
    case 'smith':
    case 'vintner':
    case 'weaver': {
      // RULES 6.9 — every one of *your* matching cities produces one unit.
      const good = def.specialistGood!;
      const count = citiesOf(state, playerId).filter((c) => state.cityGoods[c] === good).length;
      if (count > 0) {
        const res = giveGoods({ state, drafts }, playerId, { [good]: count }, [good], 'specialist');
        state = res.state;
        drafts = res.drafts;
      } else {
        drafts.push({
          kind: 'production',
          playerId,
          text: `${nameOf(state, playerId)} holds no ${good} city — the ${def.title} produces nothing.`,
          data: { playerId, goods: {}, reason: 'specialist' },
        });
      }
      break;
    }

    default:
      break;
  }

  return { state, drafts, pending: next };
}

/* ──────────────────────────────────────────── intermediate scoring ── */

function runIntermediateScoring(work: Work, playerId: PlayerId): Work {
  const { drafts } = work;
  let { state } = work;
  const score = calculateScore(state, playerId);
  state = withPlayer(state, playerId, (p) => ({
    ...p,
    hasScoredIntermediate: true,
    vpMarker: score.total,
  }));
  drafts.push({
    kind: 'intermediate-scoring',
    playerId,
    text: `${nameOf(state, playerId)} takes an intermediate scoring: ${score.total} VP.`,
    data: { playerId, total: score.total },
  });

  if (state.players.every((p) => p.hasScoredIntermediate)) {
    // RULES 14.2 — 2₴ to the leaders, 1₴ to second place, then reset markers.
    const sorted = [...state.players].map((p) => p.vpMarker).sort((a, b) => b - a);
    const distinct = [...new Set(sorted)];
    const awards = new Map<number, number>();
    distinct.forEach((vp, i) => {
      const award = INTERMEDIATE_SCORING_AWARDS[i];
      if (award !== undefined) awards.set(vp, award);
    });
    state = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        money: p.money + (awards.get(p.vpMarker) ?? 0),
        vpMarker: 0,
      })),
    };
    drafts.push({
      kind: 'intermediate-scoring',
      playerId: null,
      text: 'Every house has taken its intermediate scoring. Coin is awarded and the markers reset.',
      data: { awards: [...awards.entries()] },
    });
  }
  return { state, drafts };
}

/* ─────────────────────────────────────────────────── turn plumbing ── */

/** RULES 12.3, 13.3, 15 — everything that happens when a card finishes. */
function finalizeTurn(work: Work): Work {
  const { drafts } = work;
  let { state } = work;
  const pending = state.pending;
  const actor = state.currentPlayer;

  if (pending?.displayDirty) {
    const refill = compactAndRefill(state);
    state = refill.state;
    if (refill.drawn.length || refill.compacted) {
      drafts.push({
        kind: 'display-refilled',
        playerId: null,
        text: refill.drawn.length
          ? `The forum is replenished with ${refill.drawn.length} new card${refill.drawn.length === 1 ? '' : 's'}.`
          : 'The forum closes ranks.',
        data: { drawn: refill.drawn, remainingInStack: state.stack.length },
      });
    }
  }

  // RULES 13.3 — the Praefectus Magnus moves on after a doubled production.
  if (pending?.praefectusUsed) {
    const nextHolder = previousPlayerId(state, state.praefectusMagnus);
    state = { ...state, praefectusMagnus: nextHolder };
    drafts.push({
      kind: 'praefectus-passed',
      playerId: nextHolder,
      text: `The Praefectus Magnus passes to ${nameOf(state, nextHolder)}.`,
      data: { playerId: nextHolder },
    });
  }

  state = { ...state, pending: null };

  // RULES 15.1 — end-game triggers, checked once the display has been refilled.
  if (state.concordiaHolder === null) {
    const emptiedDisplay = displayIsEmpty(state) && state.stack.length === 0;
    const builtLastHouse = getPlayer(state, actor).housesRemaining === 0;
    if (emptiedDisplay || builtLastHouse) {
      const queue: PlayerId[] = [];
      for (let i = 1; i < state.players.length; i++) {
        queue.push((actor + i) % state.players.length);
      }
      state = { ...state, concordiaHolder: actor, phase: 'finalTurns', finalTurnQueue: queue };
      drafts.push({
        kind: 'end-triggered',
        playerId: actor,
        text: emptiedDisplay
          ? `${nameOf(state, actor)} buys the last card in the forum and claims the Concordia.`
          : `${nameOf(state, actor)} raises a fifteenth house and claims the Concordia.`,
        data: { playerId: actor, reason: emptiedDisplay ? 'display-empty' : 'last-house' },
      });
    }
  }

  // Advance.
  if (state.phase === 'finalTurns') {
    if (state.finalTurnQueue.length === 0) {
      state = { ...state, phase: 'finished' };
      drafts.push({ kind: 'game-over', playerId: null, text: 'The last turn is played. Reckoning begins.' });
      return { state: trimLog(state), drafts };
    }
    const next = state.finalTurnQueue[0]!;
    state = {
      ...state,
      currentPlayer: next,
      finalTurnQueue: state.finalTurnQueue.slice(1),
      turnNumber: state.turnNumber + 1,
    };
  } else {
    const next = (actor + 1) % state.players.length;
    state = {
      ...state,
      currentPlayer: next,
      turnNumber: state.turnNumber + 1,
      roundNumber: next === 0 ? state.roundNumber + 1 : state.roundNumber,
    };
  }

  drafts.push({
    kind: 'turn-start',
    playerId: state.currentPlayer,
    text: `${nameOf(state, state.currentPlayer)} to play${state.phase === 'finalTurns' ? ' — final turn.' : '.'}`,
    data: { playerId: state.currentPlayer, final: state.phase === 'finalTurns' },
  });

  return { state: trimLog(state), drafts };
}

function maybeFinalize(work: Work): Work {
  if (work.state.pending?.step === 'done') return finalizeTurn(work);
  return work;
}

function commit(work: Work): ActionResult {
  const { state, events } = appendLog(work.state, work.drafts);
  return { ok: true, state, events };
}

/* ─────────────────────────────────────────────────── the dispatcher ── */

export function applyAction(state: GameState, action: GameAction): ActionResult {
  if (state.phase === 'finished') return fail('game-over', 'The game is already over.');

  const playerId = state.currentPlayer;
  const pending = state.pending;

  if (action.type === 'PLAY_CARD') {
    if (pending) return fail('action-in-progress', 'Finish the current card first.');
    return handlePlayCard(state, playerId, action.cardId);
  }

  if (!pending) return fail('no-pending-action', 'Play a personality card first.');

  switch (action.type) {
    case 'MOVE_COLONIST':
      return handleMove(state, pending, playerId, action.colonistId, action.path);
    case 'END_MOVEMENT':
      return handleEndMovement(state, pending);
    case 'BUILD_HOUSE':
      return handleBuild(state, pending, playerId, action.cityId);
    case 'PREFECT_PRODUCE':
      return handlePrefectProduce(state, pending, playerId, action.provinceId, action.goodsPreference ?? []);
    case 'PREFECT_CASH':
      return handlePrefectCash(state, pending, playerId);
    case 'TRADE':
      return handleTrade(state, pending, playerId, action.good, action.direction, action.quantity);
    case 'RECRUIT_COLONIST':
      return handleRecruit(state, pending, playerId, action.colonistType, action.cityId);
    case 'COLONIST_MONEY':
      return handleColonistMoney(state, pending, playerId);
    case 'DIPLOMAT_COPY':
      return handleDiplomatCopy(state, pending, playerId, action.targetPlayerId);
    case 'BUY_CARD':
      return handleBuyCard(state, pending, playerId, action.position, action.wildcards ?? []);
    case 'TRIBUNE_COLONIST':
      return handleTribuneColonist(state, pending, playerId, action.colonistType);
    case 'END_ACTION':
      return handleEndAction(state, pending);
    default:
      return fail('unknown-action', 'Unknown action.');
  }
}

/* ─────────────────────────────────────────────────────── PLAY_CARD ── */

function handlePlayCard(state: GameState, playerId: PlayerId, cardId: CardId): ActionResult {
  const player = getPlayer(state, playerId);
  if (!player.hand.includes(cardId)) return fail('card-not-in-hand', 'That card is not in your hand.');

  const def = cardDef(state, cardId);
  let work: Work = {
    state: withPlayer(state, playerId, (p) => ({
      ...p,
      hand: p.hand.filter((id) => id !== cardId),
      discard: [...p.discard, cardId],
    })),
    drafts: [
      {
        kind: 'card-played',
        playerId,
        text: `${player.name} plays ${def.title}.`,
        data: { playerId, cardId, defId: def.defId, role: def.role },
      },
    ],
  };

  const seed: PendingAction = { cardId, role: def.role, effectiveDefId: def.defId, step: 'done' };
  const entered = enterRole(work, playerId, def, seed);
  work = { state: { ...entered.state, pending: entered.pending }, drafts: entered.drafts };
  return commit(maybeFinalize(work));
}

/* ───────────────────────────────────────────────────────── ARCHITECT ── */

function handleMove(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  colonistId: string,
  path: readonly string[],
): ActionResult {
  if (pending.step !== 'architect:move') return fail('wrong-step', 'You are not moving colonists.');
  const colonist = colonistById(state, colonistId);
  if (!colonist) return fail('no-colonist', 'No such colonist.');
  if (colonist.owner !== playerId) return fail('not-your-colonist', 'That colonist is not yours.');

  const remaining = pending.movementRemaining ?? 0;
  if (path.length > remaining) {
    return fail('not-enough-movement', `That journey costs ${path.length}; you have ${remaining} left.`);
  }

  const problem = validatePath(state, colonist, path);
  if (problem) {
    const messages: Record<string, string> = {
      'empty-path': 'A move must cross at least one route.',
      'unknown-route': 'That route does not exist.',
      'wrong-route-type':
        colonist.type === 'land'
          ? 'Land colonists keep to the roads.'
          : 'Ships keep to the sea lanes.',
      'not-connected': 'Those routes do not join up.',
      backtrack: 'A colonist may not step straight back onto the route it just left.',
      'destination-occupied': 'Another colonist already rests on that route.',
    };
    return fail(problem, messages[problem] ?? 'Illegal move.');
  }

  const destination = path[path.length - 1]!;
  const colonists = state.colonists.map((c) =>
    c.id === colonistId ? { ...c, location: { kind: 'route' as const, routeId: destination } } : c,
  );

  const idx = mapIndex(state.mapId);
  const [a, b] = [idx.routeById[destination]!.from, idx.routeById[destination]!.to];
  const work: Work = {
    state: {
      ...state,
      colonists,
      pending: { ...pending, movementRemaining: remaining - path.length },
    },
    drafts: [
      {
        kind: 'colonist-moved',
        playerId,
        text:
          `${nameOf(state, playerId)}'s ${colonist.type === 'sea' ? 'ship' : 'colonist'} travels to ` +
          `${idx.cityById[a]!.name}–${idx.cityById[b]!.name}.`,
        data: {
          playerId,
          colonistId,
          colonistType: colonist.type,
          from: colonist.location,
          path: [...path],
          to: { kind: 'route', routeId: destination },
          stepsSpent: path.length,
        },
      },
    ],
  };
  return commit(work);
}

function handleEndMovement(state: GameState, pending: PendingAction): ActionResult {
  if (pending.step !== 'architect:move') return fail('wrong-step', 'You are not moving colonists.');
  return commit({ state: { ...state, pending: { ...pending, step: 'architect:build' } }, drafts: [] });
}

function handleBuild(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  cityId: string,
): ActionResult {
  if (pending.step !== 'architect:build') {
    return fail('wrong-step', 'Finish moving your colonists before you build.');
  }
  const idx = mapIndex(state.mapId);
  const city = idx.cityById[cityId];
  if (!city) return fail('no-city', 'No such city.');
  if (city.isCapital) return fail('capital', 'No house may be raised in Roma.'); // RULES 8.7

  const existing = state.houses[cityId] ?? [];
  if (existing.includes(playerId)) return fail('already-built', 'You already hold a house here.'); // 8.5

  const adjacent = colonistsOf(state, playerId).some((c) =>
    adjacentCities(idx, c.location).includes(cityId),
  );
  if (!adjacent) return fail('not-adjacent', 'No colonist of yours stands beside that city.'); // 8.1

  const player = getPlayer(state, playerId);
  if (player.housesRemaining <= 0) return fail('no-houses', 'You have no houses left.');

  const good = state.cityGoods[cityId];
  if (!good) return fail('no-good', 'That city produces nothing.');
  const cost = buildCost(good, existing.length);
  if (player.money < cost.coins) return fail('too-poor', `That house costs ${cost.coins}₴.`);
  if (!canPayGoods(player, cost.goods)) {
    return fail('missing-goods', `That house costs ${cost.goods.join(' + ')}.`);
  }

  const paid = { ...payGoods(player, cost.goods), money: player.money - cost.coins };
  let next: GameState = withPlayer(state, playerId, () => ({
    ...paid,
    housesRemaining: paid.housesRemaining - 1,
  }));
  next = {
    ...next,
    houses: { ...next.houses, [cityId]: [...existing, playerId] },
  };

  return commit({
    state: next,
    drafts: [
      {
        kind: 'house-built',
        playerId,
        text:
          `${player.name} raises a house in ${city.name} ` +
          `(${cost.goods.join(' + ')} and ${cost.coins}₴).`,
        data: {
          playerId,
          cityId,
          coins: cost.coins,
          goods: [...cost.goods],
          multiplier: cost.multiplier,
          housesNow: existing.length + 1,
        },
      },
    ],
  });
}

/* ───────────────────────────────────────────────────────── PREFECT ── */

function handlePrefectProduce(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  provinceId: string,
  preference: readonly Good[],
): ActionResult {
  if (pending.step !== 'prefect:choose') return fail('wrong-step', 'You are not resolving a Prefect.');
  const map = stateMap(state);
  const province = map.provinces.find((p) => p.id === provinceId);
  if (!province) return fail('no-province', 'No such province.');
  const marker = state.bonusMarkers[provinceId];
  if (!marker) return fail('no-marker', 'That province has no bonus marker.');
  if (!marker.active) return fail('province-spent', 'That province has already produced.'); // RULES 6.2a

  let work: Work = {
    state: {
      ...state,
      bonusMarkers: { ...state.bonusMarkers, [provinceId]: { ...marker, active: false } },
    },
    drafts: [],
  };

  // RULES 13.2 — the Praefectus Magnus doubles the *province bonus* only.
  const holdsPraefectus = state.praefectusMagnus === playerId;
  const bonusUnits = holdsPraefectus ? 2 : 1;
  work.drafts.push({
    kind: 'production',
    playerId,
    text: `${nameOf(state, playerId)} sends a Prefect to ${province.name}.`,
    data: { playerId, provinceId, cityIds: [...province.cityIds], markerGood: marker.good },
  });
  work = giveGoods(work, playerId, { [marker.good]: bonusUnits }, [marker.good, ...preference], 'bonus');

  // Every house in the province produces, whoever owns it (RULES 6.2a).
  const perPlayer = new Map<PlayerId, Partial<Record<Good, number>>>();
  for (const cityId of province.cityIds) {
    const good = state.cityGoods[cityId];
    if (!good) continue;
    for (const owner of state.houses[cityId] ?? []) {
      const bag = perPlayer.get(owner) ?? {};
      bag[good] = (bag[good] ?? 0) + 1;
      perPlayer.set(owner, bag);
    }
  }
  for (const owner of [...perPlayer.keys()].sort((a, b) => a - b)) {
    work = giveGoods(work, owner, perPlayer.get(owner)!, owner === playerId ? preference : [], 'production');
  }

  work.state = {
    ...work.state,
    pending: { ...pending, step: 'done', ...(holdsPraefectus ? { praefectusUsed: true } : {}) },
  };
  return commit(maybeFinalize(work));
}

function handlePrefectCash(state: GameState, pending: PendingAction, playerId: PlayerId): ActionResult {
  if (pending.step !== 'prefect:choose') return fail('wrong-step', 'You are not resolving a Prefect.');
  const map = stateMap(state);

  // RULES 6.2b — 1₴ per visible coin, i.e. per coin on every *spent* marker.
  let coins = 0;
  for (const prov of map.provinces) {
    const marker = state.bonusMarkers[prov.id];
    if (marker && !marker.active) coins += BONUS_MARKER_COIN_VALUES[marker.good];
  }

  const bonusMarkers = { ...state.bonusMarkers };
  for (const prov of map.provinces) {
    const m = bonusMarkers[prov.id];
    if (m) bonusMarkers[prov.id] = { ...m, active: true };
  }

  const next: GameState = {
    ...withPlayer(state, playerId, (p) => ({ ...p, money: p.money + coins })),
    bonusMarkers,
    pending: { ...pending, step: 'done' },
  };

  const drafts: LogDraft[] = [
    {
      kind: 'cash-bonus',
      playerId,
      text: `${nameOf(state, playerId)} calls in the provinces and takes ${coins}₴.`,
      data: { playerId, amount: coins },
    },
    {
      kind: 'markers-reset',
      playerId: null,
      text: 'Every province is made ready to produce again.',
      data: {},
    },
  ];
  return commit(maybeFinalize({ state: next, drafts }));
}

/* ───────────────────────────────────────────────────────── MERCATOR ── */

function handleTrade(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  good: Good,
  direction: 'buy' | 'sell',
  quantity: number,
): ActionResult {
  if (pending.step !== 'mercator:trade') return fail('wrong-step', 'You are not trading.');
  const trades = pending.trades ?? [];

  const already = trades.find((t) => t.good === good);
  if (already && already.direction !== direction) {
    return fail('both-directions', `You cannot both buy and sell ${good} in one turn.`); // RULES 11.2
  }
  const distinct = new Set(trades.map((t) => t.good));
  if (!distinct.has(good) && distinct.size >= MERCATOR_MAX_GOODS_TYPES) {
    return fail('too-many-types', `A Mercator trades in at most ${MERCATOR_MAX_GOODS_TYPES} kinds of goods.`);
  }

  const player = getPlayer(state, playerId);
  const quote = quoteTrade(player, good, direction, quantity);
  if (!quote.ok) return fail('bad-trade', quote.reason ?? 'That trade is not possible.');

  const next: GameState = {
    ...withPlayer(state, playerId, (p) => applyTrade(p, good, direction, quantity)),
    pending: { ...pending, trades: [...trades, { good, direction }] },
  };

  return commit({
    state: next,
    drafts: [
      {
        kind: 'trade',
        playerId,
        text:
          direction === 'buy'
            ? `${player.name} buys ${quantity} ${good} for ${quote.total}₴.`
            : `${player.name} sells ${quantity} ${good} for ${quote.total}₴.`,
        data: { playerId, good, direction, quantity, total: quote.total },
      },
    ],
  });
}

/* ───────────────────────────────────────────────────────── COLONIST ── */

function placeColonist(
  work: Work,
  playerId: PlayerId,
  colonistType: ColonistType,
  cityId: string,
): { ok: false; code: string; error: string } | (Work & { ok: true }) {
  const state = work.state;
  const idx = mapIndex(state.mapId);
  const city = idx.cityById[cityId];
  if (!city) return { ok: false, code: 'no-city', error: 'No such city.' };

  const player = getPlayer(state, playerId);
  if (player.reserveColonists[colonistType] <= 0) {
    return { ok: false, code: 'no-reserve', error: `You have no ${colonistType} colonists left.` };
  }
  if (!canPayGoods(player, COLONIST_COST)) {
    return { ok: false, code: 'missing-goods', error: `A colonist costs ${COLONIST_COST.join(' + ')}.` };
  }

  const paid = payGoods(player, COLONIST_COST);
  const id = `p${playerId}:${colonistType}:${state.colonists.filter((c) => c.owner === playerId && c.type === colonistType).length}:${state.turnNumber}`;

  const next: GameState = {
    ...withPlayer(state, playerId, () => ({
      ...paid,
      reserveColonists: {
        ...paid.reserveColonists,
        [colonistType]: paid.reserveColonists[colonistType] - 1,
      },
    })),
    colonists: [
      ...state.colonists,
      { id, owner: playerId, type: colonistType, location: { kind: 'city', cityId } },
    ],
  };

  return {
    ok: true,
    state: next,
    drafts: [
      ...work.drafts,
      {
        kind: 'colonist-recruited',
        playerId,
        text: `${player.name} raises a new ${colonistType === 'sea' ? 'ship' : 'colonist'} in ${city.name}.`,
        data: { playerId, colonistId: id, colonistType, cityId },
      },
    ],
  };
}

function handleRecruit(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  colonistType: ColonistType,
  cityId: string,
): ActionResult {
  if (pending.step !== 'colonist:choose' && pending.step !== 'colonist:recruit') {
    return fail('wrong-step', 'You are not raising colonists.');
  }
  // RULES 6.4a — the capital, or any city where you hold a house.
  const map = stateMap(state);
  const allowed = cityId === map.capitalId || citiesOf(state, playerId).includes(cityId);
  if (!allowed) return fail('no-house-there', 'You may only raise colonists in Roma or your own cities.');

  const placed = placeColonist({ state, drafts: [] }, playerId, colonistType, cityId);
  if (!placed.ok) return fail(placed.code, placed.error);

  return commit({
    state: {
      ...placed.state,
      pending: { ...pending, step: 'colonist:recruit', colonistsPlaced: (pending.colonistsPlaced ?? 0) + 1 },
    },
    drafts: placed.drafts,
  });
}

function handleColonistMoney(state: GameState, pending: PendingAction, playerId: PlayerId): ActionResult {
  if (pending.step !== 'colonist:choose') {
    return fail('wrong-step', 'You have already begun raising colonists.'); // RULES 6.4 — one option only
  }
  const amount = COLONIST_MONEY_BASE + COLONIST_MONEY_PER_COLONIST * colonistsOnBoard(state, playerId);
  const next: GameState = {
    ...withPlayer(state, playerId, (p) => ({ ...p, money: p.money + amount })),
    pending: { ...pending, step: 'done' },
  };
  return commit(
    maybeFinalize({
      state: next,
      drafts: [
        {
          kind: 'money',
          playerId,
          text: `${nameOf(state, playerId)} musters no one and takes ${amount}₴ instead.`,
          data: { playerId, amount },
        },
      ],
    }),
  );
}

/* ───────────────────────────────────────────────────────── DIPLOMAT ── */

/** RULES 6.5 — whose discard pile may be copied. */
export function diplomatTargets(state: GameState, playerId: PlayerId): PlayerId[] {
  const out: PlayerId[] = [];
  for (const p of state.players) {
    if (p.id === playerId) continue;
    const top = topOfDiscard(state, p.id);
    if (!top) continue;
    const def = cardDef(state, top);
    if (def.role === 'diplomat' && !DIPLOMAT_CAN_COPY_DIPLOMAT) continue;
    out.push(p.id);
  }
  return out;
}

function handleDiplomatCopy(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  targetPlayerId: PlayerId,
): ActionResult {
  if (pending.step !== 'diplomat:choose') return fail('wrong-step', 'You are not resolving a Diplomat.');
  if (!diplomatTargets(state, playerId).includes(targetPlayerId)) {
    return fail('bad-target', 'That card cannot be copied.');
  }
  const top = topOfDiscard(state, targetPlayerId)!;
  const def = cardDef(state, top);

  const seed: PendingAction = {
    ...pending,
    copiedFrom: { playerId: targetPlayerId, cardId: top },
  };
  const entered = enterRole(
    {
      state,
      drafts: [
        {
          kind: 'diplomat-copy',
          playerId,
          text: `${nameOf(state, playerId)} takes up ${nameOf(state, targetPlayerId)}'s ${def.title}.`,
          data: { playerId, targetPlayerId, cardId: top, defId: def.defId, role: def.role },
        },
      ],
    },
    playerId,
    def,
    seed,
  );

  return commit(
    maybeFinalize({ state: { ...entered.state, pending: entered.pending }, drafts: entered.drafts }),
  );
}

/* ───────────────────────────────────────────────── SENATOR / CONSUL ── */

function handleBuyCard(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  position: number,
  wildcards: readonly Good[],
): ActionResult {
  const mode = pending.step === 'senator:buy' ? 'senator' : pending.step === 'consul:buy' ? 'consul' : null;
  if (!mode) return fail('wrong-step', 'You are not buying cards.');
  if ((pending.purchasesRemaining ?? 0) <= 0) return fail('no-purchases', 'You have no purchases left.');

  const cardId = state.display[position - 1];
  if (!cardId) return fail('empty-slot', 'There is no card in that position.');

  const price = priceAtPosition(state, position, mode);
  if (!price) return fail('empty-slot', 'There is no card in that position.');

  const player = getPlayer(state, playerId);
  const resolved = resolveCost(player, price, wildcards);
  if (!resolved.ok) return fail('cannot-pay', resolved.reason ?? 'You cannot pay for that card.');

  const def = cardDef(state, cardId);
  let next: GameState = withPlayer(state, playerId, (p) => ({
    ...payGoods(p, resolved.goods),
    hand: [...p.hand, cardId],
  }));
  next = removeFromDisplay(next, position);

  const remaining = (pending.purchasesRemaining ?? 1) - 1;
  let nextPending: PendingAction = {
    ...pending,
    purchasesRemaining: remaining,
    displayDirty: true,
    step: remaining > 0 ? pending.step : 'done',
  };

  // RULES 6.6 — off by default; when enabled the row slides between purchases.
  if (mode === 'senator' && SENATOR_COMPACTS_BETWEEN_PURCHASES && remaining > 0) {
    const refill = compactAndRefill(next);
    next = refill.state;
    nextPending = { ...nextPending, displayDirty: false };
  }

  next = { ...next, pending: nextPending };

  return commit(
    maybeFinalize({
      state: next,
      drafts: [
        {
          kind: 'card-bought',
          playerId,
          text: `${player.name} buys ${def.title} for ${resolved.goods.join(' + ') || 'nothing'}.`,
          data: { playerId, cardId, defId: def.defId, position, paid: [...resolved.goods], mode },
        },
      ],
    }),
  );
}

/* ────────────────────────────────────────────────────────── TRIBUNE ── */

function handleTribuneColonist(
  state: GameState,
  pending: PendingAction,
  playerId: PlayerId,
  colonistType: ColonistType,
): ActionResult {
  if (pending.step !== 'tribune:colonist') return fail('wrong-step', 'You are not resolving a Tribune.');
  if ((pending.colonistsPlaced ?? 0) >= 1) return fail('already-placed', 'A Tribune raises only one colonist.');

  const map = stateMap(state);
  const placed = placeColonist({ state, drafts: [] }, playerId, colonistType, map.capitalId);
  if (!placed.ok) return fail(placed.code, placed.error);

  return commit(
    maybeFinalize({
      state: { ...placed.state, pending: { ...pending, step: 'done', colonistsPlaced: 1 } },
      drafts: placed.drafts,
    }),
  );
}

/* ─────────────────────────────────────────────────────── END_ACTION ── */

function handleEndAction(state: GameState, pending: PendingAction): ActionResult {
  // RULES 6.2 / 6.4 — the Prefect and the Colonist *must* take one of their two
  // alternatives, and one of each pair is always available, so there is nothing
  // to decline. Every other step may be ended early (RULES 5.5).
  if (pending.step === 'prefect:choose') {
    return fail('must-choose', 'A Prefect must either let a province produce or call in the provinces.');
  }
  if (pending.step === 'colonist:choose') {
    return fail('must-choose', 'A Colonist must either raise colonists or take coin.');
  }
  return commit(finalizeTurn({ state: { ...state, pending: { ...pending, step: 'done' } }, drafts: [] }));
}
