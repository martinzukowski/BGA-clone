import type { GameState, GemColor } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'
import { affordability, playerBonuses, playerScore, totalTokens } from '@/game/engine/rules'
import { tryGetCard } from '@/game/data/cards'
import { gemTheme } from '@/utils/colors'
import type { TokenColor } from '@/game/engine/types'
import { Gem } from '@/components/Card/Gem'
import { tokenSlotAttr } from '@/utils/gemFlight'
import { useArrival } from '@/hooks/useArrival'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'

/**
 * "My Gems": your whole purchasing power in one bar, directly under the market.
 *
 * Each colour pairs the two things that pay for a card - the stack of cards
 * that give a permanent discount (the coloured block) and the loose tokens you
 * hold (the chip) - so you read your buying power for a colour as one unit.
 *
 * It also prices whatever card you hover: colours that card does not need
 * fade, colours you are short of show a red "-n", gold reports how many wilds
 * it would need, and the line underneath spells the verdict out. Gems picked
 * from the bank but not yet confirmed show as a brass "+n", and tokens that
 * have just arrived float a "+n" so nothing lands silently.
 */
export function MyGems({ state }: { state: GameState }) {
  const hoveredCardId = useGameStore((s) => s.hoveredCardId)
  const selection = useGameStore((s) => s.gemSelection)

  const player = state.players.find((p) => p.id === HUMAN_ID)
  if (!player) return null

  const bonuses = playerBonuses(player)
  const held = totalTokens(player.tokens)
  const hovered = tryGetCard(hoveredCardId)
  const money = hovered ? affordability(player, hovered, bonuses) : null
  const score = playerScore(player)

  return (
    <section aria-label="My gems" className="flex flex-col items-center gap-1.5">
      <div className="relative w-fit rounded-xl border-2 border-brass-600/70 bg-felt-800/80 px-3 pb-2.5 pt-4 shadow-[0_10px_26px_rgba(0,0,0,0.45)] backdrop-blur">
        {/* Labels sitting on the frame, like tabs. */}
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-brass-600 bg-felt-900 px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brass-400">
          My Gems
        </span>
        <span
          className="absolute -top-2.5 left-3 rounded-full border border-brass-600 bg-felt-900 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-brass-400"
          title={`${score} of ${state.config.winningScore} prestige triggers the final round`}
        >
          ★ {score}/{state.config.winningScore}
        </span>
        <span
          className={`absolute -top-2.5 right-3 rounded-full border bg-felt-900 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums ${
            held >= state.config.tokenLimit
              ? 'border-gem-red/70 text-gem-red'
              : 'border-brass-600 text-brass-400'
          }`}
          title={`Tokens held. You must be at or below ${state.config.tokenLimit} when your turn ends.`}
        >
          {held}/{state.config.tokenLimit}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {GEM_COLORS.map((color) => (
            <GemSlot
              key={color}
              color={color}
              bonus={bonuses[color]}
              tokens={player.tokens[color]}
              pending={selection.filter((c) => c === color).length}
              needed={money ? money.effective[color] : 0}
              short={money ? money.shortByColor[color] : 0}
              dimmed={money !== null && money.effective[color] === 0}
            />
          ))}
          <GoldSlot
            tokens={player.tokens.gold}
            needed={money ? money.goldNeeded : 0}
            enough={money ? money.goldHeld >= money.goldNeeded : true}
            dimmed={money !== null && money.goldNeeded === 0}
          />
        </div>
      </div>

      {/* The verdict on whatever card is under the cursor. */}
      <p className="min-h-4 max-w-full truncate text-center text-xs" aria-live="polite">
        {hovered && money ? (
          money.affordable ? (
            <span className="text-brass-400">
              <strong className="font-semibold">{hovered.name}</strong> — you can buy this
              {money.goldNeeded > 0
                ? `, spending ${money.goldNeeded} gold as ${money.goldNeeded === 1 ? 'a wild' : 'wilds'}`
                : ''}
              .
            </span>
          ) : (
            <span className="text-parchment/75">
              <strong className="font-semibold text-parchment">{hovered.name}</strong> — short{' '}
              {GEM_COLORS.filter((c) => money.shortByColor[c] > 0)
                .map((c) => `${money.shortByColor[c]} ${gemTheme(c).label}`)
                .join(', ')}
              {money.goldHeld > 0 ? ` (${money.goldHeld} gold covers part of it)` : ''}.
            </span>
          )
        ) : (
          <span className="text-muted">Hover a card to see what it would cost you.</span>
        )}
      </p>
    </section>
  )
}

