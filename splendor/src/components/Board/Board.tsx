import type { GameState, GemCount, PlayerState, Tier } from '@/game/engine/types'
import { canPurchaseCard, canReserveDeck, canReserveVisible } from '@/game/engine/validation'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'
import { CARD_SIZE, CardBack, CardTile } from '@/components/Card/CardTile'
import { PatronTile } from '@/components/NobleTile/PatronTile'
import { launchGemFlight } from '@/utils/gemFlight'
import { HUMAN_ID, useGameStore } from '@/store/gameStore'

interface MarketProps {
  state: GameState
  /** The human seat, used for discounts, affordability and hover pricing. */
  player: PlayerState
  interactive: boolean
  /** Card ids to flash because they just changed hands. */
  flashCardIds: string[]
}

/**
 * The card market: one row per tier, highest tier on top, each row led by its
 * face-down deck. Rows line up as a grid so the four face-up slots of every
 * tier sit in the same columns.
 */
export function Market({ state, player, interactive, flashCardIds }: MarketProps) {
  return (
    <section aria-label="Card market" className="flex flex-col gap-2">
      {([3, 2, 1] as Tier[]).map((tier) => (
        <MarketRow
          key={tier}
          tier={tier}
          state={state}
          player={player}
          interactive={interactive}
          flashCardIds={flashCardIds}
        />
      ))}
    </section>
  )
}

interface MarketRowProps extends MarketProps {
  tier: Tier
}

function MarketRow({ tier, state, player, interactive, flashCardIds }: MarketRowProps) {
  const purchase = useGameStore((s) => s.purchase)
  const reserveVisible = useGameStore((s) => s.reserveVisible)
  const reserveDeck = useGameStore((s) => s.reserveDeck)
  const setHoveredCard = useGameStore((s) => s.setHoveredCard)
  const row = state.market[tier]
  const goldOnReserve = state.bank.gold > 0

  /** Reserving pays a gold wild when the supply has one; animate it arriving. */
  const flyGoldFrom = (selector: string) => {
    if (goldOnReserve) launchGemFlight('gold', document.querySelector(selector))
  }

  return (
    <div className="flex gap-2" aria-label={`Tier ${tier}`}>
      <CardBack
        tier={tier}
        remaining={row.deck.length}
        goldOnReserve={goldOnReserve}
        reserve={interactive ? canReserveDeck(state, HUMAN_ID, tier) : null}
        onReserve={
          interactive
            ? () => {
                flyGoldFrom(`[data-deck-tier="${tier}"]`)
                reserveDeck(tier)
              }
            : undefined
        }
        className="mr-2"
      />
      {row.visible.map((cardId, slot) =>
        cardId ? (
          <CardTile
            key={cardId}
            card={getCard(cardId)}
            player={player}
            onHoverChange={setHoveredCard}
            flash={flashCardIds.includes(cardId)}
            purchase={interactive ? canPurchaseCard(state, HUMAN_ID, cardId) : null}
            reserve={interactive ? canReserveVisible(state, HUMAN_ID, cardId) : null}
            goldOnReserve={goldOnReserve}
            onPurchase={interactive ? () => purchase(cardId) : undefined}
            onReserve={
              interactive
                ? () => {
                    flyGoldFrom(`[data-card-id="${cardId}"]`)
                    reserveVisible(cardId)
                  }
                : undefined
            }
            className="anim-rise"
          />
        ) : (
          <EmptySlot key={`empty-${tier}-${slot}`} />
        ),
      )}
    </div>
  )
}

function EmptySlot() {
  return (
    <div
      className={`grid shrink-0 ${CARD_SIZE} place-items-center rounded-lg border-2 border-dashed border-felt-600 text-center text-[0.6rem] uppercase tracking-widest text-muted`}
    >
      Deck
      <br />
      spent
    </div>
  )
}

/**
 * The patrons still on offer, as a column beside the bank. Patrons that have
 * already visited someone leave the column and appear on that player's board,
 * which is where they now score.
 */
export function PatronColumn({ state, bonuses }: { state: GameState; bonuses: GemCount }) {
  return (
    <section
      aria-label="Patrons"
      className="flex flex-row flex-wrap justify-center gap-2 xl:flex-col xl:flex-nowrap"
    >
      {state.availablePatrons.map((id) => (
        <PatronTile key={id} patron={getPatron(id)} bonuses={bonuses} />
      ))}
      {state.availablePatrons.length === 0 && (
        <p className="w-[5.75rem] text-center text-[0.6rem] uppercase tracking-wider text-muted">
          All patrons claimed
        </p>
      )}
    </section>
  )
}
