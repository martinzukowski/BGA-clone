/**
 * Patron tiles (the "noble" analogue). Original names.
 *
 * Composition follows the classic template: 10 tiles worth 3 prestige each,
 * five requiring 4+4 of two bonus colours and five requiring 3+3+3 of three.
 * A game deals (playerCount + 1) of them.
 */
import type { GemCount, Patron } from '@/game/engine/types'

function req(partial: Partial<GemCount>): GemCount {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0, ...partial }
}

export const ALL_PATRONS: Patron[] = [
  { id: 'p-archivist', name: 'The Archivist', points: 3, requirement: req({ white: 4, blue: 4 }) },
  { id: 'p-cartographer', name: 'The Cartographer', points: 3, requirement: req({ blue: 4, green: 4 }) },
  { id: 'p-warden', name: 'The Warden', points: 3, requirement: req({ green: 4, red: 4 }) },
  { id: 'p-alchemist', name: 'The Alchemist', points: 3, requirement: req({ red: 4, black: 4 }) },
  { id: 'p-astronomer', name: 'The Astronomer', points: 3, requirement: req({ black: 4, white: 4 }) },
  { id: 'p-magistrate', name: 'The Magistrate', points: 3, requirement: req({ white: 3, blue: 3, green: 3 }) },
  { id: 'p-navigator', name: 'The Navigator', points: 3, requirement: req({ blue: 3, green: 3, red: 3 }) },
  { id: 'p-provost', name: 'The Provost', points: 3, requirement: req({ green: 3, red: 3, black: 3 }) },
  { id: 'p-chancellor', name: 'The Chancellor', points: 3, requirement: req({ red: 3, black: 3, white: 3 }) },
  { id: 'p-hierophant', name: 'The Hierophant', points: 3, requirement: req({ black: 3, white: 3, blue: 3 }) },
]

const PATRON_INDEX: Record<string, Patron> = Object.fromEntries(ALL_PATRONS.map((p) => [p.id, p]))

export function getPatron(id: string): Patron {
  const patron = PATRON_INDEX[id]
  if (!patron) throw new Error(`Unknown patron id: ${id}`)
  return patron
}
