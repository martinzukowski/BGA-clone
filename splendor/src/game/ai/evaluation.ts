/**
 * Shared AI evaluation machinery.
 *
 * Everything here is a pure function of a GameState the bot is *entitled* to
 * hold (see determinize.ts). No hidden information leaks in: the bot never
 * reads `market[t].deck` and never reads another player's `reservedHidden`.
 *
 * Two levels of judgement live here:
 *   - `scoreAction`   : a fast per-action heuristic (Medium AI, Hard's filter)
 *   - `evaluatePosition` : a positional score used to compare whole states
 *                          (Hard AI's leaf evaluation)
 */
import type {
  Card,
  GameState,
  GemColor,
  GemCount,
  PlayerState,
  GameAction,
  TokenPool,
} from '@/game/engine/types'
import { GEM_COLORS, TOKEN_COLORS } from '@/game/engine/types'
import { discountedCost, playerBonuses, playerScore, visibleCards } from '@/game/engine/rules'
import { calculatePurchaseCost } from '@/game/engine/validation'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

/* ------------------------------------------------------------------ *
 * Primitive measures
 * ------------------------------------------------------------------ */

/** Gems the player is short of for `card`, after discounts, ignoring gold. */
export function shortfall(player: PlayerState, card: Card, bonuses = playerBonuses(player)): GemCount {
  const needed = discountedCost(card, bonuses)
  const gap: GemCount = { white: 0, blue: 0, green: 0, red: 0, black: 0 }
  for (const color of GEM_COLORS) {
    gap[color] = Math.max(0, needed[color] - player.tokens[color])
  }
  return gap
}

/** Total missing gems for a card once gold wilds are applied. */
export function missingAfterGold(player: PlayerState, card: Card): number {
  const gap = shortfall(player, card)
  const total = GEM_COLORS.reduce((sum, c) => sum + gap[c], 0)
  return Math.max(0, total - player.tokens.gold)
}

/**
 * Rough number of turns before `card` becomes affordable, assuming the player
 * spends every turn drawing the gems they still need (about 2.4 useful gems
 * per token-taking turn once you account for bank shortages and the 3-distinct
 * restriction). Returns 0 when already affordable, Infinity when the missing
 * colours are simply not obtainable.
 */
export function turnsToAfford(state: GameState, player: PlayerState, card: Card): number {
  if (calculatePurchaseCost(player, card)) return 0
  const gap = shortfall(player, card)
  let missing = 0
  let unobtainable = 0
  for (const color of GEM_COLORS) {
    if (gap[color] === 0) continue
    missing += gap[color]
    // The bank can only supply what it holds; the rest must come from gold.
    unobtainable += Math.max(0, gap[color] - state.bank[color])
  }
  const covered = Math.min(player.tokens.gold, missing)
  const remaining = missing - covered
  if (unobtainable > player.tokens.gold) return Infinity
  if (remaining <= 0) return 0
  return remaining / 2.4
}

/** Prestige a player still needs to trigger the end game. */
export function prestigeGap(state: GameState, player: PlayerState): number {
  return Math.max(0, state.config.winningScore - playerScore(player))
}

/* ------------------------------------------------------------------ *
 * Bonus-colour demand: which colours actually matter right now
 * ------------------------------------------------------------------ */

/**
 * How much each gem colour is worth to this player, as a 0..1-ish weight.
 * Driven by what the visible market and the remaining patrons demand, and
 * damped by bonuses the player already owns (the 6th white is worth little).
 */
export function colorDemand(state: GameState, player: PlayerState): GemCount {
  const bonuses = playerBonuses(player)
  const demand: GemCount = { white: 0, blue: 0, green: 0, red: 0, black: 0 }

  for (const card of visibleCards(state)) {
    const gap = shortfall(player, card, bonuses)
    // Near-affordable cards drive demand hardest.
    const proximity = 1 / (1 + missingAfterGold(player, card))
    for (const color of GEM_COLORS) {
      if (gap[color] > 0) demand[color] += gap[color] * proximity
    }
  }

  for (const patronId of state.availablePatrons) {
    const req = getPatron(patronId).requirement
    for (const color of GEM_COLORS) {
      const still = Math.max(0, req[color] - bonuses[color])
      if (still > 0 && still <= 3) demand[color] += (4 - still) * 0.4
    }
  }

  // Normalise so weights stay comparable across game stages.
  const max = Math.max(1, ...GEM_COLORS.map((c) => demand[c]))
  for (const color of GEM_COLORS) demand[color] = demand[color] / max
  return demand
}

/**
 * Fraction of a patron's requirement the player has met, summed over the
 * patrons still on the table. Rewards concentrating bonuses.
 */
