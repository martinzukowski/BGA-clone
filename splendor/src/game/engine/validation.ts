/**
 * THE central rule-validation layer.
 *
 * Every state transition in actions.ts calls into this file first. The UI also
 * calls these predicates so it can grey out illegal buttons AND explain why -
 * but the UI is never the thing that *enforces* a rule. If a check does not
 * exist here, it does not exist.
 *
 * Each predicate returns `{ok:true}` or `{ok:false, reason}` where `reason` is
 * a player-facing sentence.
 */
import type {
  Card,
  GameAction,
  GameState,
  GemColor,
  PlayerState,
  Tier,
  TokenPool,
  Validity,
} from './types'
import { GEM_COLORS, TOKEN_COLORS } from './types'
import {
  availableGemColors,
  discountedCost,
  emptyTokens,
  playerBonuses,
  RESERVE_LIMIT,
  TAKE_TWO_MIN_BANK,
  TOKEN_LIMIT,
  totalTokens,
} from './rules'
import { tryGetCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

const OK: Validity = { ok: true }
function no(reason: string): Validity {
  return { ok: false, reason }
}

/* ------------------------------------------------------------------ *
 * Turn / phase gating
 * ------------------------------------------------------------------ */

/** Phases in which a player may still take their single main action. */
function isMainActionPhase(state: GameState): boolean {
  return state.phase === 'playing' || state.phase === 'final-round'
}

export function isPlayersTurn(state: GameState, playerId: string): boolean {
  return state.players[state.currentPlayerIndex]?.id === playerId
}

function requireTurn(state: GameState, playerId: string): Validity {
  if (state.phase === 'finished') return no('The game is over.')
  if (!isPlayersTurn(state, playerId)) return no('It is not your turn.')
  return OK
}

function requireMainAction(state: GameState, playerId: string): Validity {
  const turn = requireTurn(state, playerId)
  if (!turn.ok) return turn
  if (state.phase === 'discarding') return no('You must return tokens down to the limit first.')
  if (state.phase === 'choosing-patron') return no('You must choose a patron first.')
  if (!isMainActionPhase(state)) return no('You cannot act right now.')
  return OK
}

/* ------------------------------------------------------------------ *
 * A. Take three different gems
 * ------------------------------------------------------------------ */

/**
 * Take up to three DIFFERENT colours.
 *
 * DOCUMENTED ASSUMPTION: taking fewer than three is legal only when the bank
 * cannot supply three distinct colours - you may not voluntarily under-draw.
 * (This matches the standard rule and keeps the AI move list finite.)
 */
export function canTakeThree(state: GameState, playerId: string, colors: GemColor[]): Validity {
  const gate = requireMainAction(state, playerId)
  if (!gate.ok) return gate

  if (colors.length === 0) return no('Pick at least one gem.')
  if (colors.length > 3) return no('You may take at most three gems this way.')
  if (new Set(colors).size !== colors.length) return no('The three gems must be different colours.')
  for (const color of colors) {
    if (!GEM_COLORS.includes(color)) return no(`${color} is not a gem colour.`)
    if (state.bank[color] < 1) return no(`The bank has no ${color} gems left.`)
  }

  const distinctAvailable = availableGemColors(state.bank).length
  const required = Math.min(3, distinctAvailable)
  if (colors.length < required) {
    return no(`You must take ${required} different gems when the bank can supply them.`)
  }
  return OK
}

/* ------------------------------------------------------------------ *
 * B. Take two of the same colour
 * ------------------------------------------------------------------ */

export function canTakeTwoSame(state: GameState, playerId: string, color: GemColor): Validity {
  const gate = requireMainAction(state, playerId)
  if (!gate.ok) return gate
  if (!GEM_COLORS.includes(color)) return no(`${color} is not a gem colour.`)
  if (state.bank[color] < TAKE_TWO_MIN_BANK) {
    return no(
      `You can only take two ${color} when the bank holds at least ${TAKE_TWO_MIN_BANK} (it holds ${state.bank[color]}).`,
    )
  }
  return OK
}

/* ------------------------------------------------------------------ *
 * C/D. Reserving
 * ------------------------------------------------------------------ */

function reserveCapacity(player: PlayerState): Validity {
  if (player.reserved.length >= RESERVE_LIMIT) {
    return no(`Cannot reserve: you already hold ${RESERVE_LIMIT} reserved cards.`)
  }
  return OK
}

export function canReserveVisible(state: GameState, playerId: string, cardId: string): Validity {
  const gate = requireMainAction(state, playerId)
  if (!gate.ok) return gate
  const player = state.players[state.currentPlayerIndex]
  const capacity = reserveCapacity(player)
  if (!capacity.ok) return capacity
  const card = tryGetCard(cardId)
  if (!card) return no('That card does not exist.')
  if (!state.market[card.tier].visible.includes(cardId)) {
    return no('That card is not on the market.')
  }
  return OK
}

export function canReserveDeck(state: GameState, playerId: string, tier: Tier): Validity {
  const gate = requireMainAction(state, playerId)
  if (!gate.ok) return gate
  const player = state.players[state.currentPlayerIndex]
  const capacity = reserveCapacity(player)
  if (!capacity.ok) return capacity
  if (!state.market[tier]) return no('That tier does not exist.')
  if (state.market[tier].deck.length === 0) {
    return no(`The tier ${tier} deck is empty.`)
  }
  return OK
}

/* ------------------------------------------------------------------ *
 * E/F. Purchasing
 * ------------------------------------------------------------------ */

export interface PurchasePlan {
  /** Exact tokens leaving the player stock. */
  payment: TokenPool
  /** How many gold tokens are being spent as wilds. */
  goldSpent: number
}

/**
 * Cheapest payment for `card`, or null if the player cannot afford it.
 * "Cheapest" = spend as few gold as possible; gold is the scarcest resource.
 */
export function calculatePurchaseCost(player: PlayerState, card: Card): PurchasePlan | null {
  const bonuses = playerBonuses(player)
  const needed = discountedCost(card, bonuses)
  const payment = emptyTokens()
  let goldSpent = 0
  for (const color of GEM_COLORS) {
    const fromTokens = Math.min(player.tokens[color], needed[color])
    payment[color] = fromTokens
    goldSpent += needed[color] - fromTokens
  }
  if (goldSpent > player.tokens.gold) return null
  payment.gold = goldSpent
  return { payment, goldSpent }
}

export function canAffordCard(player: PlayerState, card: Card): boolean {
  return calculatePurchaseCost(player, card) !== null
}

/**
 * Validates an explicit payment: no overpaying a colour, gold exactly covers
 * the shortfall, and the player actually holds every token offered.
 */
function validateExplicitPayment(player: PlayerState, card: Card, payment: TokenPool): Validity {
  const bonuses = playerBonuses(player)
  const needed = discountedCost(card, bonuses)
  let shortfall = 0
  for (const color of GEM_COLORS) {
    if (payment[color] < 0) return no('Payment cannot be negative.')
    if (payment[color] > needed[color]) return no(`You are overpaying ${color}.`)
    if (payment[color] > player.tokens[color]) return no(`You do not have that many ${color} gems.`)
    shortfall += needed[color] - payment[color]
  }
  if (payment.gold < 0) return no('Payment cannot be negative.')
  if (payment.gold > player.tokens.gold) return no('You do not have that much gold.')
  if (payment.gold !== shortfall) {
    return no(
      `Gold must cover exactly the shortfall (${shortfall} needed, ${payment.gold} offered).`,
    )
  }
  return OK
}

export function canPurchaseCard(
  state: GameState,
  playerId: string,
  cardId: string,
  payment?: TokenPool,
): Validity {
  const gate = requireMainAction(state, playerId)
  if (!gate.ok) return gate
  const player = state.players[state.currentPlayerIndex]
  const card = tryGetCard(cardId)
  if (!card) return no('That card does not exist.')

  const fromMarket = state.market[card.tier].visible.includes(cardId)
  const fromReserve = player.reserved.includes(cardId)
  if (!fromMarket && !fromReserve) {
    return no('That card is neither on the market nor in your reserve.')
  }
  if (payment) return validateExplicitPayment(player, card, payment)
  if (!canAffordCard(player, card)) {
    return no('You cannot afford this card yet.')
  }
  return OK
}

/** Convenience wrapper mirroring the naming in the spec. */
export function canPurchaseReservedCard(
  state: GameState,
  playerId: string,
  cardId: string,
): Validity {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return no('Unknown player.')
  if (!player.reserved.includes(cardId)) return no('That card is not in your reserve.')
  return canPurchaseCard(state, playerId, cardId)
}

/* ------------------------------------------------------------------ *
 * Token limit / discarding
 * ------------------------------------------------------------------ */

export function excessTokens(player: PlayerState): number {
  return Math.max(0, totalTokens(player.tokens) - TOKEN_LIMIT)
}

export function canDiscard(state: GameState, playerId: string, tokens: TokenPool): Validity {
  const turn = requireTurn(state, playerId)
  if (!turn.ok) return turn
  if (state.phase !== 'discarding') return no('You do not need to return tokens.')
  const player = state.players[state.currentPlayerIndex]
  let count = 0
  for (const color of TOKEN_COLORS) {
    if (tokens[color] < 0) return no('Cannot return a negative number of tokens.')
    if (tokens[color] > player.tokens[color]) {
      return no(`You do not hold that many ${color} tokens.`)
    }
    count += tokens[color]
  }
  const needed = excessTokens(player)
  if (count !== needed) {
    return no(`Return exactly ${needed} token${needed === 1 ? '' : 's'} (you selected ${count}).`)
  }
  return OK
}

/* ------------------------------------------------------------------ *
 * Patrons
 * ------------------------------------------------------------------ */

export function canAcquirePatron(state: GameState, playerId: string, patronId: string): Validity {
  const turn = requireTurn(state, playerId)
  if (!turn.ok) return turn
  if (state.phase !== 'choosing-patron') return no('There is no patron to choose right now.')
  if (!state.availablePatrons.includes(patronId)) return no('That patron is no longer available.')
  const player = state.players[state.currentPlayerIndex]
  const bonuses = playerBonuses(player)
  const patron = getPatron(patronId)
  const meets = GEM_COLORS.every((c) => bonuses[c] >= patron.requirement[c])
  if (!meets) return no('You do not meet that patron requirement.')
  return OK
}

/* ------------------------------------------------------------------ *
 * Dispatcher
 * ------------------------------------------------------------------ */

/** Single entry point mirroring `applyAction`, used by the AI legality audit. */
export function validateAction(state: GameState, playerId: string, action: GameAction): Validity {
  switch (action.type) {
    case 'TAKE_THREE':
      return canTakeThree(state, playerId, action.colors)
    case 'TAKE_TWO':
      return canTakeTwoSame(state, playerId, action.color)
    case 'RESERVE_VISIBLE':
      return canReserveVisible(state, playerId, action.cardId)
    case 'RESERVE_DECK':
      return canReserveDeck(state, playerId, action.tier)
    case 'PURCHASE':
      return canPurchaseCard(state, playerId, action.cardId, action.payment)
    case 'DISCARD':
      return canDiscard(state, playerId, action.tokens)
    case 'CHOOSE_PATRON':
      return canAcquirePatron(state, playerId, action.patronId)
    default:
      return no('Unknown action.')
  }
}
