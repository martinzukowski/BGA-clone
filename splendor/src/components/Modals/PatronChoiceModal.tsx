import type { GameState } from '@/game/engine/types'
import { playerBonuses, qualifyingPatrons } from '@/game/engine/rules'
import { getPatron } from '@/game/data/nobles'
import { PatronTile } from '@/components/NobleTile/PatronTile'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'
import { Modal } from './Modal'

/**
 * Shown when two or more patrons qualify at the end of the same turn.
 * Only one may ever be taken per turn, so this is a required choice.
 */
export function PatronChoiceModal({ state }: { state: GameState }) {
  const selectPatron = useGameStore((s) => s.selectPatron)
  const player = state.players.find((p) => p.id === HUMAN_ID)
  const open =
    state.phase === 'choosing-patron' && state.players[state.currentPlayerIndex]?.id === HUMAN_ID
  if (!player || !open) return null

  const options = qualifyingPatrons(state, player)
  const bonuses = playerBonuses(player)

  return (
    <Modal
      open
      title="Two patrons are interested"
      subtitle="You may attract only one patron per turn. Choose which visits you."
      width="max-w-lg"
    >
      <div className="flex flex-wrap justify-center gap-4 py-2">
        {options.map((id) => (
          <PatronTile
            key={id}
            patron={getPatron(id)}
            bonuses={bonuses}
            selectable
            onClick={() => selectPatron(id)}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        The others stay on the table and can still be attracted on a later turn.
      </p>
    </Modal>
  )
}
