import { useEffect, useState } from 'react'
import type { TokenColor } from '@/game/engine/types'

/**
 * Transient "a gem flew across the screen" animation bus.
 *
 * Deliberately NOT in the Zustand store and definitely not in GameState: these
 * events are pure decoration, they must never be persisted, replayed on load,
 * or reasoned about by the engine. A tiny subscriber list is all this needs.
 */

export interface GemFlight {
  id: number
  color: TokenColor
  /** Viewport coordinates of the gem's starting centre. */
  from: { x: number; y: number }
  /** Stagger, so a burst of gems does not move as one blob. */
  delayMs: number
}

type Listener = (flight: GemFlight) => void

const listeners = new Set<Listener>()
let nextId = 1

/**
 * Queues a flight from a source element to whichever token slot currently owns
 * this colour. The destination is resolved at render time, not here, so the
 * gem lands correctly whether the rail is docked right or bottom.
 */
export function launchGemFlight(color: TokenColor, source: Element | null, count = 1): void {
  if (!source) return
  if (typeof window === 'undefined') return
  // Respect the same motion preference the CSS animations honour.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const rect = source.getBoundingClientRect()
  const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

  for (let i = 0; i < count; i++) {
    const flight: GemFlight = { id: nextId++, color, from, delayMs: i * 110 }
    for (const listener of listeners) listener(flight)
  }
}

/** Attribute used to find a colour's landing slot in the DOM. */
export function tokenSlotAttr(color: TokenColor): Record<string, string> {
  return { 'data-token-slot': color }
}

export function findTokenSlot(color: TokenColor): Element | null {
  if (typeof document === 'undefined') return null
  return document.querySelector(`[data-token-slot="${color}"]`)
}

/** Subscribes the overlay to new flights. */
export function useGemFlights(): GemFlight[] {
  const [flights, setFlights] = useState<GemFlight[]>([])

  useEffect(() => {
    const listener: Listener = (flight) => {
      setFlights((current) => [...current, flight])
      // Self-cleaning: drop the node once its animation window has passed.
      window.setTimeout(() => {
        setFlights((current) => current.filter((f) => f.id !== flight.id))
      }, FLIGHT_MS + flight.delayMs + 80)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return flights
}

export const FLIGHT_MS = 520
