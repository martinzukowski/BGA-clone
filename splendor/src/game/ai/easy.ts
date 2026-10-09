/**
 * Easy bot.
 *
 * Understands legality perfectly (it only ever chooses from
 * `legalMainActions`) but has essentially no plan. It picks at random from a
 * lightly weighted pool, which means it will buy a card when one happens to be
 * affordable reasonably often, hoards tokens it does not need, and rarely
 * reserves. Beatable by a first-time player.
 */
import type { GameAction, GameState } from '@/game/engine/types'
import { legalMainActions } from '@/game/engine/actions'
import type { RngStream } from '@/utils/rng'

const WEIGHTS: Record<GameAction['type'], number> = {
  PURCHASE: 6,
  TAKE_THREE: 5,
  TAKE_TWO: 3,
  RESERVE_VISIBLE: 1,
  RESERVE_DECK: 0.4,
  DISCARD: 0,
  CHOOSE_PATRON: 0,
}

export function chooseEasyAction(
  state: GameState,
  playerId: string,
  rng: RngStream,
): GameAction | null {
  const actions = legalMainActions(state, playerId)
  if (actions.length === 0) return null

  const total = actions.reduce((sum, a) => sum + (WEIGHTS[a.type] ?? 1), 0)
  let roll = rng.float() * total
  for (const action of actions) {
    roll -= WEIGHTS[action.type] ?? 1
    if (roll <= 0) return action
  }
  return actions[actions.length - 1]
}
