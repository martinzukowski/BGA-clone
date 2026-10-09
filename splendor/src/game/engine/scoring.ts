/**
 * Scoring and end-of-game reporting. Pure derivations over GameState.
 */
import type { GameState, GemCount, PlayerState } from './types'
import { determineWinners, playerBonuses, playerScore, purchasedCount } from './rules'
import { getCard } from '@/game/data/cards'
import { getPatron } from '@/game/data/nobles'

export interface PlayerSummary {
  playerId: string
  name: string
  isBot: boolean
  difficulty: string | null
  score: number
  cardPoints: number
  patronPoints: number
  cardsPurchased: number
  patronsAcquired: string[]
  bonuses: GemCount
  isWinner: boolean
}

export interface GameSummary {
  winnerIds: string[]
  rounds: number
  turns: number
  players: PlayerSummary[]
}

export function summarisePlayer(player: PlayerState, winnerIds: string[]): PlayerSummary {
  const cardPoints = player.purchased.reduce((sum, id) => sum + getCard(id).points, 0)
  const patronPoints = player.patrons.reduce((sum, id) => sum + getPatron(id).points, 0)
  return {
    playerId: player.id,
    name: player.name,
    isBot: player.isBot,
    difficulty: player.difficulty,
    score: cardPoints + patronPoints,
    cardPoints,
    patronPoints,
    cardsPurchased: purchasedCount(player),
    patronsAcquired: player.patrons.map((id) => getPatron(id).name),
    bonuses: playerBonuses(player),
    isWinner: winnerIds.includes(player.id),
  }
}

export function summariseGame(state: GameState): GameSummary {
  const winnerIds = state.winnerIds.length > 0 ? state.winnerIds : determineWinners(state.players)
  const players = state.players
    .map((p) => summarisePlayer(p, winnerIds))
    // Leaderboard order: score desc, then fewer cards (the tie-break) asc.
    .sort((a, b) => b.score - a.score || a.cardsPurchased - b.cardsPurchased)
  return {
    winnerIds,
    // `round` has already been incremented past the last completed round.
    rounds: Math.max(1, state.round - 1),
    turns: state.turnCount,
    players,
  }
}

export { playerScore, playerBonuses }
