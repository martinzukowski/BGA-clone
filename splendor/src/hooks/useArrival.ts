import { useEffect, useRef, useState } from 'react'

/**
 * Reports how many tokens just arrived in a slot, for about a second after they
 * land; 0 the rest of the time.
 *
 * Gold is the reason this exists: it arrives silently as a side effect of
 * reserving, so without an explicit callout players reasonably conclude they
 * never got it.
 */
export function useArrival(count: number): number {
  const previous = useRef(count)
  const [delta, setDelta] = useState(0)

  useEffect(() => {
    const gained = count - previous.current
    previous.current = count
    if (gained <= 0) return
    setDelta(gained)
    const timer = window.setTimeout(() => setDelta(0), 1100)
    return () => window.clearTimeout(timer)
  }, [count])

  return delta
}
