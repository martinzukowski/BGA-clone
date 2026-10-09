/**
 * Medium bot.
 *
 * Pure one-ply heuristics: it scores every legal action with `scoreAction` and
 * then picks from the top few with some randomness, so it plays sensibly but
 * predictably. It notices affordable cards, useful bonus colours, patron
 * progress and the token limit, but it never looks ahead, so it can be
 * out-tempoed and it under-values denial. Competent but exploitable.
 */
import type { GameAction, GameState } from '@/game/engine/types'
import { legalMainActions } from '@/game/engine/actions'
import { scoreAction } from './evaluation'
import type { RngStream } from '@/utils/rng'

/** Probability mass over the ranked candidates. */
const TOP_PICK_WEIGHTS = [0.62, 0.26, 0.12]

export function chooseMediumAction(
  state: GameState,
  playerId: string,
  rng: RngStream,
): GameAction | null {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return null
  const actions = legalMainActions(state, playerId)
  if (actions.length === 0) return null

  const scored = actions
    .map((action) => ({
      action,
      // A little noise keeps repeat games from playing out identically.
      score: scoreAction(state, player, action) + (rng.float() - 0.5) * 1.5,
    }))
    .sort((a, b) => b.score - a.score)

  const candidates = scored.slice(0, TOP_PICK_WEIGHTS.length)
  const total = candidates.reduce((sum, _, i) => sum + TOP_PICK_WEIGHTS[i], 0)
  let roll = rng.float() * total
  for (let i = 0; i < candidates.length; i++) {
    roll -= TOP_PICK_WEIGHTS[i]
    if (roll <= 0) return candidates[i].action
  }
  return candidates[0].action
}
