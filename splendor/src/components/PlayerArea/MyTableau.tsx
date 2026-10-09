import type { ReactNode } from 'react'
import type { GameState } from '@/game/engine/types'
import { playerBonuses } from '@/game/engine/rules'
import { canPurchaseCard } from '@/game/engine/validation'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'
import { CARD_SIZE, CardTile } from '@/components/Card/CardTile'
import { PatronTile } from '@/components/NobleTile/PatronTile'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'

/** A framed panel with its title sitting on the top edge, like a tab. */
function Panel({
  title,
  badge,
  children,
  className = '',
}: {
  title: string
  badge?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={title}
      className={`relative rounded-xl border-2 border-brass-600/60 bg-felt-800/60 px-3 pb-3 pt-5 backdrop-blur ${className}`}
    >
      <span className="absolute -top-2.5 left-3 rounded-full border border-brass-600 bg-felt-900 px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brass-400">
        {title}
      </span>
      {badge && (
        <span className="absolute -top-2.5 right-3 rounded-full border border-brass-600 bg-felt-900 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-brass-400">
          {badge}
        </span>
      )}
      {children}
    </section>
  )
}

/**
 * Your reserved cards, always on the table. Buy one by hovering it, exactly as
 * you would a market card. Empty slots are drawn so the 3-card limit is visible
 * before you hit it.
 */
export function MyReserved({
  state,
  interactive,
  flashCardIds,
}: {
  state: GameState
  interactive: boolean
  flashCardIds: string[]
}) {
  const purchase = useGameStore((s) => s.purchase)
  const setHoveredCard = useGameStore((s) => s.setHoveredCard)
  const player = state.players.find((p) => p.id === HUMAN_ID)
  if (!player) return null

  const empties = Math.max(0, state.config.reserveLimit - player.reserved.length)

  return (
    <Panel
      title="My Reserved Cards"
      badge={`${player.reserved.length}/${state.config.reserveLimit}`}
    >
      <div className="flex gap-2">
        {player.reserved.map((id) => (
          <CardTile
            key={id}
            card={getCard(id)}
            player={player}
            onHoverChange={setHoveredCard}
            flash={flashCardIds.includes(id)}
            purchase={interactive ? canPurchaseCard(state, HUMAN_ID, id) : null}
            onPurchase={interactive ? () => purchase(id) : undefined}
            className="anim-rise"
          />
        ))}
        {Array.from({ length: empties }, (_, i) => (
          <div
            key={`empty-${i}`}
            className={`${CARD_SIZE} shrink-0 rounded-lg border-2 border-dashed border-felt-600/70`}
            aria-hidden="true"
          />
        ))}
      </div>
    </Panel>
  )
}

/** Patrons who have visited you, each worth its prestige. */
export function MyPatrons({ state }: { state: GameState }) {
  const player = state.players.find((p) => p.id === HUMAN_ID)
  if (!player) return null
  const bonuses = playerBonuses(player)

  return (
    <Panel title="My Patrons" className="min-w-0 flex-1">
      {player.patrons.length === 0 ? (
        <p className="flex h-full min-h-[5.75rem] items-center justify-center px-4 text-center text-xs text-muted">
          A patron visits at the end of your turn once your card bonuses meet their
          requirement.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {player.patrons.map((id) => (
            <PatronTile key={id} patron={getPatron(id)} bonuses={bonuses} />
          ))}
        </div>
      )}
    </Panel>
  )
}
