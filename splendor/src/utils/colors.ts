import type { GemColor, TokenColor } from '@/game/engine/types'

/**
 * Presentation-only colour table. Original palette: each gem gets a jewel tone
 * plus a darker rim so it reads on the dark felt without needing artwork.
 */
export interface GemTheme {
  label: string
  /** Face colour of the gem body. */
  fill: string
  /** Rim / border. */
  rim: string
  /** Ink used when text sits on top of the fill. */
  ink: string
  /** Soft background tint for chips and cost pips. */
  tint: string
}

export const GEM_THEME: Record<TokenColor, GemTheme> = {
  white: {
    label: 'Pearl',
    fill: '#ece7db',
    rim: '#b8b0a0',
    ink: '#2a2620',
    tint: 'rgba(236, 231, 219, 0.14)',
  },
  blue: {
    label: 'Sapphire',
    fill: '#3d7bf0',
    rim: '#1f4ea8',
    ink: '#f2f6ff',
    tint: 'rgba(61, 123, 240, 0.18)',
  },
  green: {
    label: 'Emerald',
    fill: '#1fa877',
    rim: '#0f6b4b',
    ink: '#effcf6',
    tint: 'rgba(31, 168, 119, 0.18)',
  },
  red: {
    label: 'Carnelian',
    fill: '#dc4646',
    rim: '#8f2222',
    ink: '#fff2f2',
    tint: 'rgba(220, 70, 70, 0.18)',
  },
  black: {
    label: 'Obsidian',
    fill: '#6f6e86',
    rim: '#3a3949',
    ink: '#f4f4f8',
    tint: 'rgba(111, 110, 134, 0.22)',
  },
  gold: {
    label: 'Gold',
    fill: '#e8bf4d',
    rim: '#9d7716',
    ink: '#2c2208',
    tint: 'rgba(232, 191, 77, 0.2)',
  },
}

export function gemTheme(color: TokenColor): GemTheme {
  return GEM_THEME[color]
}

export function gemLabel(color: TokenColor): string {
  return GEM_THEME[color].label
}

/** Card frame tint per bonus colour, kept subtle so cards stay readable. */
export function cardFrame(color: GemColor): { from: string; to: string; rim: string } {
  const theme = GEM_THEME[color]
  return {
    from: `color-mix(in oklab, ${theme.fill} 16%, #141a26)`,
    to: '#0e131d',
    rim: `color-mix(in oklab, ${theme.fill} 42%, #2a3243)`,
  }
}

export const TIER_LABEL: Record<number, string> = {
  1: 'Tier I',
  2: 'Tier II',
  3: 'Tier III',
}

export const TIER_ACCENT: Record<number, string> = {
  1: '#6f8fb8',
  2: '#b89a6f',
  3: '#b87fc9',
}
