import type { GameState } from '@/game/engine/types'
import { DIFFICULTY_LABELS } from '@/store/settings'
import { useGameStore } from '@/store/gameStore'

export function TopBar({ state }: { state: GameState }) {
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const backToSetup = useGameStore((s) => s.backToSetup)
  const toggleRules = useGameStore((s) => s.toggleRules)
  const toggleDebug = useGameStore((s) => s.toggleDebug)
  const showDebug = useGameStore((s) => s.showDebug)

  return (
    <header className="border-b border-felt-600 bg-felt-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <h1 className="font-display text-xl tracking-wide text-brass-400">Gemwright</h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
          <Stat label="Round" value={String(state.round)} />
          <Stat label="Turn" value={String(state.turnCount + 1)} />
          <Stat label="Bots" value={DIFFICULTY_LABELS[settings.difficulty]} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={settings.fastAi}
              onChange={(e) => updateSettings({ fastAi: e.target.checked })}
              className="h-3.5 w-3.5 accent-[#c39445]"
            />
            Fast AI
          </label>
          {import.meta.env.DEV && (
            <BarButton onClick={toggleDebug} active={showDebug}>
              Debug
            </BarButton>
          )}
          <BarButton onClick={() => toggleRules(true)}>Rules</BarButton>
          <BarButton onClick={backToSetup}>New game</BarButton>
        </div>
      </div>

    </header>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[0.6rem] uppercase tracking-[0.16em]">{label}</span>
      <span className={`text-sm ${accent ? 'text-brass-400' : 'text-parchment/90'}`}>{value}</span>
    </span>
  )
}

function BarButton({
  onClick,
  active = false,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
        active
          ? 'border-brass-500 bg-brass-500/20 text-brass-400'
          : 'border-felt-500 text-parchment/85 hover:border-brass-500 hover:text-brass-400'
      }`}
    >
      {children}
    </button>
  )
}
