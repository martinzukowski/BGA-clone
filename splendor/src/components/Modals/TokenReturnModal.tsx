import type { GameState } from '@/game/engine/types'
import { TOKEN_COLORS } from '@/game/engine/types'
import { totalTokens } from '@/game/engine/rules'
import { canDiscard, excessTokens } from '@/game/engine/validation'
import { gemLabel } from '@/utils/colors'
import { Token } from '@/components/Card/Gem'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'
import { Modal } from './Modal'

/**
 * Shown when the human ends a turn holding more than the token limit.
 * Not dismissable: the rules require the excess to go back before play moves on.
 */
export function TokenReturnModal({ state }: { state: GameState }) {
  const selection = useGameStore((s) => s.discardSelection)
  const toggle = useGameStore((s) => s.toggleDiscardToken)
  const confirm = useGameStore((s) => s.confirmDiscard)

  const player = state.players.find((p) => p.id === HUMAN_ID)
  const open =
    state.phase === 'discarding' && state.players[state.currentPlayerIndex]?.id === HUMAN_ID
  if (!player || !open) return null

  const needed = excessTokens(player)
  const chosen = totalTokens(selection)
  const validity = canDiscard(state, HUMAN_ID, selection)

  return (
    <Modal
      open
      title="Return tokens"
      subtitle={`You may only hold ${state.config.tokenLimit} tokens at the end of your turn. Return ${needed}.`}
      width="max-w-xl"
    >
      <div className="flex flex-wrap justify-center gap-5 py-2">
        {TOKEN_COLORS.map((color) => {
          const owned = player.tokens[color]
          if (owned === 0) return null
          const picked = selection[color]
          return (
            <div key={color} className="flex flex-col items-center gap-2">
              <Token
                color={color}
                count={owned - picked}
                selected={picked > 0}
                onClick={() => toggle(color)}
                disabled={owned === 0}
                title={`${gemLabel(color)} — click to return one`}
              />
              <span className="text-xs tabular-nums text-muted">
                returning <span className="text-brass-400">{picked}</span>
              </span>
            </div>
          )
        })}
      </div>

      <footer className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Selected {chosen} of {needed}
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={!validity.ok}
          title={!validity.ok ? validity.reason : undefined}
          className={`rounded-lg px-5 py-2 font-semibold transition ${
            validity.ok
              ? 'bg-brass-500 text-felt-900 hover:bg-brass-400'
              : 'cursor-not-allowed bg-felt-700 text-muted'
          }`}
        >
          Return {needed} token{needed === 1 ? '' : 's'}
        </button>
      </footer>
    </Modal>
  )
}
