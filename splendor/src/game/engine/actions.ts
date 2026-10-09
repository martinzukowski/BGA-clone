/**
 * The state machine. `applyAction` is the ONLY way a GameState changes.
 *
 * Contract:
 *  - Pure: never mutates its input, returns a brand-new state.
 *  - Total: never throws on bad input; returns `{ok:false, reason}` instead.
 *  - Validated: every action goes through validation.ts before anything moves.
 *
 * This signature - (state, playerId, action) -> Result - is deliberately the
 * shape a server route would have. Moving to online play means calling this
 * function on the server instead of in the browser; nothing here touches React,
 * the DOM, localStorage, Math.random or Date.
 */
import type {
  Card,
  GameAction,
  GameState,
  GemColor,
  LogEntry,
  PlayerState,
  Tier,
  TokenPool,
  ActionResult,
} from './types'
import { GEM_COLORS, TOKEN_COLORS } from './types'
import {
  determineWinners,
  playerScore,
  qualifyingPatrons,
  totalTokens,
} from './rules'
import { calculatePurchaseCost, excessTokens, validateAction } from './validation'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

/* ------------------------------------------------------------------ *
 * Internal helpers - all operate on a *draft copy* made by `cloneState`.
 * ------------------------------------------------------------------ */

/** Structural clone. GameState is plain JSON by contract, so this is safe. */
export function cloneState(state: GameState): GameState {
  return {
    ...state,
    rng: { ...state.rng },
    bank: { ...state.bank },
    players: state.players.map((p) => ({
      ...p,
      tokens: { ...p.tokens },
      purchased: [...p.purchased],
      reserved: [...p.reserved],
      reservedHidden: [...p.reservedHidden],
      patrons: [...p.patrons],
    })),
    market: {
      1: { deck: [...state.market[1].deck], visible: [...state.market[1].visible] },
      2: { deck: [...state.market[2].deck], visible: [...state.market[2].visible] },
      3: { deck: [...state.market[3].deck], visible: [...state.market[3].visible] },
    },
    patrons: [...state.patrons],
    availablePatrons: [...state.availablePatrons],
    winnerIds: [...state.winnerIds],
    log: [...state.log],
  }
}

function log(draft: GameState, player: PlayerState, kind: LogEntry['kind'], text: string): void {
  const id = draft.log.length === 0 ? 0 : draft.log[draft.log.length - 1].id + 1
  draft.log.push({ id, playerId: player.id, kind, text })
  // Keep the log bounded so persisted saves stay small.
  if (draft.log.length > 200) draft.log.splice(0, draft.log.length - 200)
}

/** Removes `cardId` from its market row and slides a replacement in. */
function replaceMarketCard(draft: GameState, tier: Tier, cardId: string): void {
  const row = draft.market[tier]
  const slot = row.visible.indexOf(cardId)
  if (slot === -1) return
  row.visible[slot] = row.deck.length > 0 ? (row.deck.shift() as string) : null
}

function moveTokens(
  from: TokenPool,
  to: TokenPool,
  amounts: Partial<TokenPool>,
): void {
  for (const color of TOKEN_COLORS) {
    const amount = amounts[color] ?? 0
    if (amount === 0) continue
    from[color] -= amount
    to[color] += amount
  }
}

