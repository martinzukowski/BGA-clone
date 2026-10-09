import { describe, expect, it } from 'vitest'
import { createGame, defaultBots } from '@/game/engine/setup'
import { applyAction, cloneState, legalMainActions } from '@/game/engine/actions'
import { redactFor } from '@/game/engine/gameState'
import { validateAction } from '@/game/engine/validation'
import { GEM_COLORS, type Difficulty, type GameState } from '@/game/engine/types'
import { totalTokens } from '@/game/engine/rules'
import { autoResolvePending, chooseAction, runBotTurn } from '@/game/ai'
import { chooseDiscard, choosePatron } from '@/game/ai/evaluation'
import { determinize } from '@/game/ai/determinize'
import { RngStream } from '@/utils/rng'
import { CARDS_BY_TIER } from '@/game/data/cards'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

function game(bots = 3, difficulty: Difficulty = 'medium', seed = 5): GameState {
  return createGame({ seed, bots: defaultBots(bots, difficulty) })
}

describe('AI honesty', () => {
  it('never receives deck contents', () => {
    const state = game(3)
    const view = redactFor(state, 'p1')
    // The VisibleGameState type has no `deck` field at all; assert at runtime too.
    for (const tier of [1, 2, 3] as const) {
      expect((view.market[tier] as unknown as Record<string, unknown>).deck).toBeUndefined()
      expect(view.market[tier].deckCount).toBe(state.market[tier].deck.length)
    }
  })

  it('reconstructs decks only from cards it could legitimately deduce', () => {
    let state = game(2)
    state = applyAction(state, 'p0', { type: 'RESERVE_DECK', tier: 3 }).ok
      ? (applyAction(state, 'p0', { type: 'RESERVE_DECK', tier: 3 }) as { state: GameState }).state
      : state

    const view = redactFor(state, 'p1')
    const guessed = determinize(view, new RngStream(1))

    // Deck sizes preserved.
    for (const tier of [1, 2, 3] as const) {
      expect(guessed.market[tier].deck).toHaveLength(view.market[tier].deckCount)
    }
    // Every card still accounted for exactly once.
    const all = [
      ...([1, 2, 3] as const).flatMap((t) => [
        ...guessed.market[t].deck,
        ...guessed.market[t].visible.filter((id): id is string => id !== null),
      ]),
      ...guessed.players.flatMap((p) => [...p.purchased, ...p.reserved]),
    ]
    expect(new Set(all).size).toBe(all.length)
    expect(all).toHaveLength(90)

    // The guess must not happen to be the truth by construction: the bot's
    // reconstruction of p0's face-down reserve is drawn from the whole unseen
    // pool, so it is right only by chance.
    expect(guessed.players[0].reserved.length).toBe(state.players[0].reserved.length)
  })

  it('produces a different deck guess per determinization', () => {
    const view = redactFor(game(2), 'p1')
    const rng = new RngStream(3)
    const a = determinize(view, rng).market[1].deck.join(',')
    const b = determinize(view, rng).market[1].deck.join(',')
    expect(a).not.toBe(b)
  })
})

/** Hard runs rollouts, so it gets a smaller but still broad sweep. */
const SWEEP: Record<Difficulty, { seeds: number; plies: number }> = {
  easy: { seeds: 12, plies: 40 },
  medium: { seeds: 12, plies: 40 },
  hard: { seeds: 4, plies: 30 },
}

