/**
 * Turns a redacted VisibleGameState back into a full, *plausible* GameState so
 * that Hard AI can run the real engine forward.
 *
 * This is honest inference, not cheating. The bot knows exactly what a human at
 * the table knows: which cards are face up, which have been bought, and how
 * many remain undealt. It fills the unknowns with a random consistent
 * assignment drawn from ITS OWN rng - never the game's - so it cannot predict
 * an actual future draw any better than a human counting cards could.
 */
import type { GameState, PlayerState, Tier, VisibleGameState } from '@/game/engine/types'
import { TIERS } from '@/game/engine/rules'
import { ALL_CARDS } from '@/game/data/cards'
import type { RngStream } from '@/utils/rng'

function shuffleInPlace<T>(items: T[], rng: RngStream): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

export function determinize(view: VisibleGameState, rng: RngStream): GameState {
  // Everything whose identity the viewer already knows.
  const known = new Set<string>()
  for (const tier of TIERS) {
    for (const id of view.market[tier].visible) if (id) known.add(id)
  }
  for (const player of view.players) {
    for (const id of player.purchased) known.add(id)
    for (const id of player.reserved) known.add(id)
  }

  // Unknown cards, partitioned by tier (tier membership is public: a face-down
  // deck is a specific tier's deck).
  const unknownByTier: Record<Tier, string[]> = { 1: [], 2: [], 3: [] }
  for (const card of ALL_CARDS) {
    if (!known.has(card.id)) unknownByTier[card.tier].push(card.id)
  }
  for (const tier of TIERS) shuffleInPlace(unknownByTier[tier], rng)

  // Deal plausible decks first; whatever is left over must be sitting in an
  // opponent's face-down reserve.
  const decks: Record<Tier, string[]> = { 1: [], 2: [], 3: [] }
  const leftovers: string[] = []
  for (const tier of TIERS) {
    const pool = unknownByTier[tier]
    const wanted = Math.min(view.market[tier].deckCount, pool.length)
    decks[tier] = pool.slice(0, wanted)
    leftovers.push(...pool.slice(wanted))
  }
  shuffleInPlace(leftovers, rng)

  let leftoverIndex = 0
  const players: PlayerState[] = view.players.map((vp) => {
    const hidden: string[] = []
    for (let i = 0; i < vp.hiddenReservedCount; i++) {
      const id = leftovers[leftoverIndex++]
      if (id) hidden.push(id)
    }
    return {
      id: vp.id,
      name: vp.name,
      difficulty: vp.difficulty,
      isBot: vp.isBot,
      tokens: { ...vp.tokens },
      purchased: [...vp.purchased],
      reserved: [...vp.reserved, ...hidden],
      reservedHidden: hidden,
      patrons: [...vp.patrons],
    }
  })

  return {
    version: view.version,
    config: view.config,
    // A throwaway rng: nothing in a simulation should consume the real stream.
    rng: { seed: rng.int(0x7fffffff), cursor: 0 },
    players,
    currentPlayerIndex: view.currentPlayerIndex,
    round: view.round,
    turnCount: view.turnCount,
    phase: view.phase,
    bank: { ...view.bank },
    market: {
      1: { deck: decks[1], visible: [...view.market[1].visible] },
      2: { deck: decks[2], visible: [...view.market[2].visible] },
      3: { deck: decks[3], visible: [...view.market[3].visible] },
    },
    patrons: [...view.patrons],
    availablePatrons: [...view.availablePatrons],
    endTriggeredByIndex: view.endTriggeredByIndex,
    winnerIds: [...view.winnerIds],
    // The log is irrelevant to simulation and expensive to copy.
    log: [],
  }
}

