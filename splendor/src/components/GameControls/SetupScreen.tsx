import { useState } from 'react'
import type { Difficulty } from '@/game/engine/types'
import { BOT_NAMES } from '@/game/engine/setup'
import { Gem } from '@/components/Card/Gem'
import { DIFFICULTY_BLURBS, DIFFICULTY_LABELS } from '@/store/settings'
import { useGameStore } from '@/store/gameStore'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function SetupScreen() {
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const startGame = useGameStore((s) => s.startGame)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const discardSave = useGameStore((s) => s.discardSave)
  const resumable = useGameStore((s) => s.resumable)
  const toggleRules = useGameStore((s) => s.toggleRules)

  const [name, setName] = useState(settings.playerName)

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <header className="text-center">
        <div className="mb-4 flex justify-center gap-2">
          <Gem color="white" size={22} />
          <Gem color="blue" size={30} />
          <Gem color="green" size={38} />
          <Gem color="red" size={30} />
          <Gem color="black" size={22} />
        </div>
        <h1 className="font-display text-5xl tracking-wide text-brass-400">Gemwright</h1>
        <p className="mt-2 text-sm text-muted">
          Trade gems, build a workshop engine, and court the patrons of the guild.
        </p>
      </header>

      {resumable && (
        <section className="anim-rise rounded-2xl border border-brass-600/70 bg-brass-500/10 p-4">
          <h2 className="font-display text-lg text-brass-400">Game in progress</h2>
          <p className="mt-1 text-sm text-parchment/80">
            A saved game was found on this device. Pick up where you left off?
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resumeGame}
              className="rounded-lg bg-brass-500 px-5 py-2 font-semibold text-felt-900 transition hover:bg-brass-400"
            >
              Continue game
            </button>
            <button
              type="button"
              onClick={discardSave}
              className="rounded-lg border border-felt-500 px-5 py-2 text-parchment transition hover:border-brass-500 hover:text-brass-400"
            >
              Discard it
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-felt-600 bg-felt-800/70 p-6 backdrop-blur">
        <h2 className="mb-5 font-display text-sm uppercase tracking-[0.3em] text-brass-400">
          New game
        </h2>

        <Field label="Your name">
          <input
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateSettings({ playerName: name.trim() || 'You' })}
            className="w-56 rounded-lg border border-felt-500 bg-felt-900/70 px-3 py-2 text-sm text-parchment outline-none transition focus:border-brass-500"
            placeholder="You"
          />
        </Field>

        <Field label="Opponents">
          <div className="flex gap-2">
            {[1, 2, 3].map((count) => (
              <Choice
                key={count}
                active={settings.opponents === count}
                onClick={() => updateSettings({ opponents: count })}
              >
                {count}
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {BOT_NAMES.slice(0, settings.opponents).join(', ')}
          </p>
        </Field>

        <Field label="Difficulty">
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((difficulty) => (
              <Choice
                key={difficulty}
                active={settings.difficulty === difficulty}
                onClick={() => updateSettings({ difficulty })}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{DIFFICULTY_BLURBS[settings.difficulty]}</p>
        </Field>

        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-parchment/85">
          <input
            type="checkbox"
            checked={settings.fastAi}
            onChange={(e) => updateSettings({ fastAi: e.target.checked })}
            className="h-4 w-4 accent-[#c39445]"
          />
          Fast AI turns
          <span className="text-xs text-muted">(skip the deliberation pause)</span>
        </label>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => startGame({ playerName: name.trim() || 'You' })}
            className="rounded-lg bg-brass-500 px-7 py-2.5 font-semibold text-felt-900 transition hover:bg-brass-400"
          >
            Start game
          </button>
          <button
            type="button"
            onClick={() => toggleRules(true)}
            className="rounded-lg border border-felt-500 px-5 py-2.5 text-parchment transition hover:border-brass-500 hover:text-brass-400"
          >
            How to play
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-muted">
        Add <code className="rounded bg-felt-700 px-1">?seed=12345</code> to the URL to replay an
        exact shuffle.
      </p>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      {children}
    </div>
  )
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-16 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-brass-500 bg-brass-500/20 text-brass-400'
          : 'border-felt-500 text-parchment/80 hover:border-brass-600 hover:text-parchment'
      }`}
    >
      {children}
    </button>
  )
}
