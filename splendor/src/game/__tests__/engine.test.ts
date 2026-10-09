import { describe, expect, it } from 'vitest'
import { createGame, defaultBots } from '@/game/engine/setup'
import { applyAction, cloneState, legalMainActions } from '@/game/engine/actions'
import {
  canPurchaseCard,
  canReserveDeck,
  canReserveVisible,
  canTakeThree,
  canTakeTwoSame,
  calculatePurchaseCost,
  excessTokens,
} from '@/game/engine/validation'
import {
  affordability,
  determineWinners,
  discountedCost,
  emptyGems,
  emptyTokens,
  GOLD_SUPPLY,
  playerBonuses,
  playerScore,
  tokensPerColor,
  totalTokens,
} from '@/game/engine/rules'
import { checkInvariants, deserializeState, redactFor, serializeState } from '@/game/engine/gameState'
import { summariseGame } from '@/game/engine/scoring'
import { ALL_CARDS, CARDS_BY_TIER, getCard } from '@/game/data/cards'
import { ALL_PATRONS } from '@/game/data/nobles'
import type { Card, GameState, GemColor } from '@/game/engine/types'
import { GEM_COLORS } from '@/game/engine/types'

function newGame(botCount = 2, seed = 42): GameState {
  return createGame({ seed, bots: defaultBots(botCount, 'medium') })
}

/** Finds any card matching a predicate and forces it into the tier-1 market. */
function placeInMarket(state: GameState, card: Card, slot = 0): GameState {
  const draft = cloneState(state)
  const row = draft.market[card.tier]
  const displaced = row.visible[slot]
  // Keep the deck honest: put whatever was there back on top.
  if (displaced) row.deck.unshift(displaced)
  const fromDeck = row.deck.indexOf(card.id)
  if (fromDeck >= 0) row.deck.splice(fromDeck, 1)
  for (const tier of [1, 2, 3] as const) {
    const idx = draft.market[tier].visible.indexOf(card.id)
    if (idx >= 0) draft.market[tier].visible[idx] = draft.market[tier].deck.shift() ?? null
  }
  row.visible[slot] = card.id
  return draft
}

describe('card and patron data', () => {
  it('builds a colour-balanced 40/30/20 deck', () => {
    expect(CARDS_BY_TIER[1]).toHaveLength(40)
    expect(CARDS_BY_TIER[2]).toHaveLength(30)
    expect(CARDS_BY_TIER[3]).toHaveLength(20)
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(90)
    for (const tier of [1, 2, 3] as const) {
      for (const color of GEM_COLORS) {
        const count = CARDS_BY_TIER[tier].filter((c) => c.bonus === color).length
        expect(count).toBe(CARDS_BY_TIER[tier].length / 5)
      }
    }
  })

  it('never prices a card in a colour it does not exist in, and costs are positive', () => {
    for (const card of ALL_CARDS) {
      const total = GEM_COLORS.reduce((sum, c) => sum + card.cost[c], 0)
      expect(total).toBeGreaterThan(0)
      for (const color of GEM_COLORS) expect(card.cost[color]).toBeGreaterThanOrEqual(0)
    }
  })

  it('has ten distinct patrons worth 3 prestige each', () => {
    expect(ALL_PATRONS).toHaveLength(10)
    expect(new Set(ALL_PATRONS.map((p) => p.id)).size).toBe(10)
    for (const patron of ALL_PATRONS) expect(patron.points).toBe(3)
  })
})

