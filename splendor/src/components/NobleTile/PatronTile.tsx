import type { GemCount, Patron } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { gemTheme } from '@/utils/colors'
import { patronArtUrl } from '@/utils/art'

interface PatronTileProps {
  patron: Patron
  /** Viewer's permanent bonuses, used to show progress. Omit to hide progress. */
  bonuses?: GemCount
  onClick?: () => void
  selectable?: boolean
  /**
   * `board`: the square tile used in the patron column and the patron panels.
   * `small`: a compact badge for opponents' boards.
   */
  size?: 'board' | 'small'
}

/**
 * A patron tile: a heraldic crest with the prestige value in the corner and the
 * requirement stacked down the left edge as coloured squares.
 *
 * Requirements are permanent CARD bonuses only - tokens never count - so the
 * progress shown on each square is drawn from bonuses: a square you already
 * satisfy gets a brass rim, and a patron you fully qualify for glows.
 */
export function PatronTile({
  patron,
  bonuses,
  onClick,
  selectable = false,
  size = 'board',
}: PatronTileProps) {
  const small = size === 'small'
  const requirements = GEM_COLORS.filter((color) => patron.requirement[color] > 0)
  const met =
    bonuses !== undefined &&
    requirements.every((color) => bonuses[color] >= patron.requirement[color])

  const progress = requirements
    .map((c) => {
      const need = patron.requirement[c]
      const have = bonuses ? Math.min(bonuses[c], need) : null
      return `${have === null ? '' : `${have}/`}${need} ${gemTheme(c).label}`
    })
    .join(', ')

  const Element = onClick ? 'button' : 'div'
  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={`${patron.name} — ${patron.points} prestige. Needs ${progress} (card bonuses).`}
      className={[
        'relative shrink-0 overflow-hidden rounded-lg border-2 text-left transition',
        small ? 'h-12 w-12' : 'h-[5.75rem] w-[5.75rem]',
        met ? 'border-brass-400 shadow-[0_0_16px_rgba(217,177,105,0.4)]' : 'border-felt-500',
        selectable ? 'cursor-pointer hover:-translate-y-1 hover:border-brass-400' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: 'linear-gradient(160deg, #3a3222 0%, #141a26 75%)',
        boxShadow: met ? undefined : '0 6px 16px rgba(0,0,0,0.5)',
      }}
    >
      {/*
        The portrait takes the spot the crest had: a framed window on the right,
        leaving the requirement column on the left over the bronze tile. On the
        small badge it fills the tile, as the crest did.
      */}
      <img
        src={patronArtUrl(patron.id)}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`pointer-events-none absolute object-cover ${
          small
            ? 'inset-0 h-full w-full'
            : 'inset-y-1 right-1 w-[3.9rem] rounded-sm border border-brass-600/50'
        }`}
        // Portraits put the face in the upper third.
        style={{ objectPosition: '50% 22%' }}
      />

      {/* Prestige value. */}
      <span
        className={`absolute right-1 top-0.5 font-display leading-none text-parchment drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${
          small ? 'text-sm' : 'text-xl'
        }`}
      >
        {patron.points}
      </span>

      {/* Requirement, stacked down the left edge. */}
      {!small && (
        <div className="absolute bottom-1 left-1 top-1 flex flex-col justify-end gap-0.5">
          {requirements.map((color) => {
            const need = patron.requirement[color]
            const done = bonuses ? bonuses[color] >= need : false
            const theme = gemTheme(color)
            return (
              <span
                key={color}
                className={`grid h-5 w-5 place-items-center rounded-sm border text-[0.7rem] font-bold tabular-nums shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${
                  done ? 'ring-2 ring-brass-400' : ''
                }`}
                style={{ background: theme.fill, borderColor: theme.rim, color: theme.ink }}
              >
                {need}
              </span>
            )
          })}
        </div>
      )}
    </Element>
  )
}