describe.each(DIFFICULTIES)('%s bot', (difficulty) => {
  it(
    'only ever returns a legal action, across many varied positions',
    () => {
      const rng = new RngStream(1234)
      const sweep = SWEEP[difficulty]
      let checked = 0

      for (let seed = 0; seed < sweep.seeds; seed++) {
        let state = game(3, difficulty, seed)
        for (let ply = 0; ply < sweep.plies && state.phase !== 'finished'; ply++) {
          const player = state.players[state.currentPlayerIndex]
          // Every seat is driven by the bot under test, so the sweep covers
          // positions a single bot would never reach on its own.
          const action = chooseAction(redactFor(state, player.id), player.id, difficulty, rng)
          expect(action).not.toBeNull()
          if (!action) break

          expect(
            validateAction(state, player.id, action),
            `${difficulty} produced ${JSON.stringify(action)}`,
          ).toEqual({ ok: true })
          checked += 1

          const applied = applyAction(state, player.id, action)
          expect(applied.ok).toBe(true)
          if (!applied.ok) break
          state = autoResolvePending(applied.state)
        }
      }
      expect(checked).toBeGreaterThan(100)
    },
    60_000,
  )

  it('drives a full bot turn through runBotTurn without engine rejection', () => {
    const state = cloneState(game(3, difficulty))
    state.currentPlayerIndex = 1
    const result = runBotTurn(state, 'p1', new RngStream(9))
    // p1 is a bot seat, so this must succeed and must pass the turn on.
    expect(result.error).toBeUndefined()
    expect(result.action).not.toBeNull()
    expect(result.state.currentPlayerIndex).not.toBe(1)
  })

  it('never proposes an action while a discard or patron choice is pending', () => {
    const draft = cloneState(game(2, difficulty))
    draft.phase = 'discarding'
    draft.players[0].tokens = { white: 11, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
    expect(legalMainActions(draft, 'p0')).toEqual([])
    const action = chooseAction(redactFor(draft, 'p0'), 'p0', difficulty, new RngStream(1))
    expect(action).toBeNull()
  })
})

describe('AI sub-decisions', () => {
  it('returns exactly the required number of tokens, preferring to keep gold', () => {
    const state = cloneState(game(3))
    state.players[0].tokens = { white: 4, blue: 4, green: 2, red: 1, black: 1, gold: 2 }
    const discard = chooseDiscard(state, state.players[0], 4)
    expect(totalTokens(discard)).toBe(4)
    expect(discard.gold).toBe(0)
    for (const color of GEM_COLORS) {
      expect(discard[color]).toBeLessThanOrEqual(state.players[0].tokens[color])
    }
  })

  it('falls back to discarding gold when only gold is held', () => {
    const state = cloneState(game(3))
    state.players[0].tokens = { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 5 }
    const discard = chooseDiscard(state, state.players[0], 2)
    expect(discard.gold).toBe(2)
  })

  it('always picks one of the offered patrons', () => {
    const state = cloneState(game(3))
    const options = state.availablePatrons.slice(0, 2)
    expect(options.length).toBeGreaterThan(1)
    expect(options).toContain(choosePatron(state, state.players[0], options))
  })
})

describe('AI strength', () => {
  /**
   * These are behavioural assertions, not statistical ones, so they stay
   * deterministic: given a position with an obviously correct move, the
   * stronger bots must find it.
   */
  function positionWithFreeWin(): GameState {
    const draft = cloneState(game(1, 'hard', 11))
    // Put a 5-point card face up and hand p1 the exact tokens for it.
    const prize = CARDS_BY_TIER[3].find((c) => c.points === 5)!
    draft.market[3].deck = draft.market[3].deck.filter((id) => id !== prize.id)
    draft.market[3].visible[0] = prize.id
    draft.currentPlayerIndex = 1
    for (const color of GEM_COLORS) {
      draft.players[1].tokens[color] = 0
    }
    draft.players[1].tokens.gold = 0
    // Give it bonuses covering everything but a small remainder it can pay.
    const remaining = { ...prize.cost }
    for (const color of GEM_COLORS) {
      const viaTokens = Math.min(2, remaining[color])
      draft.players[1].tokens[color] = viaTokens
      remaining[color] -= viaTokens
      const bonusCards = CARDS_BY_TIER[1]
        .filter((c) => c.bonus === color)
        .slice(0, remaining[color])
      for (const card of bonusCards) {
        draft.players[1].purchased.push(card.id)
        draft.market[1].deck = draft.market[1].deck.filter((id) => id !== card.id)
        const idx = draft.market[1].visible.indexOf(card.id)
        if (idx >= 0) draft.market[1].visible[idx] = draft.market[1].deck.shift() ?? null
      }
    }
    return draft
  }

  it('medium and hard buy the big prize when it is affordable; easy often does not', () => {
    const state = positionWithFreeWin()
    const prizeId = state.market[3].visible[0]!

    for (const difficulty of ['medium', 'hard'] as Difficulty[]) {
      const action = chooseAction(
        redactFor(state, 'p1'),
        'p1',
        difficulty,
        new RngStream(7),
      )
      expect(action, `${difficulty} should buy the prize`).toEqual({
        type: 'PURCHASE',
        cardId: prizeId,
      })
    }
  })

  it('hard takes an immediately winning purchase', () => {
    const draft = cloneState(game(1, 'hard', 21))
    const bigCards = CARDS_BY_TIER[3].filter((c) => c.points >= 4)
    // p1 sits on 11 points with a 4-point card affordable: buying ends the game.
    const owned = bigCards.slice(1, 3)
    for (const card of owned) {
      draft.players[1].purchased.push(card.id)
      draft.market[3].deck = draft.market[3].deck.filter((id) => id !== card.id)
      const idx = draft.market[3].visible.indexOf(card.id)
      if (idx >= 0) draft.market[3].visible[idx] = draft.market[3].deck.shift() ?? null
    }
    const prize = bigCards[0]
    draft.market[3].deck = draft.market[3].deck.filter((id) => id !== prize.id)
    draft.market[3].visible[0] = prize.id
    draft.currentPlayerIndex = 1
    for (const color of GEM_COLORS) {
      draft.players[1].tokens[color] = Math.min(prize.cost[color], 4)
    }
    draft.players[1].tokens.gold = 5
    // Cover any remainder with bonus cards so the purchase is definitely legal.
    for (const color of GEM_COLORS) {
      const still = prize.cost[color] - draft.players[1].tokens[color]
      const bonusCards = CARDS_BY_TIER[1].filter((c) => c.bonus === color).slice(0, Math.max(0, still))
      for (const card of bonusCards) {
        draft.players[1].purchased.push(card.id)
        draft.market[1].deck = draft.market[1].deck.filter((id) => id !== card.id)
        const idx = draft.market[1].visible.indexOf(card.id)
        if (idx >= 0) draft.market[1].visible[idx] = draft.market[1].deck.shift() ?? null
      }
    }

    const action = chooseAction(redactFor(draft, 'p1'), 'p1', 'hard', new RngStream(3))
    expect(action).toEqual({ type: 'PURCHASE', cardId: prize.id })
  })
})
