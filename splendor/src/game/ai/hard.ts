/**
 * Hard bot: heuristic candidate filtering + determinized Monte-Carlo rollouts.
 *
 * Algorithm
 * ---------
 *  1. Determinize: reconstruct a plausible full state from what this seat is
 *     legally allowed to know (see determinize.ts). Unknown decks are filled
 *     from the bot's OWN rng, so it gains no knowledge of the real draw order.
 *  2. Score every legal action with the fast heuristic and keep the best K.
 *     (The branching factor is ~25-40; evaluating all of them by rollout would
 *     be wasteful, and the heuristic is good enough as a filter.)
 *  3. For each candidate, apply it for real through the engine, then play the
 *     position out for a few rounds with a fast greedy policy for every seat.
 *  4. Score the leaf with the DIFFERENTIAL evaluation - my strength minus the
 *     best opponent's - and average across rollouts and determinizations.
 *  5. Blend the rollout average with the immediate positional evaluation, which
 *     stabilises the estimate when the rollout count is small.
 *
 * Honesty guarantees, enforced structurally rather than by convention:
 *   - it only ever receives a VisibleGameState,
 *   - it only ever emits actions drawn from `legalMainActions`,
 *   - simulations use a throwaway rng, never the game's stream,
 *   - it never reads `market[t].deck` or another player's `reservedHidden`.
 */
import type { GameAction, GameState, PlayerState, VisibleGameState } from '@/game/engine/types'
import { applyAction, legalMainActions } from '@/game/engine/actions'
import { calculatePurchaseCost } from '@/game/engine/validation'
import { getCard } from '@/game/data/cards'
import { colorDemand, evaluatePosition, scoreAction, turnsToAfford } from './evaluation'
import { autoResolvePending } from './resolve'
import { determinize } from './determinize'
import type { RngStream } from '@/utils/rng'

export interface HardConfig {
  /** How many top-heuristic actions get simulated. */
  candidates: number
  /** Independent determinizations x rollouts per candidate. */
  rollouts: number
  /** Rounds of play simulated in each rollout. */
  depthRounds: number
  /** 0 = trust rollouts only, 1 = trust the static evaluation only. */
  staticBlend: number
}

export const DEFAULT_HARD_CONFIG: HardConfig = {
  candidates: 7,
  rollouts: 4,
  depthRounds: 3,
  staticBlend: 0.45,
}

/**
 * Cheap policy used inside rollouts. Full `scoreAction` on every legal move at
 * every ply would be far too slow, so this makes the same *kind* of decision
 * with one demand computation per ply:
 *   - buy the best available card if any purchase looks worthwhile,
 *   - otherwise take the gems the position most wants.
 */
function rolloutPolicy(state: GameState, player: PlayerState, rng: RngStream): GameAction | null {
  const actions = legalMainActions(state, player.id)
  if (actions.length === 0) return null

  const demand = colorDemand(state, player)

  let best: GameAction | null = null
  let bestScore = -Infinity
  for (const action of actions) {
    let score: number
    switch (action.type) {
      case 'PURCHASE': {
        const card = getCard(action.cardId)
        const plan = calculatePurchaseCost(player, card)
        score = 12 + card.points * 7 + demand[card.bonus] * 3 - (plan?.goldSpent ?? 0) * 1.5
        break
      }
      case 'TAKE_THREE': {
        score = 4 + action.colors.reduce((sum, c) => sum + demand[c] * 3, 0)
        break
      }
      case 'TAKE_TWO': {
        score = 3.5 + demand[action.color] * 5
        break
      }
      case 'RESERVE_VISIBLE': {
        const card = getCard(action.cardId)
        const turns = turnsToAfford(state, player, card)
        score = 1 + card.points * 1.2 + (Number.isFinite(turns) ? 4 / (1 + turns) : 0)
        break
      }
      default:
        score = 0.5
    }
    score += (rng.float() - 0.5) * 1.2
    if (score > bestScore) {
      bestScore = score
      best = action
    }
  }
  return best
}

/** Plays `plies` further half-turns from `state` using the rollout policy. */
function rollout(state: GameState, plies: number, rng: RngStream): GameState {
  let current = autoResolvePending(state)
  for (let i = 0; i < plies; i++) {
    if (current.phase === 'finished') break
    const player = current.players[current.currentPlayerIndex]
    const action = rolloutPolicy(current, player, rng)
    if (!action) break
    const result = applyAction(current, player.id, action)
    if (!result.ok) break
    current = autoResolvePending(result.state)
  }
  return current
}

/**
 * Immediate-win shortcut: if some purchase both ends the game and leaves us in
 * front, take it without burning rollouts on the question.
 */
function findWinningPurchase(state: GameState, playerId: string): GameAction | null {
  for (const action of legalMainActions(state, playerId)) {
    if (action.type !== 'PURCHASE') continue
    const result = applyAction(state, playerId, action)
    if (!result.ok) continue
    const after = autoResolvePending(result.state)
    if (after.phase === 'finished' && after.winnerIds.length === 1 && after.winnerIds[0] === playerId) {
      return action
    }
  }
  return null
}

export function chooseHardAction(
  view: VisibleGameState,
  playerId: string,
  rng: RngStream,
  config: HardConfig = DEFAULT_HARD_CONFIG,
): GameAction | null {
  // One determinization drives candidate generation, so the action objects we
  // return are guaranteed legal in the REAL state too: every action considered
  // depends only on public information (bank, market, own tokens/reserve).
  const base = determinize(view, rng)
  const me = base.players.find((p) => p.id === playerId)
  if (!me) return null

  const actions = legalMainActions(base, playerId)
  if (actions.length === 0) return null
  if (actions.length === 1) return actions[0]

  const winning = findWinningPurchase(base, playerId)
  if (winning) return winning

  const ranked = actions
    .map((action) => ({ action, heuristic: scoreAction(base, me, action) }))
    .sort((a, b) => b.heuristic - a.heuristic)
    .slice(0, Math.max(2, config.candidates))

  const plies = config.depthRounds * base.players.length

  let bestAction = ranked[0].action
  let bestValue = -Infinity

  for (const candidate of ranked) {
    let total = 0
    let samples = 0

    for (let r = 0; r < config.rollouts; r++) {
      // A fresh determinization per rollout: this is what averages away the
      // bot's uncertainty about the deck instead of committing to one guess.
      const world = r === 0 ? base : determinize(view, rng)
      const applied = applyAction(world, playerId, candidate.action)
      if (!applied.ok) continue
      const settled = autoResolvePending(applied.state)

      const immediate = evaluatePosition(settled, playerId)
      const leaf = rollout(settled, plies, rng)
      const projected = evaluatePosition(leaf, playerId)

      total += config.staticBlend * immediate + (1 - config.staticBlend) * projected
      samples += 1
    }

    if (samples === 0) continue
    const value = total / samples
    if (value > bestValue) {
      bestValue = value
      bestAction = candidate.action
    }
  }

  return bestAction
}

