/**
 * The AI boundary.
 *
 * The ONLY thing a bot may receive is a `VisibleGameState` (what a server would
 * send that seat) and the ONLY thing it may emit is a `GameAction` (what a
 * client would send back). That is exactly the contract an online opponent
 * would have, so bots and remote humans are interchangeable later.
 */
import type {
  Difficulty,
  GameAction,
  GameState,
  VisibleGameState,
} from '@/game/engine/types'
import { applyAction } from '@/game/engine/actions'
import { redactFor } from '@/game/engine/gameState'
import { RngStream } from '@/utils/rng'
import { determinize } from './determinize'
import { chooseEasyAction } from './easy'
import { chooseMediumAction } from './medium'
import { chooseHardAction, DEFAULT_HARD_CONFIG, type HardConfig } from './hard'
import { autoResolvePending } from './resolve'

export interface BotOptions {
  hard?: Partial<HardConfig>
}

/**
 * The single entry point named in the spec.
 * Returns null only when the seat has no legal main action at all (which the
 * rules make impossible in practice - taking gems is always available while
 * the bank has any, and reserving is available otherwise).
 */
export function chooseAction(
  view: VisibleGameState,
  playerId: string,
  difficulty: Difficulty,
  rng: RngStream,
  options: BotOptions = {},
): GameAction | null {
  switch (difficulty) {
    case 'hard':
      return chooseHardAction(view, playerId, rng, { ...DEFAULT_HARD_CONFIG, ...options.hard })
    case 'medium':
      // Easy and Medium reason only from public information, so a single
      // determinization is all the "full state" shape they need.
      return chooseMediumAction(determinize(view, rng), playerId, rng)
    case 'easy':
    default:
      return chooseEasyAction(determinize(view, rng), playerId, rng)
  }
}

/** A stateful bot handle, so per-seat difficulty and rng live in one object. */
export interface BotPlayer {
  playerId: string
  difficulty: Difficulty
  chooseAction(view: VisibleGameState): GameAction | null
}

export function createBot(
  playerId: string,
  difficulty: Difficulty,
  seed: number,
  options: BotOptions = {},
): BotPlayer {
  const rng = new RngStream(seed)
  return {
    playerId,
    difficulty,
    chooseAction: (view) => chooseAction(view, playerId, difficulty, rng, options),
  }
}

export interface BotTurnResult {
  state: GameState
  action: GameAction | null
  /** Set when the engine rejected the bot's action - always an AI bug. */
  error?: string
}

/**
 * Plays one complete bot turn against the authoritative state: redact -> decide
 * -> apply -> resolve token limit and patron choice.
 *
 * The redaction step is not decoration. It is the reason a bot cannot cheat:
 * the full state never reaches AI code.
 */
export function runBotTurn(
  state: GameState,
  playerId: string,
  rng: RngStream,
  options: BotOptions = {},
): BotTurnResult {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || !player.difficulty) {
    return { state, action: null, error: 'Not a bot seat.' }
  }
  const view = redactFor(state, playerId)
  const action = chooseAction(view, playerId, player.difficulty, rng, options)
  if (!action) return { state: autoResolvePending(state), action: null }

  const result = applyAction(state, playerId, action)
  if (!result.ok) {
    return { state, action, error: result.reason }
  }
  return { state: autoResolvePending(result.state), action }
}

export { autoResolvePending }
export { chooseDiscard, choosePatron } from './evaluation'
export type { HardConfig }
