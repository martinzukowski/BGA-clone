/**
 * Game construction. Pure and deterministic: the same `GameSetupOptions`
 * (including seed) always produce a byte-identical GameState.
 */
import type {
  Difficulty,
  GameConfig,
  GameState,
  MarketTier,
  PlayerState,
  Tier,
  TokenPool,
} from './types'
import {
  emptyTokens,
  GOLD_SUPPLY,
  MARKET_SIZE,
  patronCount,
  RESERVE_LIMIT,
  STATE_VERSION,
  TIERS,
  TOKEN_LIMIT,
  tokensPerColor,
  WINNING_SCORE,
} from './rules'
import { CARDS_BY_TIER } from '@/game/data/cards'
import { ALL_PATRONS } from '@/game/data/nobles'
import { createRng, shuffle } from '@/utils/rng'
import { GEM_COLORS } from './types'

export interface BotConfig {
  name: string
  difficulty: Difficulty
}

export interface GameSetupOptions {
  seed: number
  humanName?: string
  /** One entry per bot. Length 1-3 in this build; the engine tolerates 0-3. */
  bots: BotConfig[]
}

/** Original bot personas. Difficulty is per-bot so mixed tables work later. */
export const BOT_NAMES = ['Vex Calloway', 'Ilma Brandt', 'Ordo Quill']

export function defaultBots(count: number, difficulty: Difficulty): BotConfig[] {
  return BOT_NAMES.slice(0, count).map((name) => ({ name, difficulty }))
}

function makeBank(playerCount: number): TokenPool {
  const per = tokensPerColor(playerCount)
  const bank = emptyTokens()
  for (const color of GEM_COLORS) bank[color] = per
  bank.gold = GOLD_SUPPLY
  return bank
}

function makePlayer(
  id: string,
  name: string,
  difficulty: Difficulty | null,
): PlayerState {
  return {
    id,
    name,
    difficulty,
    isBot: difficulty !== null,
    tokens: emptyTokens(),
    purchased: [],
    reserved: [],
    reservedHidden: [],
    patrons: [],
  }
}

export function createGame(options: GameSetupOptions): GameState {
  const bots = options.bots.slice(0, 3)
  const playerCount = bots.length + 1
  let rng = createRng(options.seed)

  const players: PlayerState[] = [
    makePlayer('p0', options.humanName?.trim() || 'You', null),
    ...bots.map((bot, i) => makePlayer(`p${i + 1}`, bot.name, bot.difficulty)),
  ]

  const market = {} as Record<Tier, MarketTier>
  for (const tier of TIERS) {
    const shuffled = shuffle(
      CARDS_BY_TIER[tier].map((c) => c.id),
      rng,
    )
    rng = shuffled.rng
    const deck = shuffled.items
    const visible: (string | null)[] = []
    for (let i = 0; i < MARKET_SIZE; i++) {
      visible.push(deck.length > 0 ? (deck.shift() as string) : null)
    }
    market[tier] = { deck, visible }
  }

  const shuffledPatrons = shuffle(
    ALL_PATRONS.map((p) => p.id),
    rng,
  )
  rng = shuffledPatrons.rng
  const patrons = shuffledPatrons.items.slice(0, patronCount(playerCount))

  const config: GameConfig = {
    playerCount,
    winningScore: WINNING_SCORE,
    tokenLimit: TOKEN_LIMIT,
    reserveLimit: RESERVE_LIMIT,
  }

  return {
    version: STATE_VERSION,
    config,
    rng,
    players,
    currentPlayerIndex: 0,
    round: 1,
    turnCount: 0,
    phase: 'playing',
    bank: makeBank(playerCount),
    market,
    patrons,
    availablePatrons: [...patrons],
    endTriggeredByIndex: null,
    winnerIds: [],
    log: [
      {
        id: 0,
        playerId: 'system',
        kind: 'system',
        text: `New game: ${playerCount} players, seed ${options.seed}.`,
      },
    ],
  }
}
