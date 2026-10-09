import type { GameState } from '@/game/engine/types'
import { TIERS } from '@/game/engine/rules'
import { checkInvariants } from '@/game/engine/gameState'
import { useGameStore } from '@/store/gameStore'

/**
 * Development-only inspector.
 *
 * Deliberately shows deck *sizes* and never deck contents: exposing the order
 * of undealt cards through the UI would hand the human information the bots
 * are explicitly denied.
 */
export function DebugPanel({ state }: { state: GameState }) {
  const show = useGameStore((s) => s.showDebug)
  const seed = useGameStore((s) => s.seed)
  const toggleDebug = useGameStore((s) => s.toggleDebug)
  if (!import.meta.env.DEV || !show) return null

  const violations = checkInvariants(state)
  const lastAction = state.log[state.log.length - 1]

  return (
    <aside className="fixed bottom-3 right-3 z-40 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-felt-500 bg-felt-900/95 p-3 text-[0.7rem] leading-relaxed shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xs uppercase tracking-[0.2em] text-brass-400">Debug</h2>
        <button
          type="button"
          onClick={toggleDebug}
          className="text-muted transition hover:text-brass-400"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      <Row label="Seed" value={String(seed)} />
      <Row label="RNG cursor" value={String(state.rng.cursor)} />
      <Row label="Round / turn" value={`${state.round} / ${state.turnCount}`} />
      <Row label="Phase" value={state.phase} />
      <Row
        label="Current"
        value={`${state.players[state.currentPlayerIndex]?.name} (#${state.currentPlayerIndex})`}
      />
      <Row
        label="End triggered by"
        value={state.endTriggeredByIndex === null ? '—' : String(state.endTriggeredByIndex)}
      />
      <Row
        label="Decks"
        value={TIERS.map((t) => `T${t}:${state.market[t].deck.length}`).join('  ')}
      />
      <Row label="Patrons left" value={String(state.availablePatrons.length)} />
      <Row label="Last action" value={lastAction?.text ?? '—'} />

      <h3 className="mt-3 font-semibold text-parchment/80">Invariants</h3>
      {violations.length === 0 ? (
        <p className="text-[#8fd4b4]">All conservation checks pass.</p>
      ) : (
        <ul className="list-disc pl-4 text-gem-red">
          {violations.map((v, i) => (
            <li key={i}>
              {v.rule}: {v.detail}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 font-semibold text-parchment/80">Players</h3>
      <pre className="mt-1 whitespace-pre-wrap break-all text-[0.62rem] text-muted">
        {JSON.stringify(
          state.players.map((p) => ({
            id: p.id,
            name: p.name,
            difficulty: p.difficulty,
            tokens: p.tokens,
            cards: p.purchased.length,
            reserved: p.reserved.length,
            patrons: p.patrons.length,
          })),
          null,
          1,
        )}
      </pre>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-right text-parchment/85">{value}</span>
    </p>
  )
}