export function patronProgress(state: GameState, player: PlayerState): number {
  const bonuses = playerBonuses(player)
  let best = 0
  for (const patronId of state.availablePatrons) {
    const req = getPatron(patronId).requirement
    let required = 0
    let met = 0
    for (const color of GEM_COLORS) {
      required += req[color]
      met += Math.min(bonuses[color], req[color])
    }
    if (required === 0) continue
    // Square it: being 80% of the way to one patron beats 40% toward two.
    best = Math.max(best, (met / required) ** 2)
  }
  return best
}

/** Diminishing value of owning the Nth bonus of a colour. */
function bonusValue(count: number): number {
  let value = 0
  for (let i = 1; i <= count; i++) value += 1 / (1 + 0.35 * (i - 1))
  return value
}

/* ------------------------------------------------------------------ *
 * Positional evaluation
 * ------------------------------------------------------------------ */

export interface EvalWeights {
  prestige: number
  engine: number
  patronProgress: number
  tokens: number
  gold: number
  reserveQuality: number
  purchasePower: number
  endgameUrgency: number
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  prestige: 10,
  engine: 2.2,
  patronProgress: 4.5,
  tokens: 0.22,
  gold: 0.55,
  reserveQuality: 0.9,
  purchasePower: 1.4,
  endgameUrgency: 3.0,
}

/**
 * Absolute strength of one seat's position. Higher is better.
 * Deliberately dominated by prestige, because prestige is how you win; every
 * other term is a proxy for *future* prestige.
 */
export function evaluatePlayer(
  state: GameState,
  player: PlayerState,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  const bonuses = playerBonuses(player)
  const score = playerScore(player)

  let value = score * weights.prestige

  // Engine strength: permanent discounts, with diminishing returns per colour.
  let engine = 0
  for (const color of GEM_COLORS) engine += bonusValue(bonuses[color])
  value += engine * weights.engine

  value += patronProgress(state, player) * weights.patronProgress

  // Tokens are only worth what they can buy. Weight by colour demand and
  // penalise hoarding past the limit.
  const demand = colorDemand(state, player)
  let tokenValue = 0
  for (const color of GEM_COLORS) {
    tokenValue += player.tokens[color] * (0.35 + 0.65 * demand[color])
  }
  const held = TOKEN_COLORS.reduce((sum, c) => sum + player.tokens[c], 0)
  if (held > state.config.tokenLimit - 1) tokenValue -= (held - (state.config.tokenLimit - 1)) * 1.5
  value += tokenValue * weights.tokens
  value += player.tokens.gold * weights.gold

  // Purchasing power: how close the best market cards are.
  let power = 0
  for (const card of visibleCards(state)) {
    const turns = turnsToAfford(state, player, card)
    if (!Number.isFinite(turns)) continue
    power += (card.points + 0.8) / (1 + turns) ** 1.6
  }
  value += power * weights.purchasePower

  // Reserved cards are private options nobody can take away.
  for (const id of player.reserved) {
    const card = getCard(id)
    const turns = turnsToAfford(state, player, card)
    if (!Number.isFinite(turns)) continue
    value += ((card.points + 0.5) / (1 + turns)) * weights.reserveQuality
  }

  // The closer to the line, the more each point matters.
  const gap = prestigeGap(state, player)
  value += (1 / (1 + gap)) * weights.endgameUrgency

  return value
}

/**
 * Differential evaluation: my strength minus the strongest opponent's.
 * This is what Hard AI maximises - winning is relative, not absolute.
 */
export function evaluatePosition(
  state: GameState,
  playerId: string,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  const me = state.players.find((p) => p.id === playerId)
  if (!me) return 0
  const mine = evaluatePlayer(state, me, weights)
  let bestOpponent = 0
  for (const other of state.players) {
    if (other.id === playerId) continue
    bestOpponent = Math.max(bestOpponent, evaluatePlayer(state, other, weights))
  }
  // A finished game is worth an overwhelming amount either way.
  if (state.phase === 'finished') {
    return state.winnerIds.includes(playerId) ? mine + 1000 : mine - 1000
  }
  return mine - 0.85 * bestOpponent
}

/* ------------------------------------------------------------------ *
 * Per-action heuristic (Medium AI; Hard's candidate filter)
 * ------------------------------------------------------------------ */

/**
 * A fast, explainable score for one candidate action, WITHOUT simulating it.
 * Higher is better. Roughly calibrated so that "buy a 3-point card" beats
 * "take three useful gems" beats "take two gems" beats "reserve".
 */