describe('game initialization', () => {
  it('is deterministic for a given seed', () => {
    expect(serializeState(newGame(3, 7))).toBe(serializeState(newGame(3, 7)))
  })

  it('differs across seeds', () => {
    expect(serializeState(newGame(3, 7))).not.toBe(serializeState(newGame(3, 8)))
  })

  it.each([
    [1, 2, 4],
    [2, 3, 5],
    [3, 4, 7],
  ])('deals the right token supply for %i bots', (bots, players, perColor) => {
    const state = newGame(bots)
    expect(state.players).toHaveLength(players)
    expect(tokensPerColor(players)).toBe(perColor)
    for (const color of GEM_COLORS) expect(state.bank[color]).toBe(perColor)
    expect(state.bank.gold).toBe(GOLD_SUPPLY)
  })

  it('deals playerCount + 1 patrons', () => {
    for (const bots of [1, 2, 3]) {
      const state = newGame(bots)
      expect(state.patrons).toHaveLength(bots + 2)
      expect(state.availablePatrons).toEqual(state.patrons)
    }
  })

  it('sets up four face-up cards per tier with the rest in the deck', () => {
    const state = newGame(2)
    for (const tier of [1, 2, 3] as const) {
      expect(state.market[tier].visible).toHaveLength(4)
      expect(state.market[tier].visible.every((id) => id !== null)).toBe(true)
      expect(state.market[tier].deck).toHaveLength(CARDS_BY_TIER[tier].length - 4)
    }
  })

  it('starts every player empty-handed on turn one', () => {
    const state = newGame(3)
    for (const player of state.players) {
      expect(totalTokens(player.tokens)).toBe(0)
      expect(player.purchased).toHaveLength(0)
      expect(player.reserved).toHaveLength(0)
      expect(playerScore(player)).toBe(0)
    }
    expect(state.currentPlayerIndex).toBe(0)
    expect(state.round).toBe(1)
    expect(state.phase).toBe('playing')
    expect(checkInvariants(state)).toEqual([])
  })

  it('marks only the human as a non-bot', () => {
    const state = newGame(3)
    expect(state.players[0].isBot).toBe(false)
    expect(state.players.slice(1).every((p) => p.isBot)).toBe(true)
  })
})

