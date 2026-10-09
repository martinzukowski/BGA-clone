/**
 * Bot handling for the two sub-decisions that interrupt a turn: returning
 * tokens over the limit, and picking between simultaneously-qualifying patrons.
 *
 * These go through `applyAction` like everything else, so a bot cannot skip
 * the token limit or take two patrons in a turn even by accident.
 */
import type { GameState } from '@/game/engine/types'
import { applyAction } from '@/game/engine/actions'
import { qualifyingPatrons } from '@/game/engine/rules'
import { excessTokens } from '@/game/engine/validation'
import { chooseDiscard, choosePatron } from './evaluation'

/**
 * Drives the current seat through any pending 'discarding' / 'choosing-patron'
 * phase until a main action is due again (or the game ends). Safe to call on a
 * state that has nothing pending.
 */
export function autoResolvePending(state: GameState): GameState {
  let current = state
  // Bounded: each iteration strictly consumes one pending phase.
  for (let guard = 0; guard < 8; guard++) {
    const player = current.players[current.currentPlayerIndex]
    if (!player) break

    if (current.phase === 'discarding') {
      const tokens = chooseDiscard(current, player, excessTokens(player))
      const result = applyAction(current, player.id, { type: 'DISCARD', tokens })
      if (!result.ok) break
      current = result.state
      continue
    }

    if (current.phase === 'choosing-patron') {
      const options = qualifyingPatrons(current, player)
      if (options.length === 0) break
      const patronId = choosePatron(current, player, options)
      const result = applyAction(current, player.id, { type: 'CHOOSE_PATRON', patronId })
      if (!result.ok) break
      current = result.state
      continue
    }

    break
  }
  return current
}