interface GemSlotProps {
  color: GemColor
  bonus: number
  tokens: number
  pending: number
  needed: number
  short: number
  dimmed: boolean
}

function GemSlot({ color, bonus, tokens, pending, needed, short, dimmed }: GemSlotProps) {
  const theme = gemTheme(color)
  const arrived = useArrival(tokens)
  const relevant = needed > 0

  return (
    <div
      className={`relative flex items-center gap-1 rounded-lg border-2 p-1 transition ${
        short > 0 ? 'border-[#ff8a8a]/80' : relevant ? 'border-brass-500/80' : 'border-transparent'
      }`}
      style={{ opacity: dimmed ? 0.55 : 1 }}
      title={
        `${theme.label}: ${bonus} card bonus${bonus === 1 ? '' : 'es'} + ${tokens} token${tokens === 1 ? '' : 's'}` +
        (relevant ? ` · the hovered card needs ${needed}` : '')
      }
    >
      {/* Permanent discount: the stack of cards of this colour. */}
      <div
        className="grid h-12 w-9 place-items-center rounded-md border-2 font-display text-xl tabular-nums shadow-[inset_0_2px_6px_rgba(255,255,255,0.2),0_3px_8px_rgba(0,0,0,0.5)]"
        style={{
          background: `linear-gradient(160deg, color-mix(in oklab, ${theme.fill} 85%, white) 0%, ${theme.fill} 55%, ${theme.rim} 100%)`,
          borderColor: theme.rim,
          color: theme.ink,
          opacity: bonus === 0 ? 0.35 : 1,
        }}
      >
        {bonus > 0 ? bonus : ''}
      </div>

      {/* Loose tokens. The flight overlay lands gems on this chip. */}
      <CountChip color={color} count={tokens} />

      {pending > 0 && (
        <span className="anim-pop absolute -left-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-brass-500 px-1 text-[0.65rem] font-bold tabular-nums text-felt-900">
          +{pending}
        </span>
      )}
      {short > 0 && (
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#c34a4a] px-1 text-[0.65rem] font-bold tabular-nums text-white">
          −{short}
        </span>
      )}
      {arrived > 0 && (
        <span
          key={arrived}
          className="anim-float-up pointer-events-none absolute -top-1 left-1/2 text-sm font-bold text-brass-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        >
          +{arrived}
        </span>
      )}
    </div>
  )
}

interface GoldSlotProps {
  tokens: number
  needed: number
  enough: boolean
  dimmed: boolean
}

/** Gold has no cards behind it - it is a budget of wilds, not a colour. */
function GoldSlot({ tokens, needed, enough, dimmed }: GoldSlotProps) {
  const arrived = useArrival(tokens)
  const relevant = needed > 0

  return (
    <div
      className={`relative flex h-[3.75rem] items-center gap-1 rounded-lg border-2 px-1.5 transition ${
        relevant ? (enough ? 'border-brass-500/80' : 'border-[#ff8a8a]/80') : 'border-transparent'
      }`}
      style={{ opacity: dimmed ? 0.55 : 1 }}
      title={
        `Gold: ${tokens} wild${tokens === 1 ? '' : 's'}, each standing in for any missing gem` +
        (relevant ? ` · the hovered card would need ${needed}` : '')
      }
    >
      <CountChip color="gold" count={tokens} />
      {relevant && (
        <span className="flex items-center gap-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-brass-400">
          <Gem color="gold" size={9} />
          {needed}
        </span>
      )}
      {arrived > 0 && (
        <span
          key={arrived}
          className="anim-float-up pointer-events-none absolute -top-1 left-1/2 text-sm font-bold text-brass-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        >
          +{arrived}
        </span>
      )}
    </div>
  )
}

/**
 * A token chip carrying its count on the face. The flight overlay lands gems
 * on this element, which is why it owns the slot attribute.
 */
function CountChip({ color, count }: { color: TokenColor; count: number }) {
  const theme = gemTheme(color)
  return (
    <div
      {...tokenSlotAttr(color)}
      className="grid h-10 w-10 place-items-center rounded-full border-2 font-display text-lg font-bold tabular-nums shadow-[inset_0_2px_6px_rgba(255,255,255,0.18),0_4px_10px_rgba(0,0,0,0.45)]"
      style={{
        borderColor: theme.rim,
        color: theme.ink,
        background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${theme.fill} 85%, white) 0%, ${theme.fill} 45%, ${theme.rim} 100%)`,
        opacity: count === 0 ? 0.4 : 1,
      }}
    >
      {count}
    </div>
  )
}
