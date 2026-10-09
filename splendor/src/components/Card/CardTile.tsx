import { useState } from 'react'
import type { Card, PlayerState, Validity } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { affordability, playerBonuses } from '@/game/engine/rules'
import { cardFrame, gemLabel, gemTheme, TIER_ACCENT } from '@/utils/colors'
import { Gem } from './Gem'
import { cardArtPosition, cardArtUrl } from '@/utils/art'

/**
 * One place to change card geometry; deck backs and empty slots match it.
 * Compact on purpose: the table layout shows decks, a 4x3 market, the bank
 * and the patrons side by side, which only works if a card is small.
 */
export const CARD_SIZE = 'h-[10.5rem] w-[7.5rem]'

export interface CardTileProps {
  card: Card
  /** The viewing player, used for discounts and affordability. */
  player: PlayerState
  /** Result of the engine's purchase check, or null when actions are hidden. */
  purchase?: Validity | null
  reserve?: Validity | null
  onPurchase?: () => void
  onReserve?: () => void
  /** Notifies the purse readouts which card is under the cursor. */
  onHoverChange?: (cardId: string | null) => void
  /**
   * Whether reserving right now would also pay a Gold wild. The supply is
   * shared and bots drain it, so this has to be shown BEFORE the click.
   */
  goldOnReserve?: boolean
  /** Highlights the card briefly after it changes hands. */
  flash?: boolean
  className?: string
}

/**
 * A development card, laid out like a physical card: full-bleed art, prestige
 * top-left, the permanent bonus gem top-right, and the cost as a column of
 * coins down the bottom-left edge.
 *
 * The coins show the EFFECTIVE cost after your permanent bonuses - what you
 * actually hand over. A colour you cannot cover from tokens gets a red rim and
 * a "-n" tag for exactly how many you are short. A card you can buy right now
 * gets a brass frame; if it would take gold wilds, a gold tag says how many.
 * The card name lives in the tooltip, as there is no room for it on the face.
 */
