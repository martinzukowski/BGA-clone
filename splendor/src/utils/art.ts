import type { Card } from '@/game/engine/types'

/**
 * Where a card's or patron's painting lives, and which part of it to show.
 * The images and their credits are in public/art/ and src/game/data/art.ts.
 */

const BASE = `${import.meta.env.BASE_URL}art/`

/** Shapes per tier, mirroring the deck generator in game/data/cards.ts. */
const SHAPES_PER_TIER: Record<number, number> = { 1: 8, 2: 6, 3: 4 }

/** One painting per tier and bonus colour. */
export function cardArtUrl(card: Card): string {
  return `${BASE}t${card.tier}-${card.bonus}.jpg`
}

/**
 * Cards that share a painting each show a different slice of it.
 *
 * The paintings are mostly landscape and the cards are portrait, so a card
 * only ever shows a vertical strip. Sliding that strip across the canvas by
 * the card's index within its group turns one painting into several distinct
 * views instead of repeating the same crop.
 */
export function cardArtPosition(card: Card): string {
  const index = Number(card.id.split('-').pop() ?? 0)
  const count = SHAPES_PER_TIER[card.tier] ?? 1
  const x = count <= 1 ? 50 : Math.round((index / (count - 1)) * 100)
  return `${x}% 50%`
}

/** Patron portraits are named after the patron id. */
export function patronArtUrl(patronId: string): string {
  return `${BASE}${patronId}.jpg`
}
