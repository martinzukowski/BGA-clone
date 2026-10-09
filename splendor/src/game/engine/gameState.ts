/**
 * GameState services: hidden-information redaction, serialization, and the
 * conservation invariants that the simulation tests assert on every ply.
 *
 * `redactFor` is the single most important function for future online play AND
 * for honest AI: it is what a server would send to one seat. The bots are only
 * ever handed the output of this function, so they *structurally cannot* see
 * deck order or an opponent's face-down reserve.
 */
import type { GameState, PlayerState, VisibleGameState, VisiblePlayerState } from './types'
import { GEM_COLORS, TOKEN_COLORS } from './types'
import { CARDS_BY_TIER, getCard } from '@/game/data/cards'
import { GOLD_SUPPLY, STATE_VERSION, TIERS, tokensPerColor } from './rules'

/* ------------------------------------------------------------------ *
 * Redaction
 * ------------------------------------------------------------------ */

function redactPlayer(player: PlayerState, viewerId: string): VisiblePlayerState {
  const isSelf = player.id === viewerId
  const visibleReserved = isSelf
    ? [...player.reserved]
    : player.reserved.filter((id) => !player.reservedHidden.includes(id))
  return {
    id: player.id,
    name: player.name,
    difficulty: player.difficulty,
    isBot: player.isBot,
    tokens: { ...player.tokens },
    purchased: [...player.purchased],
    patrons: [...player.patrons],
    reserved: visibleReserved,
    hiddenReservedCount: isSelf ? 0 : player.reservedHidden.length,
  }
}

/** Produce the view of `state` that seat `viewerId` is entitled to see. */
export function redactFor(state: GameState, viewerId: string): VisibleGameState {
  const market = {} as VisibleGameState['market']
  for (const tier of TIERS) {
    market[tier] = {
      deckCount: state.market[tier].deck.length,
      visible: [...state.market[tier].visible],
    }
  }
  return {
    version: state.version,
    config: state.config,
    players: state.players.map((p) => redactPlayer(p, viewerId)),
    currentPlayerIndex: state.currentPlayerIndex,
    round: state.round,
    turnCount: state.turnCount,
    phase: state.phase,
    bank: { ...state.bank },
    market,
    patrons: [...state.patrons],
    availablePatrons: [...state.availablePatrons],
    endTriggeredByIndex: state.endTriggeredByIndex,
    winnerIds: [...state.winnerIds],
    log: state.log.map((entry) => ({ ...entry })),
    viewerId,
  }
}

/* ------------------------------------------------------------------ *
 * Serialization
 * ------------------------------------------------------------------ */

export function serializeState(state: GameState): string {
  return JSON.stringify(state)
}

/** Returns null for anything that is not a state of the current schema. */
export function deserializeState(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as GameState
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== STATE_VERSION) return null
    if (!Array.isArray(parsed.players) || parsed.players.length === 0) return null
    if (!parsed.market || !parsed.market[1] || !parsed.market[2] || !parsed.market[3]) return null
    if (!parsed.rng || typeof parsed.rng.seed !== 'number') return null
    // Every referenced card id must resolve, or the save is from another build.
    for (const tier of TIERS) {
      for (const id of parsed.market[tier].deck) getCard(id)
      for (const id of parsed.market[tier].visible) if (id) getCard(id)
    }
    for (const player of parsed.players) {
      for (const id of [...player.purchased, ...player.reserved]) getCard(id)
    }
    return parsed
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ *
 * Invariants
 * ------------------------------------------------------------------ */

export interface InvariantViolation {
  rule: string
  detail: string
}

/**
 * Conservation checks. Every token and every card must be accounted for
 * somewhere. The simulation tests run this after every single ply.
 */
export function checkInvariants(state: GameState): InvariantViolation[] {
  const problems: InvariantViolation[] = []
  const fail = (rule: string, detail: string) => problems.push({ rule, detail })

  // 1. No negative resources anywhere.
  for (const color of TOKEN_COLORS) {
    if (state.bank[color] < 0) fail('non-negative-bank', `bank ${color} = ${state.bank[color]}`)
    for (const player of state.players) {
      if (player.tokens[color] < 0) {
        fail('non-negative-tokens', `${player.id} ${color} = ${player.tokens[color]}`)
      }
    }
  }

  // 2. Token conservation: bank + all players == the original supply.
  const perColor = tokensPerColor(state.config.playerCount)
  for (const color of GEM_COLORS) {
    const total =
      state.bank[color] + state.players.reduce((sum, p) => sum + p.tokens[color], 0)
    if (total !== perColor) {
      fail('token-conservation', `${color}: expected ${perColor}, found ${total}`)
    }
  }
  const goldTotal = state.bank.gold + state.players.reduce((sum, p) => sum + p.tokens.gold, 0)
  if (goldTotal !== GOLD_SUPPLY) {
    fail('token-conservation', `gold: expected ${GOLD_SUPPLY}, found ${goldTotal}`)
  }

  // 3. Card conservation per tier, and no duplicated card anywhere.
  const seen = new Set<string>()
  const addSeen = (id: string, where: string) => {
    if (seen.has(id)) fail('card-uniqueness', `${id} appears twice (${where})`)
    seen.add(id)
  }
  for (const tier of TIERS) {
    for (const id of state.market[tier].deck) addSeen(id, `deck ${tier}`)
    for (const id of state.market[tier].visible) if (id) addSeen(id, `market ${tier}`)
  }
  for (const player of state.players) {
    for (const id of player.purchased) addSeen(id, `${player.id} purchased`)
    for (const id of player.reserved) addSeen(id, `${player.id} reserved`)
  }
  const expectedCards = TIERS.reduce((sum, t) => sum + CARDS_BY_TIER[t].length, 0)
  if (seen.size !== expectedCards) {
    fail('card-conservation', `expected ${expectedCards} distinct cards, found ${seen.size}`)
  }

  // 4. Market rows are always 4 slots, and a slot may only be empty when the
  //    matching deck is exhausted.
  for (const tier of TIERS) {
    const row = state.market[tier]
    if (row.visible.length !== 4) {
      fail('market-size', `tier ${tier} has ${row.visible.length} slots`)
    }
    if (row.visible.some((id) => id === null) && row.deck.length > 0) {
      fail('market-refill', `tier ${tier} has an empty slot but ${row.deck.length} cards left`)
    }
  }

  // 5. Reserve limit, and hidden reserves must be a subset of reserves.
  for (const player of state.players) {
    if (player.reserved.length > state.config.reserveLimit) {
      fail('reserve-limit', `${player.id} holds ${player.reserved.length} reserved cards`)
    }
    for (const id of player.reservedHidden) {
      if (!player.reserved.includes(id)) {
        fail('hidden-reserve-subset', `${player.id} hides ${id} which is not reserved`)
      }
    }
  }

  // 6. Token limit, enforced only once a turn has fully resolved.
  if (state.phase !== 'discarding') {
    for (const player of state.players) {
      const held = TOKEN_COLORS.reduce((sum, c) => sum + player.tokens[c], 0)
      if (held > state.config.tokenLimit) {
        fail('token-limit', `${player.id} holds ${held} tokens outside a discard step`)
      }
    }
  }

  // 7. Patron bookkeeping: available + owned == dealt, no duplicates.
  const owned = state.players.flatMap((p) => p.patrons)
  const accounted = [...state.availablePatrons, ...owned]
  if (accounted.length !== state.patrons.length || new Set(accounted).size !== accounted.length) {
    fail('patron-conservation', `dealt ${state.patrons.length}, accounted ${accounted.length}`)
  }

  return problems
}

