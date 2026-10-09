import type { GameState } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { summariseGame } from '@/game/engine/scoring'
import { gemTheme } from '@/utils/colors'
import { Gem } from '@/components/Card/Gem'
import { DIFFICULTY_LABELS } from '@/store/settings'
import { useGameStore } from '@/store/gameStore'
import { Modal } from './Modal'

export function GameOverModal({ state }: { state: GameState }) {
  const startGame = useGameStore((s) => s.startGame)
  const backToSetup = useGameStore((s) => s.backToSetup)
  const settings = useGameStore((s) => s.settings)
  const seed = useGameStore((s) => s.seed)

  if (state.phase !== 'finished') return null
  const summary = summariseGame(state)
  const winners = summary.players.filter((p) => p.isWinner)
  const headline =
    winners.length === 1
      ? `${winners[0].name} wins`
      : `${winners.map((w) => w.name).join(' & ')} share the win`

  return (
    <Modal
      open
      title={headline}
      subtitle={`${DIFFICULTY_LABELS[settings.difficulty]} difficulty · ${summary.rounds} rounds · ${summary.turns} turns · seed ${seed}`}
      width="max-w-3xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-felt-600 text-left text-[0.65rem] uppercase tracking-[0.14em] text-muted">
              <th className="py-2 pr-3 font-medium">Player</th>
              <th className="py-2 pr-3 text-right font-medium">Prestige</th>
              <th className="py-2 pr-3 text-right font-medium">From cards</th>
              <th className="py-2 pr-3 text-right font-medium">From patrons</th>
              <th className="py-2 pr-3 text-right font-medium">Cards</th>
              <th className="py-2 pr-3 font-medium">Engine</th>
              <th className="py-2 font-medium">Patrons</th>
            </tr>
          </thead>
          <tbody>
            {summary.players.map((row) => (
              <tr
                key={row.playerId}
                className={`border-b border-felt-700 ${row.isWinner ? 'bg-brass-500/10' : ''}`}
              >
                <td className="py-2.5 pr-3">
                  <span className="font-display text-base text-parchment">{row.name}</span>
                  <span className="ml-2 text-[0.6rem] uppercase tracking-wider text-muted">
                    {row.difficulty
                      ? DIFFICULTY_LABELS[row.difficulty as keyof typeof DIFFICULTY_LABELS]
                      : 'Human'}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-display text-xl text-brass-400 tabular-nums">
                  {row.score}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-parchment/80">
                  {row.cardPoints}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-parchment/80">
                  {row.patronPoints}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-parchment/80">
                  {row.cardsPurchased}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex flex-wrap gap-1">
                    {GEM_COLORS.filter((c) => row.bonuses[c] > 0).map((color) => (
                      <span
                        key={color}
                        className="flex items-center gap-0.5 rounded px-1 text-[0.65rem] tabular-nums"
                        style={{ background: gemTheme(color).tint }}
                      >
                        <Gem color={color} size={10} />
                        {row.bonuses[color]}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="py-2.5 text-[0.7rem] text-parchment/70">
                  {row.patronsAcquired.length > 0 ? row.patronsAcquired.join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Ties are broken in favour of the player who needed fewer development cards.
      </p>

      <footer className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => startGame()}
          className="rounded-lg bg-brass-500 px-5 py-2 font-semibold text-felt-900 transition hover:bg-brass-400"
        >
          New game
        </button>
        <button
          type="button"
          onClick={backToSetup}
          className="rounded-lg border border-felt-500 px-5 py-2 font-semibold text-parchment transition hover:border-brass-500 hover:text-brass-400"
        >
          Change setup
        </button>
      </footer>
    </Modal>
  )
}
