import type { MouseEvent } from 'react'
import type { TokenColor } from '@/game/engine/types'
import { gemTheme } from '@/utils/colors'

interface GemProps {
  color: TokenColor
  /** Pixel size of the gem's bounding box. */
  size?: number
  className?: string
}

/**
 * A CSS-only faceted gem. No image assets: a clipped rhombus with a highlight
 * wedge and a shadow wedge (see `.gem-facet` in index.css).
 */
export function Gem({ color, size = 24, className = '' }: GemProps) {
  const theme = gemTheme(color)
  return (
    <span
      className={`gem-facet inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${theme.fill} 0%, ${theme.rim} 100%)`,
      }}
      aria-hidden="true"
    />
  )
}

interface TokenProps {
  color: TokenColor
  count?: number
  size?: number
  /**
   * Renders as a button when provided. Receives the event so callers can use
   * `currentTarget` as the origin of a gem-flight animation.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void
  disabled?: boolean
  selected?: boolean
  title?: string
  className?: string
}

/**
 * A bank/stock token: a round chip with a gem face and a count badge.
 * Used in the bank, in player stocks, and in the token-return modal.
 */
export function Token({
  color,
  count,
  size = 56,
  onClick,
  disabled = false,
  selected = false,
  title,
  className = '',
}: TokenProps) {
  const theme = gemTheme(color)
  const interactive = Boolean(onClick)
  const Element = interactive ? 'button' : 'div'

  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      disabled={interactive ? disabled : undefined}
      title={title ?? theme.label}
      aria-label={count === undefined ? theme.label : `${theme.label}: ${count}`}
      className={[
        'relative grid place-items-center rounded-full transition',
        'border-2 shadow-[inset_0_2px_6px_rgba(255,255,255,0.18),0_6px_14px_rgba(0,0,0,0.45)]',
        interactive && !disabled ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : '',
        interactive && disabled ? 'cursor-not-allowed opacity-40' : '',
        selected ? 'ring-2 ring-brass-400 ring-offset-2 ring-offset-felt-900 -translate-y-1' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: size,
        height: size,
        borderColor: theme.rim,
        background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${theme.fill} 85%, white) 0%, ${theme.fill} 45%, ${theme.rim} 100%)`,
      }}
    >
      <Gem color={color} size={size * 0.44} />
      {count !== undefined && (
        <span
          className="absolute -bottom-1.5 -right-1.5 grid h-6 min-w-6 place-items-center rounded-full border border-felt-500 bg-felt-800 px-1 text-xs font-semibold tabular-nums text-parchment"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </Element>
  )
}

interface PipProps {
  color: TokenColor
  value: number
  /** Dim the pip when the player already covers this cost with bonuses. */
  covered?: boolean
  size?: number
}

/** A single cost pip on a card: coloured disc with the amount inside. */
export function CostPip({ color, value, covered = false, size = 22 }: PipProps) {
  const theme = gemTheme(color)
  return (
    <span
      className={`grid place-items-center rounded-full border text-[11px] font-bold tabular-nums transition ${
        covered ? 'opacity-35 line-through' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: theme.fill,
        borderColor: theme.rim,
        color: theme.ink,
      }}
      title={`${value} ${theme.label}`}
    >
      {value}
    </span>
  )
}
