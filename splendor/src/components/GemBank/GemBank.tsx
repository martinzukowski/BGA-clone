import type { MouseEvent } from 'react'
import type { GameState, GemColor } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { TAKE_TWO_MIN_BANK } from '@/game/engine/rules'
import { gemLabel } from '@/utils/colors'
import { Token } from '@/components/Card/Gem'
import { launchGemFlight } from '@/utils/gemFlight'
import { useGameStore } from '@/store/gameStore'

interface BankColumnProps {
  state: GameState
  /** False while a bot is acting or the human owes a sub-decision. */
  interactive: boolean
}

/**
 * The shared token supply, as a column of chips between the market and the
 * patrons.
 *
 * Click a chip to pick that gem; click the same chip again (with nothing else
 * picked) to take two of it. Picks are confirmed or cancelled from the turn
 * banner at the top. Gold is shown but never picked - it only arrives with a
 * reservation.
 */
export function BankColumn({ state, interactive }: BankColumnProps) {
  const selection = useGameStore((s) => s.gemSelection)
  const pickGem = useGameStore((s) => s.pickGem)

  // One chip per gold token left (at least one, ghosted, when the supply is dry).
  const goldLayers = Math.max(1, Math.min(state.bank.gold, 5))

  /** Animate a gem only when the pick actually lands. */
  const pick = (color: GemColor, event: MouseEvent<HTMLElement>) => {
    const origin = event.currentTarget
    if (pickGem(color)) launchGemFlight(color, origin)
  }

  return (
    <section
      aria-label="Gem bank"
      className="flex flex-row flex-wrap items-center justify-center gap-3 xl:flex-col xl:flex-nowrap"
    >
      {GEM_COLORS.map((color) => {
        const count = state.bank[color]
        const picked = selection.filter((c) => c === color).length
        return (
          <div key={color} className="relative">
            <Token
              color={color}
              count={count}
              size={54}
              selected={picked > 0}
              disabled={!interactive || count === 0}
              onClick={interactive ? (event) => pick(color, event) : undefined}
              title={
                `${gemLabel(color)}: ${count} in the bank.` +
                (interactive
                  ? count >= TAKE_TWO_MIN_BANK
                    ? ' Click to pick; click again to take two.'
                    : ' Click to pick.'
                  : '')
              }
            />
            {picked > 0 && (
              <span className="anim-pop absolute -left-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brass-500 px-1 text-[0.65rem] font-bold text-felt-900">
                +{picked}
              </span>
            )}
          </div>
        )
      })}

      {/* Gold: a stack, because it is a different kind of token. */}
      <div
        className="relative mt-1 grid place-items-center"
        title={
          state.bank.gold > 0
            ? `${state.bank.gold} Gold left. You receive one when you reserve a card.`
            : 'No Gold left. Reserving still works, but pays no wild until someone spends one.'
        }
      >
        <div className="relative w-[3.4rem]" style={{ height: 54 + (goldLayers - 1) * 5 }}>
          {Array.from({ length: goldLayers }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{ bottom: i * 5, opacity: state.bank.gold === 0 ? 0.3 : 1 }}
            >
              <Token color="gold" size={54} />
            </div>
          ))}
          <span
            className={`absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border px-1 text-xs font-semibold tabular-nums ${
              state.bank.gold === 0
                ? 'border-gem-red/70 bg-felt-800 text-gem-red'
                : 'border-felt-500 bg-felt-800 text-parchment'
            }`}
          >
            {state.bank.gold}
          </span>
        </div>
      </div>
    </section>
  )
}
