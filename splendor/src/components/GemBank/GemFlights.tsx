import { useLayoutEffect, useRef } from 'react'
import { Gem } from '@/components/Card/Gem'
import { FLIGHT_MS, findTokenSlot, useGemFlights, type GemFlight } from '@/utils/gemFlight'

/**
 * Fixed overlay that animates gems from the bank into the token rail.
 *
 * Mounted once, at the app root. Each flight is an absolutely-positioned gem
 * driven by the Web Animations API rather than CSS classes, because the
 * destination is only known at run time - the rail docks to the right on wide
 * screens and to the bottom on narrow ones, and the gem has to land on
 * whichever it currently is.
 */
export function GemFlights() {
  const flights = useGemFlights()
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {flights.map((flight) => (
        <FlyingGem key={flight.id} flight={flight} />
      ))}
    </div>
  )
}

function FlyingGem({ flight }: { flight: GemFlight }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const target = findTokenSlot(flight.color)
    if (!target) return
    const rect = target.getBoundingClientRect()
    const to = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

    const dx = to.x - flight.from.x
    const dy = to.y - flight.from.y
    // Arc the gem upward on its way across so it reads as a toss, not a slide.
    const lift = Math.min(140, Math.max(40, Math.abs(dx) * 0.22)) * -1

    const animation = node.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 + lift}px)) scale(1.25)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.35)`,
          opacity: 0.15,
        },
      ],
      {
        duration: FLIGHT_MS,
        delay: flight.delayMs,
        easing: 'cubic-bezier(0.35, 0, 0.25, 1)',
        fill: 'both',
      },
    )

    // Land with a small pulse on the destination slot.
    const onFinish = () => {
      target.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.18)' },
          { transform: 'scale(1)' },
        ],
        { duration: 260, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' },
      )
    }
    animation.addEventListener('finish', onFinish)

    return () => {
      animation.removeEventListener('finish', onFinish)
      animation.cancel()
    }
  }, [flight])

  return (
    <div
      ref={ref}
      className="absolute"
      style={{ left: flight.from.x, top: flight.from.y, opacity: 0 }}
    >
      <div className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
        <Gem color={flight.color} size={30} />
      </div>
    </div>
  )
}
