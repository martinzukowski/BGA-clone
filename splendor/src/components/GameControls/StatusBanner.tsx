import type { GameState, Validity } from '@/game/engine/types'
import { canTakeThree, canTakeTwoSame } from '@/game/engine/validation'
import { gemLabel } from '@/utils/colors'
import { Gem } from '@/components/Card/Gem'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'

/**
 * The turn banner under the top bar: whose move it is, and - on your turn -
 * the gems you have picked with Confirm / Cancel.
 *
 * Confirm is enabled straight from the engine's validators, and its tooltip is
 * the engine's own reason when it is not, so the banner never second-guesses a
 * rule (for example "you must take 3 different gems when the bank can supply
 * them").
 */
export function StatusBanner({ state }: { state: GameState }) {
  const bot = useGameStore((s) => s.bot)
  const selection = useGameStore((s) => s.gemSelection)
  const unpickGem = useGameStore((s) => s.unpickGem)
  const clearSelection = useGameStore((s) => s.clearGemSelection)
  const confirm = useGameStore((s) => s.confirmGemSelection)

  const current = state.players[state.currentPlayerIndex]
  const yourTurn = current?.id === HUMAN_ID
  const finalRound = state.phase === 'final-round'

  let content: React.ReactNode

  if (state.phase === 'finished') {
    content = <span className="text-brass-400">Game over</span>
  } else if (yourTurn && state.phase === 'discarding') {
    content = <Lead>You hold too many tokens — return the excess</Lead>
  } else if (yourTurn && state.phase === 'choosing-patron') {
    content = <Lead>Two patrons want to visit — choose one</Lead>
  } else if (yourTurn && selection.length > 0) {
    const isPair = selection.length === 2 && selection[0] === selection[1]
    const check: Validity = isPair
      ? canTakeTwoSame(state, HUMAN_ID, selection[0])
      : canTakeThree(state, HUMAN_ID, selection)
    content = (
      <>
        <span className="text-parchment/85">Take</span>
        <span className="flex items-center gap-1">
          {selection.map((color, index) => (
            <button
              key={`${color}-${index}`}
              type="button"
              onClick={() => unpickGem(index)}
              className="flex items-center gap-1 rounded-full border border-felt-500 bg-felt-800 px-2 py-0.5 text-xs text-parchment transition hover:border-gem-red/70 hover:text-gem-red"
              title={`Put this ${gemLabel(color)} back`}
            >
              <Gem color={color} size={12} />
              {gemLabel(color)}
              <span aria-hidden="true" className="text-muted">
                ✕
              </span>
            </button>
          ))}
        </span>
        <button
          type="button"
          onClick={confirm}
          disabled={!check.ok}
          title={check.ok ? undefined : check.reason}
          className={`rounded-lg px-4 py-1 text-sm font-semibold transition ${
            check.ok
              ? 'bg-brass-500 text-felt-900 hover:bg-brass-400'
              : 'cursor-not-allowed bg-felt-700 text-muted'
          }`}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-lg border border-felt-500 px-3 py-1 text-sm text-parchment/85 transition hover:border-brass-500 hover:text-brass-400"
        >
          Cancel
        </button>
        {!check.ok && <span className="text-xs text-muted">{check.reason}</span>}
      </>
    )
  } else if (yourTurn) {
    content = (
      <>
        <Lead>Your turn</Lead>
        <span className="text-xs text-parchment/70">
          Pick gems from the bank (click one twice to take two), or hover a card to buy or reserve
          it.
        </span>
      </>
    )
  } else if (current && bot.thinkingPlayerId === current.id) {
    content = <span className="italic text-brass-400">{current.name} is thinking…</span>
  } else {
    content = (
      <span className="text-parchment/75">
        {bot.lastMessage ?? `Waiting for ${current?.name ?? 'the next player'}…`}
      </span>
    )
  }

  return (
    <div
      className={`border-b backdrop-blur ${
        yourTurn && state.phase !== 'finished'
          ? 'border-brass-500/60 bg-brass-500/10'
          : 'border-felt-600 bg-felt-900/85'
      }`}
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-11 max-w-[100rem] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-sm">
        {content}
        {finalRound && (
          <span className="rounded-full border border-brass-500/70 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-brass-400">
            Final round
          </span>
        )}
      </div>
    </div>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-base text-brass-400">{children}</span>
}
