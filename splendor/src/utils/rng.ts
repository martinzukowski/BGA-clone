/**
 * Deterministic, serializable PRNG (mulberry32).
 *
 * The RNG's entire state is `{seed, cursor}` and lives inside GameState, so a
 * snapshot of the state fully determines every future draw. That is what makes
 * `?seed=12345` reproducible and what lets a save/restore resume exactly.
 */
import type { RngState } from '@/game/engine/types'

export function createRng(seed: number): RngState {
  return { seed: seed >>> 0, cursor: 0 }
}

/** Pure: returns a float in [0,1) plus the advanced RNG state. */
export function nextFloat(rng: RngState): { value: number; rng: RngState } {
  const t = (rng.seed + 0x6d2b79f5 * (rng.cursor + 1)) >>> 0
  let x = t
  x = Math.imul(x ^ (x >>> 15), x | 1)
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296
  return { value, rng: { seed: rng.seed, cursor: rng.cursor + 1 } }
}

/** Integer in [0, maxExclusive). */
export function nextInt(rng: RngState, maxExclusive: number): { value: number; rng: RngState } {
  const r = nextFloat(rng)
  return { value: Math.floor(r.value * maxExclusive), rng: r.rng }
}

/** Fisher–Yates using the seeded stream. Returns a new array; input untouched. */
export function shuffle<T>(items: readonly T[], rng: RngState): { items: T[]; rng: RngState } {
  const out = items.slice()
  let cursor = rng
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextInt(cursor, i + 1)
    cursor = r.rng
    const j = r.value
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return { items: out, rng: cursor }
}

export function pick<T>(items: readonly T[], rng: RngState): { value: T; rng: RngState } {
  const r = nextInt(rng, items.length)
  return { value: items[r.value], rng: r.rng }
}

/** A convenience mutable wrapper for AI code, which does not need purity. */
export class RngStream {
  private state: RngState
  constructor(seed: number | RngState) {
    this.state = typeof seed === 'number' ? createRng(seed) : { ...seed }
  }
  float(): number {
    const r = nextFloat(this.state)
    this.state = r.rng
    return r.value
  }
  int(maxExclusive: number): number {
    return Math.floor(this.float() * maxExclusive)
  }
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)]
  }
  snapshot(): RngState {
    return { ...this.state }
  }
}

/** Generates a fresh random seed (non-deterministic — only used to START a game). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}