export function CardTile({
  card,
  player,
  purchase = null,
  reserve = null,
  onPurchase,
  onReserve,
  onHoverChange,
  goldOnReserve = false,
  flash = false,
  className = '',
}: CardTileProps) {
  const [open, setOpen] = useState(false)
  const frame = cardFrame(card.bonus)
  const bonuses = playerBonuses(player)
  const money = affordability(player, card, bonuses)
  const bonusTheme = gemTheme(card.bonus)
  const buyable = purchase?.ok === true
  const showActions = Boolean(onPurchase || onReserve)

  const costs = GEM_COLORS.filter((color) => money.effective[color] > 0)

  const setHover = (hovering: boolean) => {
    setOpen(hovering)
    onHoverChange?.(hovering ? card.id : null)
  }

  const summary =
    `${card.name} — Tier ${card.tier}, ${card.points} prestige, ${gemLabel(card.bonus)} bonus. ` +
    (money.affordable
      ? money.goldNeeded > 0
        ? `You can buy it using ${money.goldNeeded} gold.`
        : 'You can buy it.'
      : `${money.stillMissing} gem${money.stillMissing === 1 ? '' : 's'} short.`)

  return (
    <div
      data-card-id={card.id}
      title={summary}
      className={[
        'group relative shrink-0 overflow-hidden rounded-lg border-2 transition',
        CARD_SIZE,
        buyable ? 'border-brass-400' : '',
        showActions ? 'hover:-translate-y-1 hover:shadow-2xl' : '',
        flash ? 'anim-flash' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: `linear-gradient(170deg, ${frame.from} 0%, ${frame.to} 100%)`,
        borderColor: buyable ? undefined : frame.rim,
        boxShadow: buyable
          ? '0 8px 20px rgba(0,0,0,0.5), 0 0 14px rgba(217,177,105,0.35)'
          : '0 8px 20px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setHover(false)
      }}
    >
      {/*
        The art window: the painting sits between the header band and the cost
        area, so the coloured card body frames it - the same look the table had
        with the earlier drawn art, now with a painting in the window.
      */}
      <img
        src={cardArtUrl(card)}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute inset-x-0 top-8 h-[6.5rem] w-full object-cover"
        style={{ objectPosition: cardArtPosition(card) }}
      />

      {/* Header band: prestige left, permanent bonus right. */}
      <div
        className="absolute inset-x-0 top-0 flex h-8 items-center justify-between px-1.5"
        style={{ background: 'linear-gradient(to bottom, rgba(236,231,219,0.16), rgba(10,13,19,0.55))' }}
      >
        <span
          className="font-display text-2xl leading-none text-parchment drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]"
          title={`${card.points} prestige`}
        >
          {card.points > 0 ? card.points : ''}
        </span>
        <span
          className="grid h-6 w-6 place-items-center rounded-md border"
          style={{
            borderColor: bonusTheme.rim,
            background: `color-mix(in oklab, ${bonusTheme.fill} 35%, rgba(10,13,19,0.8))`,
          }}
          title={`Permanent ${gemLabel(card.bonus)} bonus`}
        >
          <Gem color={card.bonus} size={15} />
        </span>
      </div>

      {/* Cost: a column of coins along the bottom-left edge. */}
      <div className="absolute bottom-1.5 left-1.5 flex flex-col-reverse gap-1">
        {costs.length === 0 ? (
          <span className="rounded bg-felt-900/80 px-1 text-[0.6rem] font-semibold uppercase tracking-wider text-brass-400">
            Free
          </span>
        ) : (
          costs.map((color) => {
            const need = money.effective[color]
            const short = money.shortByColor[color]
            const printed = card.cost[color]
            const theme = gemTheme(color)
            return (
              <span key={color} className="flex items-center gap-1">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-bold tabular-nums shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${
                    short > 0 ? 'ring-2 ring-[#ff8a8a]' : ''
                  }`}
                  style={{ background: theme.fill, borderColor: theme.rim, color: theme.ink }}
                  title={
                    `${printed} ${theme.label}` +
                    (printed !== need ? ` − ${printed - need} bonus = ${need}` : '') +
                    (short > 0 ? ` · you are ${short} short` : ' · covered')
                  }
                >
                  {need}
                </span>
                {short > 0 && (
                  <span className="rounded bg-[#c34a4a] px-1 text-[0.58rem] font-bold leading-tight text-white">
                    −{short}
                  </span>
                )}
              </span>
            )
          })
        )}
      </div>

      {/* Buyable with wilds: say how many gold it would take. */}
      {money.affordable && money.goldNeeded > 0 && (
        <span
          className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-felt-900/85 px-1 text-[0.6rem] font-bold text-brass-400"
          title={`Buying this would spend ${money.goldNeeded} gold as wilds`}
        >
          <Gem color="gold" size={10} />
          {money.goldNeeded}
        </span>
      )}

      {/* Actions appear on hover/focus so the table stays calm at rest. */}
      {showActions && (
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 px-1 pb-1 pt-5 transition ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to top, rgba(8,11,17,0.97) 62%, rgba(8,11,17,0))',
          }}
        >
          {onPurchase && (
            <ActionButton label="Purchase" validity={purchase} onClick={onPurchase} primary />
          )}
          {onReserve && (
            <ActionButton
              label="Reserve"
              validity={reserve}
              onClick={onReserve}
              gold={goldOnReserve}
              goldHint
            />
          )}
        </div>
      )}
    </div>
  )
}

interface ActionButtonProps {
  label: string
  validity: Validity | null
  onClick: () => void
  primary?: boolean
  /** Reserve only: whether a Gold wild comes with it. */
  gold?: boolean
  /** Reserve only: explain the gold outcome in the tooltip. */
  goldHint?: boolean
}

/**
 * A card action. When the engine says the move is illegal the button is
 * disabled AND carries the engine's own explanation as its tooltip, so the UI
 * never has to reimplement (or guess at) a rule.
 */
function ActionButton({
  label,
  validity,
  onClick,
  primary = false,
  gold = false,
  goldHint = false,
}: ActionButtonProps) {
  const allowed = validity?.ok === true
  const reason = validity && !validity.ok ? validity.reason : undefined
  const title = reason
    ? reason
    : goldHint
      ? gold
        ? 'Reserve this card and take a Gold wild'
        : 'Reserve this card. No Gold left in the supply, so none comes with it.'
      : undefined
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!allowed}
      title={title}
      className={[
        'flex w-full items-center justify-center gap-1 rounded border px-1 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide transition',
        allowed
          ? primary
            ? 'border-brass-500 bg-brass-500 text-felt-900 hover:bg-brass-400'
            : 'border-felt-500 bg-felt-700/95 text-parchment hover:border-brass-500 hover:text-brass-400'
          : 'cursor-not-allowed border-felt-600 bg-felt-800/95 text-muted',
      ].join(' ')}
    >
      {label}
      {goldHint && allowed && gold && <Gem color="gold" size={10} />}
    </button>
  )
}

interface CardBackProps {
  tier: number
  remaining: number
  reserve?: Validity | null
  onReserve?: () => void
  /** Whether reserving from this deck would also pay a Gold wild. */
  goldOnReserve?: boolean
  className?: string
}

/**
 * A face-down deck. Reserving from here is the blind draw: the player commits
 * without seeing the card, and the UI never reveals what is on top.
 *
 * Shows the tier as pips (one, two or three) and the cards remaining as a
 * corner badge, so the deck column reads at a glance.
 */
export function CardBack({
  tier,
  remaining,
  reserve = null,
  onReserve,
  goldOnReserve = false,
  className = '',
}: CardBackProps) {
  const accent = TIER_ACCENT[tier]
  const empty = remaining === 0
  return (
    <div
      data-deck-tier={tier}
      className={`group relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border-2 ${CARD_SIZE} ${className}`}
      style={{
        borderColor: empty ? '#232c3e' : `color-mix(in oklab, ${accent} 55%, #232c3e)`,
        background: empty
          ? 'repeating-linear-gradient(135deg, #131824 0 8px, #0f1420 8px 16px)'
          : `radial-gradient(circle at 50% 42%, color-mix(in oklab, ${accent} 30%, #141b2a) 0%, #0e1320 75%)`,
        opacity: empty ? 0.45 : 1,
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
      }}
      title={`Tier ${tier} deck — ${remaining} card${remaining === 1 ? '' : 's'} left`}
    >
      {/* Remaining count. */}
      <span className="absolute left-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full border border-felt-500 bg-felt-900/90 px-1 text-[0.7rem] font-bold tabular-nums text-parchment">
        {remaining}
      </span>

      {/* An engraved guild mark, so the deck reads as part of the same set. */}
      {!empty && (
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          aria-hidden="true"
        >
          <circle cx={50} cy={46} r={30} fill="none" stroke={accent} strokeWidth={1} />
          <circle cx={50} cy={46} r={22} fill="none" stroke={accent} strokeWidth={0.6} />
          <polygon
            points="50,24 66,42 50,68 34,42"
            fill="none"
            stroke={accent}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      )}

      <span className="relative font-display text-xl tracking-wider" style={{ color: accent }}>
        Gemwright
      </span>
      {/* Tier pips. */}
      <span className="relative mt-1 flex gap-1" aria-label={`Tier ${tier}`}>
        {Array.from({ length: tier }, (_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        ))}
      </span>

      {onReserve && (
        <button
          type="button"
          onClick={onReserve}
          disabled={reserve?.ok !== true}
          title={
            reserve && !reserve.ok
              ? reserve.reason
              : goldOnReserve
                ? 'Reserve the top card unseen and take a Gold wild'
                : 'Reserve the top card unseen. No Gold left in the supply, so none comes with it.'
          }
          className={`absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded border px-1 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide opacity-0 transition group-hover:opacity-100 focus:opacity-100 ${
            reserve?.ok === true
              ? 'border-felt-500 bg-felt-800/95 text-parchment hover:border-brass-500 hover:text-brass-400'
              : 'cursor-not-allowed border-felt-600 bg-felt-800/90 text-muted'
          }`}
        >
          Blind reserve
          {reserve?.ok === true && goldOnReserve && <Gem color="gold" size={10} />}
        </button>
      )}
    </div>
  )
}
