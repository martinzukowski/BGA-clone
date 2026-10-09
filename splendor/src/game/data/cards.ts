/**
 * Development-card deck for Gemwright.
 *
 * ORIGINAL CONTENT NOTE: names, themes and art are original to this project.
 * The *economy* (how many cards per tier, roughly what they cost) follows the
 * classic gem-engine template because that is what makes the game work.
 *
 * DOCUMENTED ASSUMPTION — deck composition
 * ----------------------------------------
 * Rather than hand-authoring 90 cards, the deck is generated from a small set
 * of cost *shapes*. A shape is a 5-tuple of costs expressed as CYCLIC OFFSETS
 * from the card's own bonus colour, in the fixed order
 * [white, blue, green, red, black]:
 *
 *   shape[0] -> cost in the card's own bonus colour
 *   shape[1] -> cost in the next colour clockwise, etc.
 *
 * Applying every shape to all five bonus colours yields a perfectly symmetric,
 * colour-balanced deck of 40 / 30 / 20 cards across tiers 1 / 2 / 3, with the
 * classic point distribution (tier 1 mostly 0pt, tier 3 worth 3-5pt).
 * If you want to rebalance the game, edit the shapes here and nowhere else.
 */
import type { Card, GemColor, GemCount, Tier } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'

interface CostShape {
  /** Costs by cyclic offset from the bonus colour. */
  offsets: [number, number, number, number, number]
  points: number
}

/** 8 shapes x 5 colours = 40 cards. Cheap, mostly pointless, engine-building. */
const TIER1_SHAPES: CostShape[] = [
  { offsets: [0, 1, 1, 1, 1], points: 0 },
  { offsets: [0, 1, 2, 1, 1], points: 0 },
  { offsets: [0, 2, 2, 0, 1], points: 0 },
  { offsets: [1, 0, 1, 3, 0], points: 0 },
  { offsets: [0, 0, 2, 1, 0], points: 0 },
  { offsets: [0, 0, 3, 0, 0], points: 0 },
  { offsets: [0, 2, 0, 0, 2], points: 0 },
  { offsets: [0, 0, 0, 4, 0], points: 1 },
]

/** 6 shapes x 5 colours = 30 cards. */
const TIER2_SHAPES: CostShape[] = [
  { offsets: [0, 0, 2, 3, 2], points: 1 },
  { offsets: [0, 3, 2, 2, 0], points: 1 },
  { offsets: [0, 0, 5, 0, 0], points: 2 },
  { offsets: [0, 0, 5, 3, 0], points: 2 },
  { offsets: [0, 1, 4, 2, 0], points: 2 },
  { offsets: [0, 0, 0, 6, 0], points: 3 },
]

/** 4 shapes x 5 colours = 20 cards. */
const TIER3_SHAPES: CostShape[] = [
  { offsets: [0, 3, 3, 5, 3], points: 3 },
  { offsets: [0, 0, 0, 7, 0], points: 4 },
  { offsets: [3, 0, 6, 3, 0], points: 4 },
  { offsets: [3, 0, 7, 0, 0], points: 5 },
]

/** Original flavour vocabulary. */
const COLOR_WORDS: Record<GemColor, string[]> = {
  white: ['Pearl', 'Alabaster', 'Frostglass'],
  blue: ['Sapphire', 'Cobalt', 'Tidestone'],
  green: ['Emerald', 'Verdant', 'Moss-Agate'],
  red: ['Carnelian', 'Ember', 'Cinnabar'],
  black: ['Obsidian', 'Shadeglass', 'Nightstone'],
}

const TIER_WORDS: Record<Tier, string[]> = {
  1: ['Prospect', 'Panning Claim', "Cutter's Bench", 'Sluice', 'Tumbler', 'Coal Seam', 'Trade Stall', 'Apprentice Lot'],
  2: ['Workshop', 'Foundry', 'Kiln', 'Exchange', 'Refinery', 'Guildhall'],
  3: ['Grand Atelier', 'Royal Vault', 'Crown Reliquary', 'Master Conservatory'],
}

function emptyCost(): GemCount {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0 }
}

function buildTier(tier: Tier, shapes: CostShape[]): Card[] {
  const cards: Card[] = []
  GEM_COLORS.forEach((bonus, colorIndex) => {
    shapes.forEach((shape, shapeIndex) => {
      const cost = emptyCost()
      shape.offsets.forEach((amount, offset) => {
        if (amount === 0) return
        cost[GEM_COLORS[(colorIndex + offset) % GEM_COLORS.length]] = amount
      })
      const word = COLOR_WORDS[bonus][shapeIndex % COLOR_WORDS[bonus].length]
      const noun = TIER_WORDS[tier][shapeIndex % TIER_WORDS[tier].length]
      cards.push({
        id: `t${tier}-${bonus}-${shapeIndex}`,
        tier,
        bonus,
        points: shape.points,
        cost,
        name: `${word} ${noun}`,
      })
    })
  })
  return cards
}

export const TIER1_CARDS: Card[] = buildTier(1, TIER1_SHAPES)
export const TIER2_CARDS: Card[] = buildTier(2, TIER2_SHAPES)
export const TIER3_CARDS: Card[] = buildTier(3, TIER3_SHAPES)

export const ALL_CARDS: Card[] = [...TIER1_CARDS, ...TIER2_CARDS, ...TIER3_CARDS]

export const CARDS_BY_TIER: Record<Tier, Card[]> = {
  1: TIER1_CARDS,
  2: TIER2_CARDS,
  3: TIER3_CARDS,
}

const CARD_INDEX: Record<string, Card> = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]))

/** Throws on unknown id — an unknown id is always an engine bug, never user input. */
export function getCard(id: string): Card {
  const card = CARD_INDEX[id]
  if (!card) throw new Error(`Unknown card id: ${id}`)
  return card
}

export function tryGetCard(id: string | null | undefined): Card | null {
  if (!id) return null
  return CARD_INDEX[id] ?? null
}
