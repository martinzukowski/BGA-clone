import { useEffect, useRef, useState } from 'react'
import type { GameState } from '@/game/engine/types'

const FLASH_MS = 800

/**
 * Returns the ids of cards that have just entered somebody's tableau or
 * reserve, so the UI can play a brief highlight. Purely cosmetic: the value is
 * derived from state changes and never feeds back into the game.
 */
export function useFlashCards(state: GameState | null): string[] {
  const [flashing, setFlashing] = useState<string[]>([])
  const previous = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!state) {
      previous.current = new Set()
      setFlashing([])
      return
    }
    const owned = new Set<string>()
    for (const player of state.players) {
      for (const id of player.purchased) owned.add(id)
      for (const id of player.reserved) owned.add(id)
    }
    const fresh = [...owned].filter((id) => !previous.current.has(id))
    previous.current = owned
    if (fresh.length === 0) return

    setFlashing(fresh)
    const timer = setTimeout(() => setFlashing([]), FLASH_MS)
    return () => clearTimeout(timer)
  }, [state])

  return flashing
}
