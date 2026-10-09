import type { Difficulty } from '@/game/engine/types'

export interface UiSettings {
  /** 1-3 bots. */
  opponents: number
  /**
   * Difficulty applied to every bot when starting a game.
   * Per-seat difficulty is already supported by the engine (`BotConfig`), so a
   * future "mixed table" setting only needs UI, not new plumbing.
   */
  difficulty: Difficulty
  /** Skip the deliberate bot-thinking pause. */
  fastAi: boolean
  playerName: string
}

export const DEFAULT_SETTINGS: UiSettings = {
  opponents: 2,
  difficulty: 'medium',
  fastAi: false,
  playerName: 'You',
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/** Coerces anything read back from storage or a URL into valid settings. */
export function normaliseSettings(raw: unknown): UiSettings {
  const input = (raw ?? {}) as Partial<UiSettings>
  const opponents = Number(input.opponents)
  return {
    opponents: opponents >= 1 && opponents <= 3 ? Math.floor(opponents) : DEFAULT_SETTINGS.opponents,
    difficulty: DIFFICULTIES.includes(input.difficulty as Difficulty)
      ? (input.difficulty as Difficulty)
      : DEFAULT_SETTINGS.difficulty,
    fastAi: Boolean(input.fastAi),
    playerName:
      typeof input.playerName === 'string' && input.playerName.trim().length > 0
        ? input.playerName.slice(0, 20)
        : DEFAULT_SETTINGS.playerName,
  }
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const DIFFICULTY_BLURBS: Record<Difficulty, string> = {
  easy: 'Plays legal but unfocused moves. A gentle first game.',
  medium: 'Scores every option with solid heuristics. Competent, and beatable.',
  hard: 'Searches ahead with rollouts and plays for tempo and denial.',
}
