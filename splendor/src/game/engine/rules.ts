/**
 * Rule constants and pure derived-value helpers.
 * Nothing here mutates state; everything is a function of state.
 */
import type {
  Card,
  GameState,
  GemColor,
  GemCount,
  PlayerState,
  Tier,
  TokenColor,
  TokenPool,
  VisiblePlayerState,
} from './types'
import { GEM_COLORS, TOKEN_COLORS } from './types'
import { getCard, tryGetCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

/** Prestige that triggers the final round. */
export const WINNING_SCORE = 15
/** Tokens a player may hold once their turn ends. */
export const TOKEN_LIMIT = 10
/** Cards a player may hold in reserve. */
export const RESERVE_LIMIT = 3
/** Face-up cards per tier. */
export const MARKET_SIZE = 4
/** Gold tokens in the supply, independent of player count. */
export const GOLD_SUPPLY = 5
/** A colour must have at least this many tokens in the bank to take two of it. */
export const TAKE_TWO_MIN_BANK = 4
/** Schema version for persisted saves. */
export const STATE_VERSION = 1

export const TIERS: readonly Tier[] = [1, 2, 3]

/**
 * Coloured tokens per colour by total player count.
 * DOCUMENTED ASSUMPTION: 2p -> 4, 3p -> 5, 4p -> 7, matching the classic scaling.
 * Player counts outside 2-4 are not supported by the setup screen; the table
 * clamps so the engine can never produce a negative supply.
 */
export function tokensPerColor(playerCount: number): number {
  if (playerCount <= 2) return 4
  if (playerCount === 3) return 5
  return 7
}

/** Patrons dealt = playerCount + 1. */
export function patronCount(playerCount: number): number {
  return playerCount + 1
}

export function emptyGems(): GemCount {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0 }
}

export function emptyTokens(): TokenPool {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
}

export function cloneTokens(pool: TokenPool): TokenPool {
  return { ...pool }
}

export function totalTokens(pool: TokenPool): number {
  return TOKEN_COLORS.reduce((sum, c) => sum + pool[c], 0)
}

export function totalGems(gems: GemCount): number {
  return GEM_COLORS.reduce((sum, c) => sum + gems[c], 0)
}

/** Permanent bonuses granted by a player's purchased cards. */
export function playerBonuses(player: PlayerState | VisiblePlayerState): GemCount {
  const bonuses = emptyGems()
  for (const id of player.purchased) {
    bonuses[getCard(id).bonus] += 1
  }
  return bonuses
}

/** Prestige from purchased cards plus acquired patrons. */
export function playerScore(player: PlayerState | VisiblePlayerState): number {
  let score = 0
  for (const id of player.purchased) score += getCard(id).points
  for (const id of player.patrons) score += getPatron(id).points
  return score
}

/** Cards purchased — the tie-break metric (fewer cards wins ties). */
export function purchasedCount(player: PlayerState | VisiblePlayerState): number {
  return player.purchased.length
}

/**
 * Cost of `card` for `player` after permanent discounts, ignoring whether they
 * can actually pay. Never negative.
 */
export function discountedCost(card: Card, bonuses: GemCount): GemCount {
  const cost = emptyGems()
  for (const color of GEM_COLORS) {
    cost[color] = Math.max(0, card.cost[color] - bonuses[color])
  }
  return cost
}

/**
 * A full breakdown of "can I buy this, and if not, what am I short?".
 *
 * The UI needs every one of these numbers to explain affordability at a glance,
 * and computing them in one place keeps the card, the purse bar and the engine
 * telling the same story. Purely derived - it decides nothing.
 */
export interface Affordability {
  /** Cost after permanent bonuses - the number actually printed on the card. */
  effective: GemCount
  /** How much of each colour the player can cover from matching tokens. */
  paidByTokens: GemCount
  /** Shortfall per colour, before gold is applied. */
  shortByColor: GemCount
  /** Total gems short across all colours, before gold. */
  shortTotal: number
  /** Gold that would have to be spent as wilds. */
  goldNeeded: number
  /** Gold the player actually holds. */
  goldHeld: number
  /** Gems still uncovered once all available gold is spent. 0 means buyable. */
  stillMissing: number
  affordable: boolean
}

export function affordability(
  player: PlayerState | VisiblePlayerState,
  card: Card,
  bonuses: GemCount = playerBonuses(player),
): Affordability {
  const effective = discountedCost(card, bonuses)
  const paidByTokens = emptyGems()
  const shortByColor = emptyGems()
  let shortTotal = 0

  for (const color of GEM_COLORS) {
    const paid = Math.min(player.tokens[color], effective[color])
    paidByTokens[color] = paid
    shortByColor[color] = effective[color] - paid
    shortTotal += shortByColor[color]
  }

  const goldHeld = player.tokens.gold
  const goldNeeded = shortTotal
  return {
    effective,
    paidByTokens,
    shortByColor,
    shortTotal,
    goldNeeded,
    goldHeld,
    stillMissing: Math.max(0, shortTotal - goldHeld),
    affordable: shortTotal <= goldHeld,
  }
}

/** Every card currently face up across all tiers, skipping empty slots. */
export function visibleCards(state: {
  market: Record<Tier, { visible: (string | null)[] }>
}): Card[] {
  const out: Card[] = []
  for (const tier of TIERS) {
    for (const id of state.market[tier].visible) {
      const card = tryGetCard(id)
      if (card) out.push(card)
    }
  }
  return out
}

/** Does `player` meet a patron's bonus requirement? Tokens never count. */
export function meetsPatronRequirement(bonuses: GemCount, requirement: GemCount): boolean {
  return GEM_COLORS.every((c) => bonuses[c] >= requirement[c])
}

/** Available patrons this player currently qualifies for. */
export function qualifyingPatrons(state: GameState, player: PlayerState): string[] {
  const bonuses = playerBonuses(player)
  return state.availablePatrons.filter((id) =>
    meetsPatronRequirement(bonuses, getPatron(id).requirement),
  )
}

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex]
}

export function findPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId)
}

/**
 * Winners after the final round: highest prestige, tie broken by FEWER
 * development cards purchased. If still tied, all tied players are winners.
 */
export function determineWinners(players: PlayerState[]): string[] {
  let best: PlayerState[] = []
  let bestScore = -Infinity
  let bestCards = Infinity
  for (const player of players) {
    const score = playerScore(player)
    const cards = purchasedCount(player)
    if (score > bestScore || (score === bestScore && cards < bestCards)) {
      best = [player]
      bestScore = score
      bestCards = cards
    } else if (score === bestScore && cards === bestCards) {
      best.push(player)
    }
  }
  return best.map((p) => p.id)
}

/** Colours the bank still has at least one of. */
export function availableGemColors(bank: TokenPool): GemColor[] {
  return GEM_COLORS.filter((c) => bank[c] > 0)
}

export function addTokens(pool: TokenPool, color: TokenColor, amount: number): TokenPool {
  return { ...pool, [color]: pool[color] + amount }
}

/** Sum of two pools. */
export function mergeTokens(a: TokenPool, b: TokenPool): TokenPool {
  const out = emptyTokens()
  for (const c of TOKEN_COLORS) out[c] = a[c] + b[c]
  return out
}

/** a - b, may go negative (callers validate). */
export function subtractTokens(a: TokenPool, b: TokenPool): TokenPool {
  const out = emptyTokens()
  for (const c of TOKEN_COLORS) out[c] = a[c] - b[c]
  return out
}
