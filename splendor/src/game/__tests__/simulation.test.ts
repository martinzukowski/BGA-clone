/**
 * Randomized full-game simulations.
 *
 * These are the tests that actually protect the rules: they play complete games
 * bot-against-bot and re-check every conservation invariant after EVERY ply, so
 * any rule that leaks a token, duplicates a card or lets a player act out of
 * turn shows up as a hard failure with a reproducible seed.
 */
import { describe, expect, it } from 'vitest'
import { createGame, type BotConfig } from '@/game/engine/setup'
import { applyAction, legalMainActions } from '@/game/engine/actions'
import { checkInvariants, redactFor } from '@/game/engine/gameState'
import { validateAction } from '@/game/engine/validation'
import { playerScore, totalTokens } from '@/game/engine/rules'
import { summariseGame } from '@/game/engine/scoring'
import { autoResolvePending, chooseAction } from '@/game/ai'
import { RngStream } from '@/utils/rng'
import type { Difficulty, GameState } from '@/game/engine/types'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

interface SimResult {
  state: GameState
  plies: number
  problems: string[]
}

/** Hard bots are much slower, so simulations dial their search down. */
const FAST_HARD = { candidates: 4, rollouts: 2, depthRounds: 2, staticBlend: 0.5 }

/** Plays one game to completion, auditing every step. */
function simulate(seed: number, bots: BotConfig[], maxPlies = 600): SimResult {
  let state = createGame({ seed, bots })
  const rng = new RngStream(seed ^ 0x9e3779b9)
  const problems: string[] = []
  let plies = 0

  const audit = (label: string) => {
    for (const violation of checkInvariants(state)) {
      problems.push(`[seed ${seed}] ${label}: ${violation.rule} - ${violation.detail}`)
    }
  }
  audit('setup')

  while (state.phase !== 'finished' && plies < maxPlies) {
    const player = state.players[state.currentPlayerIndex]
    const difficulty: Difficulty = player.difficulty ?? 'medium'

    const view = redactFor(state, player.id)
    const action = chooseAction(view, player.id, difficulty, rng, { hard: FAST_HARD })
    if (!action) {
      problems.push(`[seed ${seed}] ${player.id} had no legal action in phase ${state.phase}`)
      break
    }

    // The AI must never propose something the rules reject.
    const validity = validateAction(state, player.id, action)
    if (!validity.ok) {
      problems.push(`[seed ${seed}] illegal ${JSON.stringify(action)}: ${validity.reason}`)
      break
    }

    // Reserving must pay a gold wild whenever the supply has one. This is the
    // single rule a player is most likely to think has silently misfired, so it
    // is asserted on every reserve in every simulated game rather than just in
    // a unit test.
    const goldInBank = state.bank.gold
    const goldHeld = state.players.find((p) => p.id === player.id)!.tokens.gold
    const logBefore = state.log.length

    const result = applyAction(state, player.id, action)
    if (!result.ok) {
      problems.push(`[seed ${seed}] engine rejected ${JSON.stringify(action)}: ${result.reason}`)
      break
    }
    state = result.state

    if (action.type === 'RESERVE_VISIBLE' || action.type === 'RESERVE_DECK') {
      const after = state.players.find((p) => p.id === player.id)!
      const expected = goldInBank > 0 ? goldHeld + 1 : goldHeld
      if (after.tokens.gold !== expected) {
        problems.push(
          `[seed ${seed}] ${player.id} reserved with ${goldInBank} gold in the bank: ` +
            `held ${goldHeld} -> ${after.tokens.gold}, expected ${expected}`,
        )
      }
      if (state.bank.gold !== Math.max(0, goldInBank - 1)) {
        problems.push(
          `[seed ${seed}] bank gold went ${goldInBank} -> ${state.bank.gold} on a reserve`,
        )
      }
      // The log must agree with what actually happened, or players are misled.
      // The reserve line is the FIRST entry the action added - resolveTurnEnd
      // can append a patron award or a game-over line after it.
      const line = state.log[logBefore]?.text ?? ''
      const claimsGold = line.includes('took a Gold')
      if (claimsGold !== goldInBank > 0) {
        problems.push(`[seed ${seed}] log "${line}" disagrees with bank gold ${goldInBank}`)
      }
    }
    audit(`after ${action.type}`)

    state = autoResolvePending(state)
    audit(`after resolving ${action.type}`)

    // Nobody may ever be left holding more than the limit outside a discard.
    for (const p of state.players) {
      if (state.phase !== 'discarding' && totalTokens(p.tokens) > state.config.tokenLimit) {
        problems.push(`[seed ${seed}] ${p.id} holds ${totalTokens(p.tokens)} tokens`)
      }
    }
    plies += 1
  }

  return { state, plies, problems }
}

