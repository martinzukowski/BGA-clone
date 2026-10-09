import { useEffect, useRef } from 'react'
import type { GameState, LogEntry } from '@/game/engine/types'

const KIND_COLOR: Record<LogEntry['kind'], string> = {
  take: 'text-parchment/75',
  reserve: 'text-[#9fb6d8]',
  purchase: 'text-brass-400',
  discard: 'text-muted',
  patron: 'text-[#d7a8e6]',
  system: 'text-[#8fd4b4]',
}

export function ActionLog({ state }: { state: GameState }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [state.log.length])

  return (
    <section
      aria-label="Action log"
      className="flex min-h-0 flex-col rounded-2xl border border-felt-600 bg-felt-800/50 p-3 backdrop-blur"
    >
      <h2 className="mb-2 font-display text-xs uppercase tracking-[0.24em] text-brass-400">Log</h2>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 text-xs leading-relaxed">
        {state.log.map((entry) => (
          <p key={entry.id} className={KIND_COLOR[entry.kind]}>
            {entry.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  )
}