describe('taking tokens', () => {
  it('takes three different gems and moves them from the bank', () => {
    const state = newGame(2)
    const result = applyAction(state, 'p0', {
      type: 'TAKE_THREE',
      colors: ['white', 'blue', 'green'],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const player = result.state.players[0]
    expect(player.tokens.white).toBe(1)
    expect(player.tokens.blue).toBe(1)
    expect(player.tokens.green).toBe(1)
    expect(result.state.bank.white).toBe(4)
    expect(result.state.currentPlayerIndex).toBe(1)
    expect(checkInvariants(result.state)).toEqual([])
  })

  it('rejects duplicate colours in a take-three', () => {
    const state = newGame(2)
    const check = canTakeThree(state, 'p0', ['red', 'red', 'blue'] as GemColor[])
    expect(check.ok).toBe(false)
    expect(applyAction(state, 'p0', { type: 'TAKE_THREE', colors: ['red', 'red', 'blue'] }).ok).toBe(
      false,
    )
  })

  it('refuses to under-draw when the bank could supply three colours', () => {
    const state = newGame(2)
    expect(canTakeThree(state, 'p0', ['red']).ok).toBe(false)
  })

  it('allows a short draw when the bank has run low', () => {
    const draft = cloneState(newGame(2))
    for (const color of GEM_COLORS) draft.bank[color] = 0
    draft.bank.red = 2
    draft.players[1].tokens.white = 4
    draft.players[1].tokens.blue = 4
    draft.players[2].tokens.green = 5
    draft.players[2].tokens.black = 5
    draft.players[1].tokens.red = 1
    draft.players[2].tokens.white = 0
    expect(canTakeThree(draft, 'p0', ['red']).ok).toBe(true)
  })

  it('takes two of one colour when the bank holds at least four', () => {
    const state = newGame(2)
    expect(state.bank.red).toBe(5)
    const result = applyAction(state, 'p0', { type: 'TAKE_TWO', color: 'red' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].tokens.red).toBe(2)
    expect(result.state.bank.red).toBe(3)
  })

  it('forbids taking two when fewer than four remain', () => {
    const draft = cloneState(newGame(2))
    draft.bank.red = 3
    draft.players[1].tokens.red = 2
    const check = canTakeTwoSame(draft, 'p0', 'red')
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toMatch(/at least 4/)
    expect(applyAction(draft, 'p0', { type: 'TAKE_TWO', color: 'red' }).ok).toBe(false)
  })

  it('forbids taking a colour the bank has none of', () => {
    const draft = cloneState(newGame(2))
    draft.bank.white = 0
    draft.players[1].tokens.white = 5
    expect(canTakeThree(draft, 'p0', ['white', 'blue', 'green']).ok).toBe(false)
  })

  it('refuses actions out of turn', () => {
    const state = newGame(2)
    const result = applyAction(state, 'p1', { type: 'TAKE_TWO', color: 'red' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/not your turn/i)
  })
})

describe('purchasing', () => {
  it('applies permanent bonuses as discounts', () => {
    const card = ALL_CARDS.find((c) => c.cost.white === 3 && c.cost.blue === 2 && c.cost.red === 1)
    const bonuses = { ...emptyGems(), white: 1, blue: 2 }
    const fallback: Card = {
      id: 'x',
      tier: 1,
      bonus: 'green',
      points: 0,
      name: 'x',
      cost: { white: 3, blue: 2, green: 0, red: 1, black: 0 },
    }
    const cost = discountedCost(card ?? fallback, bonuses)
    expect(cost.white).toBe(2)
    expect(cost.blue).toBe(0)
    expect(cost.red).toBe(1)
  })

  it('never discounts below zero', () => {
    const card = CARDS_BY_TIER[1][0]
    const cost = discountedCost(card, { white: 9, blue: 9, green: 9, red: 9, black: 9 })
    for (const color of GEM_COLORS) expect(cost[color]).toBe(0)
  })

  it('spends tokens, returns them to the bank, and grants the bonus and points', () => {
    let state = newGame(2)
    const card = CARDS_BY_TIER[1].find((c) => c.points === 1)!
    state = placeInMarket(state, card)
    const draft = cloneState(state)
    for (const color of GEM_COLORS) draft.players[0].tokens[color] = card.cost[color]
    // Balance the bank so conservation still holds for this constructed state.
    for (const color of GEM_COLORS) draft.bank[color] -= card.cost[color]

    const bankBefore = { ...draft.bank }
    const result = applyAction(draft, 'p0', { type: 'PURCHASE', cardId: card.id })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const player = result.state.players[0]
    expect(player.purchased).toContain(card.id)
    expect(totalTokens(player.tokens)).toBe(0)
    expect(playerBonuses(player)[card.bonus]).toBe(1)
    expect(playerScore(player)).toBe(card.points)
    for (const color of GEM_COLORS) {
      expect(result.state.bank[color]).toBe(bankBefore[color] + card.cost[color])
    }
    expect(checkInvariants(result.state)).toEqual([])
  })

  it('substitutes gold for missing gems', () => {
    let state = newGame(2)
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    state = placeInMarket(state, card)

    const draft = cloneState(state)
    draft.players[0].tokens[color] = card.cost[color] - 2
    draft.bank[color] -= card.cost[color] - 2
    draft.players[0].tokens.gold = 2
    draft.bank.gold -= 2

    const plan = calculatePurchaseCost(draft.players[0], card)
    expect(plan).not.toBeNull()
    expect(plan!.goldSpent).toBe(2)

    const result = applyAction(draft, 'p0', { type: 'PURCHASE', cardId: card.id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].tokens.gold).toBe(0)
    expect(result.state.bank.gold).toBe(GOLD_SUPPLY)
    expect(checkInvariants(result.state)).toEqual([])
  })

  it('rejects a purchase the player cannot afford', () => {
    const state = newGame(2)
    const cardId = state.market[3].visible[0]!
    const check = canPurchaseCard(state, 'p0', cardId)
    expect(check.ok).toBe(false)
    expect(applyAction(state, 'p0', { type: 'PURCHASE', cardId }).ok).toBe(false)
  })

  it('rejects a purchase of a card that is neither face up nor reserved', () => {
    const state = newGame(2)
    const hidden = state.market[1].deck[0]
    expect(canPurchaseCard(state, 'p0', hidden).ok).toBe(false)
  })

  it('rejects an explicit payment that overpays or underpays', () => {
    let state = newGame(2)
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    state = placeInMarket(state, card)
    const draft = cloneState(state)
    draft.players[0].tokens[color] = 4
    draft.bank[color] = 7 - 4
    draft.config.playerCount = 4
    for (const c of GEM_COLORS) if (c !== color) draft.bank[c] = 7

    const under = { ...emptyTokens(), [color]: card.cost[color] - 1 }
    expect(canPurchaseCard(draft, 'p0', card.id, under).ok).toBe(false)
    const over = { ...emptyTokens(), [color]: card.cost[color] + 1 }
    expect(canPurchaseCard(draft, 'p0', card.id, over).ok).toBe(false)
  })

  it('replenishes the market slot from the deck', () => {
    let state = newGame(2)
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    state = placeInMarket(state, card, 2)
    const draft = cloneState(state)
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    draft.players[0].tokens[color] = card.cost[color]
    draft.bank[color] -= card.cost[color]
    const nextUp = draft.market[1].deck[0]
    const deckBefore = draft.market[1].deck.length

    const result = applyAction(draft, 'p0', { type: 'PURCHASE', cardId: card.id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.market[1].visible[2]).toBe(nextUp)
    expect(result.state.market[1].deck).toHaveLength(deckBefore - 1)
  })

  it('leaves a slot empty once the deck is exhausted', () => {
    const draft = cloneState(newGame(2))
    const card = getCard(draft.market[1].visible[0]!)
    draft.market[1].deck = []
    for (const color of GEM_COLORS) {
      draft.players[0].tokens[color] = card.cost[color]
      draft.bank[color] -= card.cost[color]
    }
    const result = applyAction(draft, 'p0', { type: 'PURCHASE', cardId: card.id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.market[1].visible[0]).toBeNull()
  })
})

describe('affordability breakdown', () => {
  /** The readout the card and the purse bar both render from. */
  it('reports a card that is fully covered by tokens', () => {
    const draft = cloneState(newGame(2))
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    draft.players[0].tokens[color] = card.cost[color]

    const money = affordability(draft.players[0], card)
    expect(money.affordable).toBe(true)
    expect(money.shortTotal).toBe(0)
    expect(money.goldNeeded).toBe(0)
    expect(money.stillMissing).toBe(0)
    expect(money.paidByTokens[color]).toBe(card.cost[color])
  })

  it('counts the exact shortfall per colour', () => {
    const draft = cloneState(newGame(2))
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length >= 3)!
    const needed = GEM_COLORS.filter((g) => card.cost[g] > 0)
    // Pay for the first colour only.
    draft.players[0].tokens[needed[0]] = card.cost[needed[0]]

    const money = affordability(draft.players[0], card)
    expect(money.shortByColor[needed[0]]).toBe(0)
    for (const color of needed.slice(1)) {
      expect(money.shortByColor[color]).toBe(card.cost[color])
    }
    const expectedShort = needed.slice(1).reduce((sum, c) => sum + card.cost[c], 0)
    expect(money.shortTotal).toBe(expectedShort)
    expect(money.affordable).toBe(false)
    expect(money.stillMissing).toBe(expectedShort)
  })

  it('lets gold close the gap, and reports what is left when it cannot', () => {
    const draft = cloneState(newGame(2))
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    const need = card.cost[color]

    draft.players[0].tokens[color] = need - 2
    draft.players[0].tokens.gold = 2
    const covered = affordability(draft.players[0], card)
    expect(covered.goldNeeded).toBe(2)
    expect(covered.affordable).toBe(true)
    expect(covered.stillMissing).toBe(0)

    draft.players[0].tokens.gold = 1
    const uncovered = affordability(draft.players[0], card)
    expect(uncovered.goldNeeded).toBe(2)
    expect(uncovered.affordable).toBe(false)
    expect(uncovered.stillMissing).toBe(1)
  })

  it('applies permanent bonuses before anything else', () => {
    const draft = cloneState(newGame(2))
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    const bonusCards = ALL_CARDS.filter((c) => c.bonus === color).slice(0, card.cost[color])
    draft.players[0].purchased = bonusCards.map((c) => c.id)

    const money = affordability(draft.players[0], card)
    expect(money.effective[color]).toBe(0)
    expect(money.affordable).toBe(true)
    expect(money.shortTotal).toBe(0)
  })

  it('agrees with the engine about what can actually be bought', () => {
    // The card UI must never claim "can buy" where the rules disagree.
    let state = newGame(2)
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    state = placeInMarket(state, card)
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!

    for (let owned = 0; owned <= card.cost[color]; owned++) {
      const draft = cloneState(state)
      draft.players[0].tokens[color] = owned
      draft.bank[color] -= owned
      const money = affordability(draft.players[0], card)
      const engineSays = canPurchaseCard(draft, 'p0', card.id).ok
      expect(money.affordable).toBe(engineSays)
    }
  })
})

describe('reserving', () => {
  it('reserves a face-up card, replaces it, and grants gold', () => {
    const state = newGame(2)
    const cardId = state.market[2].visible[1]!
    const nextUp = state.market[2].deck[0]
    const result = applyAction(state, 'p0', { type: 'RESERVE_VISIBLE', cardId })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const player = result.state.players[0]
    expect(player.reserved).toEqual([cardId])
    expect(player.reservedHidden).toEqual([])
    expect(player.tokens.gold).toBe(1)
    expect(result.state.bank.gold).toBe(GOLD_SUPPLY - 1)
    expect(result.state.market[2].visible[1]).toBe(nextUp)
    expect(checkInvariants(result.state)).toEqual([])
  })

  it('reserves blind from the top of a deck and keeps it hidden from others', () => {
    const state = newGame(2)
    const topCard = state.market[3].deck[0]
    const result = applyAction(state, 'p0', { type: 'RESERVE_DECK', tier: 3 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const player = result.state.players[0]
    expect(player.reserved).toEqual([topCard])
    expect(player.reservedHidden).toEqual([topCard])

    const opponentView = redactFor(result.state, 'p1')
    const seen = opponentView.players.find((p) => p.id === 'p0')!
    expect(seen.reserved).toEqual([])
    expect(seen.hiddenReservedCount).toBe(1)

    const ownView = redactFor(result.state, 'p0')
    expect(ownView.players[0].reserved).toEqual([topCard])
  })

  it('caps reserves at three', () => {
    let state = newGame(1)
    for (let i = 0; i < 3; i++) {
      const result = applyAction(state, 'p0', { type: 'RESERVE_DECK', tier: 1 })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      // Hand the turn straight back to p0 for the next reserve.
      state = cloneState(result.state)
      state.currentPlayerIndex = 0
      state.phase = 'playing'
    }
    expect(state.players[0].reserved).toHaveLength(3)
    const check = canReserveVisible(state, 'p0', state.market[1].visible[0]!)
    expect(check.ok).toBe(false)
    if (check.ok) return
    expect(check.reason).toMatch(/already hold 3/)
    expect(canReserveDeck(state, 'p0', 2).ok).toBe(false)
  })

  it('reserves without gold when the gold supply is empty', () => {
    const draft = cloneState(newGame(2))
    draft.bank.gold = 0
    draft.players[1].tokens.gold = 5
    const result = applyAction(draft, 'p0', { type: 'RESERVE_VISIBLE', cardId: draft.market[1].visible[0]! })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].tokens.gold).toBe(0)
    expect(result.state.players[0].reserved).toHaveLength(1)
  })

  it('cannot reserve from an empty deck', () => {
    const draft = cloneState(newGame(2))
    draft.market[2].deck = []
    expect(canReserveDeck(draft, 'p0', 2).ok).toBe(false)
  })

  it('allows purchasing a reserved card', () => {
    const draft = cloneState(newGame(2))
    const card = CARDS_BY_TIER[1].find((c) => GEM_COLORS.filter((g) => c.cost[g] > 0).length === 1)!
    const color = GEM_COLORS.find((g) => card.cost[g] > 0)!
    // Pull it out of wherever it is and put it in hand.
    draft.market[1].deck = draft.market[1].deck.filter((id) => id !== card.id)
    const slot = draft.market[1].visible.indexOf(card.id)
    if (slot >= 0) draft.market[1].visible[slot] = draft.market[1].deck.shift() ?? null
    draft.players[0].reserved = [card.id]
    draft.players[0].tokens[color] = card.cost[color]
    draft.bank[color] -= card.cost[color]

    const result = applyAction(draft, 'p0', { type: 'PURCHASE', cardId: card.id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].reserved).toHaveLength(0)
    expect(result.state.players[0].purchased).toContain(card.id)
    expect(checkInvariants(result.state)).toEqual([])
  })
})

describe('token limit', () => {
  it('enters the discard phase when a turn ends above ten tokens', () => {
    const draft = cloneState(newGame(3))
    draft.players[0].tokens = { white: 3, blue: 3, green: 2, red: 0, black: 0, gold: 0 }
    for (const color of GEM_COLORS) draft.bank[color] -= draft.players[0].tokens[color]

    const result = applyAction(draft, 'p0', { type: 'TAKE_THREE', colors: ['red', 'black', 'white'] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe('discarding')
    expect(result.state.currentPlayerIndex).toBe(0)
    expect(excessTokens(result.state.players[0])).toBe(1)
  })

  it('requires returning exactly the excess and then continues the turn', () => {
    const draft = cloneState(newGame(3))
    draft.players[0].tokens = { white: 4, blue: 4, green: 3, red: 0, black: 0, gold: 0 }
    for (const color of GEM_COLORS) draft.bank[color] -= draft.players[0].tokens[color]
    draft.phase = 'discarding'

    const tooFew = applyAction(draft, 'p0', {
      type: 'DISCARD',
      tokens: { ...emptyTokens(), white: 0 },
    })
    expect(tooFew.ok).toBe(false)

    const tooMany = applyAction(draft, 'p0', {
      type: 'DISCARD',
      tokens: { ...emptyTokens(), white: 3 },
    })
    expect(tooMany.ok).toBe(false)

    const justRight = applyAction(draft, 'p0', {
      type: 'DISCARD',
      tokens: { ...emptyTokens(), white: 1 },
    })
    expect(justRight.ok).toBe(true)
    if (!justRight.ok) return
    expect(totalTokens(justRight.state.players[0].tokens)).toBe(10)
    expect(justRight.state.phase).toBe('playing')
    expect(justRight.state.currentPlayerIndex).toBe(1)
    expect(checkInvariants(justRight.state)).toEqual([])
  })

  it('cannot return tokens the player does not hold', () => {
    const draft = cloneState(newGame(3))
    draft.players[0].tokens = { white: 11, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
    draft.phase = 'discarding'
    const result = applyAction(draft, 'p0', { type: 'DISCARD', tokens: { ...emptyTokens(), blue: 1 } })
    expect(result.ok).toBe(false)
  })

  it('blocks main actions while a discard is owed', () => {
    const draft = cloneState(newGame(3))
    draft.phase = 'discarding'
    draft.players[0].tokens = { white: 11, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
    expect(applyAction(draft, 'p0', { type: 'TAKE_TWO', color: 'red' }).ok).toBe(false)
    expect(legalMainActions(draft, 'p0')).toEqual([])
  })
})

describe('patrons', () => {
  /** Gives p0 enough bonus cards to satisfy the given colour counts. */
  function grantBonuses(state: GameState, counts: Partial<Record<GemColor, number>>): GameState {
    const draft = cloneState(state)
    const used = new Set<string>()
    for (const [color, amount] of Object.entries(counts) as [GemColor, number][]) {
      const pool = ALL_CARDS.filter((c) => c.bonus === color && !used.has(c.id)).slice(0, amount)
      for (const card of pool) {
        used.add(card.id)
        draft.players[0].purchased.push(card.id)
        for (const tier of [1, 2, 3] as const) {
          draft.market[tier].deck = draft.market[tier].deck.filter((id) => id !== card.id)
          const idx = draft.market[tier].visible.indexOf(card.id)
          if (idx >= 0) draft.market[tier].visible[idx] = draft.market[tier].deck.shift() ?? null
        }
      }
    }
    return draft
  }

  it('awards a single qualifying patron automatically at end of turn', () => {
    const base = newGame(2)
    const patron = ALL_PATRONS.find((p) => p.id === 'p-archivist')!
    const draft = cloneState(grantBonuses(base, { white: 4, blue: 3 }))
    draft.patrons = [patron.id]
    draft.availablePatrons = [patron.id]

    // Not yet qualified: only 3 blue.
    let result = applyAction(draft, 'p0', { type: 'TAKE_THREE', colors: ['white', 'blue', 'green'] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].patrons).toHaveLength(0)

    const qualified = grantBonuses(draft, { blue: 1 })
    result = applyAction(qualified, 'p0', { type: 'TAKE_THREE', colors: ['white', 'blue', 'green'] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].patrons).toEqual([patron.id])
    expect(result.state.availablePatrons).toEqual([])
    expect(playerScore(result.state.players[0])).toBeGreaterThanOrEqual(3)
  })

  it('does not count tokens toward patron requirements', () => {
    const draft = cloneState(newGame(2))
    draft.patrons = ['p-archivist']
    draft.availablePatrons = ['p-archivist']
    draft.players[0].tokens = { white: 4, blue: 4, green: 0, red: 0, black: 0, gold: 0 }
    for (const color of GEM_COLORS) draft.bank[color] -= draft.players[0].tokens[color]
    draft.phase = 'discarding'
    const result = applyAction(draft, 'p0', {
      type: 'DISCARD',
      tokens: { ...emptyTokens(), white: 0 },
    })
    // At 8 tokens nothing is owed, so returning zero is the valid move.
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.players[0].patrons).toHaveLength(0)
  })

  it('asks the player to choose when several patrons qualify, and awards only one', () => {
    const base = newGame(2)
    const draft = cloneState(grantBonuses(base, { white: 4, blue: 4, green: 4 }))
    draft.patrons = ['p-archivist', 'p-cartographer']
    draft.availablePatrons = ['p-archivist', 'p-cartographer']

    const result = applyAction(draft, 'p0', { type: 'TAKE_TWO', color: 'red' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe('choosing-patron')
    expect(result.state.currentPlayerIndex).toBe(0)

    const chosen = applyAction(result.state, 'p0', {
      type: 'CHOOSE_PATRON',
      patronId: 'p-cartographer',
    })
    expect(chosen.ok).toBe(true)
    if (!chosen.ok) return
    expect(chosen.state.players[0].patrons).toEqual(['p-cartographer'])
    expect(chosen.state.availablePatrons).toEqual(['p-archivist'])
    expect(chosen.state.currentPlayerIndex).toBe(1)
    expect(checkInvariants(chosen.state)).toEqual([])
  })

  it('rejects choosing a patron the player does not qualify for', () => {
    const base = newGame(2)
    const draft = cloneState(grantBonuses(base, { white: 4, blue: 4, green: 4 }))
    draft.patrons = ['p-archivist', 'p-cartographer', 'p-alchemist']
    draft.availablePatrons = ['p-archivist', 'p-cartographer', 'p-alchemist']
    draft.phase = 'choosing-patron'
    const bad = applyAction(draft, 'p0', { type: 'CHOOSE_PATRON', patronId: 'p-alchemist' })
    expect(bad.ok).toBe(false)
  })
})

describe('end game', () => {
  it('triggers the final round and gives everyone equal turns', () => {
    const draft = cloneState(newGame(2))
    // p0 is one 1-point card away from 15.
    const scoring = CARDS_BY_TIER[3].filter((c) => c.points >= 3).slice(0, 4)
    draft.players[0].purchased = scoring.map((c) => c.id)
    for (const card of scoring) {
      draft.market[3].deck = draft.market[3].deck.filter((id) => id !== card.id)
      const idx = draft.market[3].visible.indexOf(card.id)
      if (idx >= 0) draft.market[3].visible[idx] = draft.market[3].deck.shift() ?? null
    }
    expect(playerScore(draft.players[0])).toBeGreaterThanOrEqual(15)

    const afterP0 = applyAction(draft, 'p0', { type: 'TAKE_TWO', color: 'red' })
    expect(afterP0.ok).toBe(true)
    if (!afterP0.ok) return
    expect(afterP0.state.phase).toBe('final-round')
    expect(afterP0.state.endTriggeredByIndex).toBe(0)
    expect(afterP0.state.currentPlayerIndex).toBe(1)

    const afterP1 = applyAction(afterP0.state, 'p1', { type: 'TAKE_TWO', color: 'blue' })
    expect(afterP1.ok).toBe(true)
    if (!afterP1.ok) return
    expect(afterP1.state.phase).toBe('final-round')

    const afterP2 = applyAction(afterP1.state, 'p2', { type: 'TAKE_TWO', color: 'green' })
    expect(afterP2.ok).toBe(true)
    if (!afterP2.ok) return
    expect(afterP2.state.phase).toBe('finished')
    expect(afterP2.state.winnerIds).toEqual(['p0'])
    // Equal turns: three players, three turns.
    expect(afterP2.state.turnCount).toBe(3)
  })

  it('rejects every action once finished', () => {
    const draft = cloneState(newGame(2))
    draft.phase = 'finished'
    expect(applyAction(draft, 'p0', { type: 'TAKE_TWO', color: 'red' }).ok).toBe(false)
    expect(legalMainActions(draft, 'p0')).toEqual([])
  })

  it('breaks ties in favour of fewer purchased cards', () => {
    const threePointers = CARDS_BY_TIER[3].filter((c) => c.points === 3).slice(0, 2)
    const onePointers = ALL_CARDS.filter((c) => c.points === 1).slice(0, 6)
    const base = newGame(2)
    const draft = cloneState(base)
    // Both on 6 points; p1 needed six cards, p0 needed two.
    draft.players[0].purchased = threePointers.map((c) => c.id)
    draft.players[1].purchased = onePointers.map((c) => c.id)
    draft.players[2].purchased = []
    expect(playerScore(draft.players[0])).toBe(6)
    expect(playerScore(draft.players[1])).toBe(6)
    expect(determineWinners(draft.players)).toEqual(['p0'])
  })

  it('reports a shared win when score and card count both tie', () => {
    const cards = CARDS_BY_TIER[3].filter((c) => c.points === 3).slice(0, 2)
    const draft = cloneState(newGame(1))
    draft.players[0].purchased = [cards[0].id]
    draft.players[1].purchased = [cards[1].id]
    expect(determineWinners(draft.players).sort()).toEqual(['p0', 'p1'])
  })

  it('summarises the finished game', () => {
    const draft = cloneState(newGame(2))
    draft.players[0].purchased = CARDS_BY_TIER[3].filter((c) => c.points >= 4).slice(0, 3).map((c) => c.id)
    draft.players[0].patrons = ['p-archivist']
    draft.availablePatrons = draft.availablePatrons.filter((id) => id !== 'p-archivist')
    draft.patrons = [...draft.availablePatrons, 'p-archivist']
    draft.phase = 'finished'
    draft.winnerIds = ['p0']
    draft.round = 9
    draft.turnCount = 24

    const summary = summariseGame(draft)
    expect(summary.winnerIds).toEqual(['p0'])
    expect(summary.rounds).toBe(8)
    expect(summary.turns).toBe(24)
    expect(summary.players[0].playerId).toBe('p0')
    expect(summary.players[0].isWinner).toBe(true)
    expect(summary.players[0].patronPoints).toBe(3)
    expect(summary.players[0].cardsPurchased).toBe(3)
  })
})

describe('serialization and redaction', () => {
  it('round-trips a state losslessly', () => {
    const state = newGame(3, 99)
    const restored = deserializeState(serializeState(state))
    expect(restored).not.toBeNull()
    expect(serializeState(restored!)).toBe(serializeState(state))
  })

  it('rejects corrupt or foreign saves', () => {
    expect(deserializeState('not json')).toBeNull()
    expect(deserializeState('{}')).toBeNull()
    const bad = cloneState(newGame(1))
    bad.version = 999
    expect(deserializeState(serializeState(bad))).toBeNull()
    const unknownCard = cloneState(newGame(1))
    unknownCard.market[1].visible[0] = 'no-such-card'
    expect(deserializeState(serializeState(unknownCard))).toBeNull()
  })

  it('never leaks deck contents into a redacted view', () => {
    const state = newGame(3)
    const view = redactFor(state, 'p0')
    const serialized = JSON.stringify(view)
    for (const id of state.market[3].deck) {
      expect(serialized).not.toContain(`"${id}"`)
    }
    expect(view.market[3].deckCount).toBe(state.market[3].deck.length)
  })
})