describe('full-game simulations', () => {
  it(
    'plays 300 complete games with no illegal action and no broken invariant',
    () => {
      const problems: string[] = []
      let finished = 0
      let totalPlies = 0

      for (let seed = 1; seed <= 300; seed++) {
        const botCount = 1 + (seed % 3)
        const difficulty: Difficulty = seed % 2 === 0 ? 'easy' : 'medium'
        const bots: BotConfig[] = Array.from({ length: botCount }, (_, i) => ({
          name: `Bot ${i + 1}`,
          // Mix difficulties within a table to exercise the per-seat design.
          difficulty: i === 0 ? difficulty : seed % 3 === 0 ? 'easy' : 'medium',
        }))

        const sim = simulate(seed, bots)
        problems.push(...sim.problems)
        totalPlies += sim.plies

        if (sim.state.phase === 'finished') {
          finished += 1
        } else {
          problems.push(`[seed ${seed}] did not terminate within 600 plies`)
        }
      }

      expect(problems.slice(0, 10)).toEqual([])
      expect(finished).toBe(300)
      // Sanity on pacing: a game should take tens of turns, not hundreds.
      expect(totalPlies / 300).toBeGreaterThan(15)
      expect(totalPlies / 300).toBeLessThan(200)
    },
    180_000,
  )

  it(
    'plays hard-bot games cleanly too',
    () => {
      const problems: string[] = []
      for (let seed = 900; seed < 920; seed++) {
        const sim = simulate(seed, [
          { name: 'H1', difficulty: 'hard' },
          { name: 'H2', difficulty: 'hard' },
        ])
        problems.push(...sim.problems)
        expect(sim.state.phase).toBe('finished')
      }
      expect(problems.slice(0, 10)).toEqual([])
    },
    180_000,
  )

  it(
    'ends every game with a consistent, well-formed result',
    () => {
      for (let seed = 500; seed < 540; seed++) {
        const sim = simulate(seed, [
          { name: 'A', difficulty: 'medium' },
          { name: 'B', difficulty: 'medium' },
          { name: 'C', difficulty: 'easy' },
        ])
        const state = sim.state
        expect(state.phase).toBe('finished')

        // A winner exists, and their score is the maximum.
        expect(state.winnerIds.length).toBeGreaterThan(0)
        const scores = state.players.map(playerScore)
        const best = Math.max(...scores)
        for (const id of state.winnerIds) {
          const player = state.players.find((p) => p.id === id)!
          expect(playerScore(player)).toBe(best)
        }
        // Somebody must have reached the threshold for the game to have ended.
        expect(best).toBeGreaterThanOrEqual(state.config.winningScore)

        // No further action is possible.
        expect(legalMainActions(state, state.players[0].id)).toEqual([])

        // The summary agrees with the raw state, card for card and point for point.
        const summary = summariseGame(state)
        expect(summary.winnerIds).toEqual(state.winnerIds)
        for (const row of summary.players) {
          const player = state.players.find((p) => p.id === row.playerId)!
          const cardPoints = player.purchased.reduce((sum, id) => sum + getCard(id).points, 0)
          const patronPoints = player.patrons.reduce((sum, id) => sum + getPatron(id).points, 0)
          expect(row.cardPoints).toBe(cardPoints)
          expect(row.patronPoints).toBe(patronPoints)
          expect(row.score).toBe(cardPoints + patronPoints)
          expect(row.cardsPurchased).toBe(player.purchased.length)
          expect(row.patronsAcquired).toHaveLength(player.patrons.length)
        }
        // Patrons are never handed out twice.
        const allPatrons = state.players.flatMap((p) => p.patrons)
        expect(new Set(allPatrons).size).toBe(allPatrons.length)
      }
    },
    180_000,
  )

  it('is fully reproducible from a seed', () => {
    const bots: BotConfig[] = [
      { name: 'A', difficulty: 'medium' },
      { name: 'B', difficulty: 'easy' },
    ]
    const a = simulate(77, bots)
    const b = simulate(77, bots)
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state))
  })
})

describe('difficulty ladder', () => {
  /**
   * A statistical, not deterministic, assertion: the stronger bot must beat the
   * weaker one clearly over many games. Thresholds are set well below the
   * measured rates so ordinary tuning does not make the suite flaky.
   */
  function headToHead(strong: Difficulty, weak: Difficulty, games: number, seedBase: number) {
    let strongWins = 0
    let decided = 0
    for (let i = 0; i < games; i++) {
      // Alternate seating so turn order cannot explain the result.
      const strongFirst = i % 2 === 0
      const bots: BotConfig[] = strongFirst
        ? [
            { name: 'S', difficulty: strong },
            { name: 'W', difficulty: weak },
          ]
        : [
            { name: 'W', difficulty: weak },
            { name: 'S', difficulty: strong },
          ]
      const sim = simulate(seedBase + i, bots)
      if (sim.state.phase !== 'finished') continue
      // Seat 0 is the (unused) human seat; it is driven as a medium bot by
      // `simulate`, so only compare the two bot seats.
      const s = sim.state.players.find((p) => p.name === 'S')!
      const w = sim.state.players.find((p) => p.name === 'W')!
      const sScore = playerScore(s)
      const wScore = playerScore(w)
      if (sScore === wScore) continue
      decided += 1
      if (sScore > wScore) strongWins += 1
    }
    return decided === 0 ? 0 : strongWins / decided
  }

  it(
    'medium outperforms easy by a wide margin',
    () => {
      // Measured at ~97%.
      const rate = headToHead('medium', 'easy', 60, 2000)
      expect(rate).toBeGreaterThan(0.8)
    },
    180_000,
  )

  it(
    'hard outperforms easy, and is at least a match for medium',
    () => {
      // Measured with this reduced search: 100% vs easy, 71% vs medium.
      // Thresholds sit well below that so tuning does not make this flaky.
      expect(headToHead('hard', 'easy', 24, 3000)).toBeGreaterThan(0.8)
      expect(headToHead('hard', 'medium', 30, 4000)).toBeGreaterThan(0.55)
    },
    300_000,
  )
})