export function scoreAction(state: GameState, player: PlayerState, action: GameAction): number {
  const demand = colorDemand(state, player)
  const bonuses = playerBonuses(player)
  const held = TOKEN_COLORS.reduce((sum, c) => sum + player.tokens[c], 0)
  const gap = prestigeGap(state, player)

  switch (action.type) {
    case 'PURCHASE': {
      const card = getCard(action.cardId)
      const plan = calculatePurchaseCost(player, card)
      if (!plan) return -1000
      let score = 14 + card.points * 9

      // A bonus in a colour we lack, and that the board wants, is real value.
      score += (1.6 - Math.min(1.2, bonuses[card.bonus] * 0.35)) * 5
      score += demand[card.bonus] * 4.5

      // Does this card complete or advance a patron?
      const after: PlayerState = { ...player, purchased: [...player.purchased, card.id] }
      const patronGain = patronProgress(state, after) - patronProgress(state, player)
      score += patronGain * 18
      for (const patronId of state.availablePatrons) {
        const req = getPatron(patronId).requirement
        const afterBonuses = playerBonuses(after)
        if (GEM_COLORS.every((c) => afterBonuses[c] >= req[c])) score += 24
      }

      // Spending gold is a real cost; so is dumping the whole hand.
      score -= plan.goldSpent * 1.8
      // Closing out the game is worth more than anything positional.
      if (card.points >= gap) score += 40
      return score
    }

    case 'RESERVE_VISIBLE': {
      const card = getCard(action.cardId)
      const turns = turnsToAfford(state, player, card)
      let score = 3 + card.points * 1.6
      if (Number.isFinite(turns)) score += 6 / (1 + turns)
      // Gold is the main practical reason to reserve.
      score += state.bank.gold > 0 ? 2.2 : -1.5
      // Denial: is this card a gift to a leading opponent?
      for (const other of state.players) {
        if (other.id === player.id) continue
        if (calculatePurchaseCost(other, card)) {
          score += 1.2 + card.points * 0.9
        }
      }
      if (held >= state.config.tokenLimit) score -= 3
      if (player.reserved.length >= 2) score -= 4
      return score
    }

    case 'RESERVE_DECK': {
      // Blind reserves are mostly a way to bank gold; slight tier preference.
      let score = 1.5 + action.tier * 0.4
      score += state.bank.gold > 0 ? 2 : -3
      if (player.reserved.length >= 2) score -= 4
      return score
    }

    case 'TAKE_TWO': {
      const color = action.color
      let score = 4 + demand[color] * 7
      // Only worth doubling down if we actually need two of them.
      const needTwo = visibleCards(state).some((card) => shortfall(player, card)[color] >= 2)
      score += needTwo ? 2.5 : -1.5
      if (held + 2 > state.config.tokenLimit) score -= (held + 2 - state.config.tokenLimit) * 3
      return score
    }

    case 'TAKE_THREE': {
      let score = 4.5
      for (const color of action.colors) score += demand[color] * 3.4
      score += (action.colors.length - 1) * 0.8
      if (held + action.colors.length > state.config.tokenLimit) {
        score -= (held + action.colors.length - state.config.tokenLimit) * 3
      }
      return score
    }

    default:
      return 0
  }
}

/* ------------------------------------------------------------------ *
 * Sub-decisions every difficulty needs
 * ------------------------------------------------------------------ */

/**
 * Which tokens to hand back when over the limit. Keeps gold, then keeps the
 * colours the board actually demands, discarding the least useful first.
 */
export function chooseDiscard(state: GameState, player: PlayerState, count: number): TokenPool {
  const demand = colorDemand(state, player)
  const pool: TokenPool = { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
  const remaining: Record<string, number> = { ...player.tokens }

  for (let i = 0; i < count; i++) {
    let worst: GemColor | 'gold' | null = null
    let worstValue = Infinity
    for (const color of GEM_COLORS) {
      if (remaining[color] <= 0) continue
      // Later copies of a colour are worth progressively less.
      const copies = remaining[color]
      const value = demand[color] * 10 + copies * 0.6
      if (value < worstValue) {
        worstValue = value
        worst = color
      }
    }
    // Gold is only ever discarded as a last resort.
    if (worst === null && remaining.gold > 0) worst = 'gold'
    if (worst === null) break
    remaining[worst] -= 1
    pool[worst] += 1
  }
  return pool
}

/** Which patron to take when several qualify at once. */
export function choosePatron(_state: GameState, player: PlayerState, options: string[]): string {
  // All patrons are worth the same prestige here, so prefer the one whose
  // requirements overlap least with what remains available - keeping the
  // easier-to-reach patrons on the table for a future turn.
  const bonuses = playerBonuses(player)
  let best = options[0]
  let bestScore = -Infinity
  for (const id of options) {
    const patron = getPatron(id)
    let slack = 0
    for (const color of GEM_COLORS) slack += Math.max(0, bonuses[color] - patron.requirement[color])
    const score = getPatron(id).points * 100 - slack
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

