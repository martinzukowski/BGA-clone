/**
 * Seeded, serialisable pseudo-randomness.
 *
 * The generator state is a single 32-bit integer that lives *inside* `GameState`,
 * so advancing it is a state change like any other and replays are exact.
 * Algorithm: mulberry32 — small, fast, well-distributed, and trivially portable
 * to a server implementation.
 */

import type { RngState } from './types';

export function createRng(seed: number): RngState {
  // Force a non-zero 32-bit unsigned seed.
  const s = (Math.imul(seed | 0, 0x9e3779b1) ^ 0x6d2b79f5) >>> 0;
  return { seed: s === 0 ? 0x1a2b3c4d : s };
}

/** Returns a float in [0, 1) and the advanced generator state. */
export function nextFloat(rng: RngState): { value: number; rng: RngState } {
  const t = (rng.seed + 0x6d2b79f5) >>> 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { value, rng: { seed: t } };
}

/** Integer in `[0, max)`. `max <= 0` yields 0. */
export function nextInt(rng: RngState, max: number): { value: number; rng: RngState } {
  if (max <= 0) return { value: 0, rng };
  const r = nextFloat(rng);
  return { value: Math.floor(r.value * max), rng: r.rng };
}

/** Fisher–Yates. Returns a new array; the input is untouched. */
export function shuffle<T>(rng: RngState, items: readonly T[]): { value: T[]; rng: RngState } {
  const out = items.slice();
  let cur = rng;
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextInt(cur, i + 1);
    cur = r.rng;
    const j = r.value;
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return { value: out, rng: cur };
}

/** Uniform choice. Throws only on an empty array, which is a programming error. */
export function pick<T>(rng: RngState, items: readonly T[]): { value: T; rng: RngState } {
  if (items.length === 0) throw new Error('pick() from an empty array');
  const r = nextInt(rng, items.length);
  return { value: items[r.value]!, rng: r.rng };
}

/**
 * A convenience wrapper for call sites (mainly the AI) that want an imperative
 * generator. It still starts from a serialisable state and can hand one back,
 * so determinism is preserved.
 */
export class RngCursor {
  private state: RngState;

  constructor(seed: number | RngState) {
    this.state = typeof seed === 'number' ? createRng(seed) : seed;
  }

  float(): number {
    const r = nextFloat(this.state);
    this.state = r.rng;
    return r.value;
  }

  int(max: number): number {
    const r = nextInt(this.state, max);
    this.state = r.rng;
    return r.value;
  }

  pick<T>(items: readonly T[]): T {
    const r = pick(this.state, items);
    this.state = r.rng;
    return r.value;
  }

  shuffled<T>(items: readonly T[]): T[] {
    const r = shuffle(this.state, items);
    this.state = r.rng;
    return r.value;
  }

  snapshot(): RngState {
    return this.state;
  }
}