function gemListToText(colors: GemColor[]): string {
  const labels = colors.map((c) => c[0].toUpperCase() + c.slice(1))
  if (labels.length <= 1) return labels.join('')
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

/* ------------------------------------------------------------------ *
 * Turn resolution pipeline
 * ------------------------------------------------------------------ */

/**
 * Runs the post-action sequence, stopping early if the player owes an input:
 *   1. token limit  -> phase 'discarding'
 *   2. patrons      -> auto-award one, or phase 'choosing-patron'
 *   3. end of turn  -> end-game check, advance the seat
 *
 * DISCARD and CHOOSE_PATRON re-enter this pipeline once resolved.
 */
function resolveTurnEnd(draft: GameState): void {
  const player = draft.players[draft.currentPlayerIndex]

  if (excessTokens(player) > 0) {
    draft.phase = 'discarding'
    return
  }

  // Only one patron may ever be acquired per turn.
  const qualifying = qualifyingPatrons(draft, player)
  if (qualifying.length === 1) {
    awardPatron(draft, player, qualifying[0])
  } else if (qualifying.length > 1) {
    draft.phase = 'choosing-patron'
    return
  }

  advanceTurn(draft)
}

function awardPatron(draft: GameState, player: PlayerState, patronId: string): void {
  player.patrons.push(patronId)
  draft.availablePatrons = draft.availablePatrons.filter((id) => id !== patronId)
  log(draft, player, 'patron', `${player.name} attracted ${getPatron(patronId).name}.`)
}

function advanceTurn(draft: GameState): void {
  const player = draft.players[draft.currentPlayerIndex]
  draft.turnCount += 1

  // End-game trigger: reaching the threshold starts the final round, but the
  // round always completes so everyone has had an equal number of turns.
  if (draft.endTriggeredByIndex === null && playerScore(player) >= draft.config.winningScore) {
    draft.endTriggeredByIndex = draft.currentPlayerIndex
    log(
      draft,
      player,
      'system',
      `${player.name} reached ${draft.config.winningScore} prestige - final round!`,
    )
  }

  const next = (draft.currentPlayerIndex + 1) % draft.players.length
  const wrapped = next === 0
  if (wrapped) draft.round += 1

  // Everyone started from seat 0, so wrapping back to seat 0 means every player
  // has taken the same number of turns.
  if (draft.endTriggeredByIndex !== null && wrapped) {
    draft.phase = 'finished'
    draft.winnerIds = determineWinners(draft.players)
    draft.currentPlayerIndex = next
    const names = draft.winnerIds
      .map((id) => draft.players.find((p) => p.id === id)?.name ?? id)
      .join(' & ')
    const winner = draft.players.find((p) => p.id === draft.winnerIds[0])
    if (winner) log(draft, winner, 'system', `Game over. ${names} wins.`)
    return
  }

  draft.currentPlayerIndex = next
  draft.phase = draft.endTriggeredByIndex !== null ? 'final-round' : 'playing'
}

/* ------------------------------------------------------------------ *
 * Individual action handlers
 * ------------------------------------------------------------------ */

function applyTakeThree(draft: GameState, player: PlayerState, colors: GemColor[]): void {
  for (const color of colors) {
    draft.bank[color] -= 1
    player.tokens[color] += 1
  }
  log(draft, player, 'take', `${player.name} took ${gemListToText(colors)}.`)
}

function applyTakeTwo(draft: GameState, player: PlayerState, color: GemColor): void {
  draft.bank[color] -= 2
  player.tokens[color] += 2
  const label = color[0].toUpperCase() + color.slice(1)
  log(draft, player, 'take', `${player.name} took two ${label}.`)
}

/** Hands the player a gold token if the bank has one. Shared by both reserves. */
function grantGold(draft: GameState, player: PlayerState): boolean {
  if (draft.bank.gold <= 0) return false
  draft.bank.gold -= 1
  player.tokens.gold += 1
  return true
}

function applyReserveVisible(draft: GameState, player: PlayerState, card: Card): void {
  replaceMarketCard(draft, card.tier, card.id)
  player.reserved.push(card.id)
  const gold = grantGold(draft, player)
  log(
    draft,
    player,
    'reserve',
    `${player.name} reserved ${card.name}${gold ? ' and took a Gold' : ''}.`,
  )
}

function applyReserveDeck(draft: GameState, player: PlayerState, tier: Tier): void {
  const cardId = draft.market[tier].deck.shift() as string
  player.reserved.push(cardId)
  // Blind draws stay hidden from opponents until purchased.
  player.reservedHidden.push(cardId)
  const gold = grantGold(draft, player)
  log(
    draft,
    player,
    'reserve',
    `${player.name} reserved a face-down Tier ${tier} card${gold ? ' and took a Gold' : ''}.`,
  )
}

function applyPurchase(
  draft: GameState,
  player: PlayerState,
  card: Card,
  payment: TokenPool,
): void {
  const fromReserve = player.reserved.includes(card.id)
  moveTokens(player.tokens, draft.bank, payment)

  if (fromReserve) {
    player.reserved = player.reserved.filter((id) => id !== card.id)
    player.reservedHidden = player.reservedHidden.filter((id) => id !== card.id)
  } else {
    replaceMarketCard(draft, card.tier, card.id)
  }
  player.purchased.push(card.id)
  log(
    draft,
    player,
    'purchase',
    `${player.name} purchased ${card.name}${fromReserve ? ' from reserve' : ''}.`,
  )
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

export function applyAction(
  state: GameState,
  playerId: string,
  action: GameAction,
): ActionResult {
  const validity = validateAction(state, playerId, action)
  if (!validity.ok) return { ok: false, reason: validity.reason }

  const draft = cloneState(state)
  const player = draft.players[draft.currentPlayerIndex]

  switch (action.type) {
    case 'TAKE_THREE': {
      applyTakeThree(draft, player, action.colors)
      resolveTurnEnd(draft)
      break
    }
    case 'TAKE_TWO': {
      applyTakeTwo(draft, player, action.color)
      resolveTurnEnd(draft)
      break
    }
    case 'RESERVE_VISIBLE': {
      applyReserveVisible(draft, player, getCard(action.cardId))
      resolveTurnEnd(draft)
      break
    }
    case 'RESERVE_DECK': {
      applyReserveDeck(draft, player, action.tier)
      resolveTurnEnd(draft)
      break
    }
    case 'PURCHASE': {
      const card = getCard(action.cardId)
      // Validation already proved affordability; recompute the cheapest payment
      // when the caller did not pin one down.
      const payment = action.payment ?? calculatePurchaseCost(player, card)?.payment
      if (!payment) return { ok: false, reason: 'You cannot afford this card yet.' }
      applyPurchase(draft, player, card, payment)
      resolveTurnEnd(draft)
      break
    }
    case 'DISCARD': {
      moveTokens(player.tokens, draft.bank, action.tokens)
      const returned = totalTokens(action.tokens)
      log(draft, player, 'discard', `${player.name} returned ${returned} token(s) to the bank.`)
      // Back into the pipeline; the token check will now pass.
      draft.phase = draft.endTriggeredByIndex !== null ? 'final-round' : 'playing'
      resolveTurnEnd(draft)
      break
    }
    case 'CHOOSE_PATRON': {
      awardPatron(draft, player, action.patronId)
      draft.phase = draft.endTriggeredByIndex !== null ? 'final-round' : 'playing'
      advanceTurn(draft)
      break
    }
  }

  return { ok: true, state: draft }
}

/* ------------------------------------------------------------------ *
 * Enumeration of legal moves - used by the AI and by tests.
 * ------------------------------------------------------------------ */

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  const out: T[][] = []
  for (let i = 0; i <= items.length - size; i++) {
    for (const rest of combinations(items.slice(i + 1), size - 1)) {
      out.push([items[i], ...rest])
    }
  }
  return out
}

/**
 * Every legal MAIN action for the seat to move, deduplicated.
 * Used by every difficulty of AI, so no bot can even represent an illegal move.
 */
export function legalMainActions(state: GameState, playerId: string): GameAction[] {
  if (state.phase !== 'playing' && state.phase !== 'final-round') return []
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return []

  const actions: GameAction[] = []
  const available = GEM_COLORS.filter((c) => state.bank[c] > 0)
  const takeSize = Math.min(3, available.length)
  if (takeSize > 0) {
    for (const combo of combinations(available, takeSize)) {
      actions.push({ type: 'TAKE_THREE', colors: combo })
    }
  }
  for (const color of GEM_COLORS) {
    if (validateAction(state, playerId, { type: 'TAKE_TWO', color }).ok) {
      actions.push({ type: 'TAKE_TWO', color })
    }
  }
  for (const tier of [1, 2, 3] as Tier[]) {
    for (const cardId of state.market[tier].visible) {
      if (!cardId) continue
      if (validateAction(state, playerId, { type: 'RESERVE_VISIBLE', cardId }).ok) {
        actions.push({ type: 'RESERVE_VISIBLE', cardId })
      }
      if (validateAction(state, playerId, { type: 'PURCHASE', cardId }).ok) {
        actions.push({ type: 'PURCHASE', cardId })
      }
    }
    if (validateAction(state, playerId, { type: 'RESERVE_DECK', tier }).ok) {
      actions.push({ type: 'RESERVE_DECK', tier })
    }
  }
  for (const cardId of player.reserved) {
    if (validateAction(state, playerId, { type: 'PURCHASE', cardId }).ok) {
      actions.push({ type: 'PURCHASE', cardId })
    }
  }
  return actions
}

