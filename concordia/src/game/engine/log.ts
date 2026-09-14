/**
 * The structured event log.
 *
 * Every state change appends entries here. The UI renders `text`; the animation
 * layer switches on `kind` and reads `data`. Because entries are produced by the
 * engine (not the UI), an AI turn animates through exactly the same pipeline a
 * human turn does.
 */

import type { GameState, LogEntry, LogEventKind, PlayerId } from './types';

export interface LogDraft {
  readonly kind: LogEventKind;
  readonly playerId?: PlayerId | null;
  readonly text: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * Appends drafts to the state's log, assigning ids and the current turn number.
 * Returns both the new state and just the entries added, so callers can hand the
 * fresh ones to the animation queue.
 */
export function appendLog(
  state: GameState,
  drafts: readonly LogDraft[],
): { state: GameState; events: LogEntry[] } {
  if (drafts.length === 0) return { state, events: [] };
  let nextId = state.log.length === 0 ? 1 : state.log[state.log.length - 1]!.id + 1;
  const events: LogEntry[] = drafts.map((d) => ({
    id: nextId++,
    turn: state.turnNumber,
    kind: d.kind,
    playerId: d.playerId ?? null,
    text: d.text,
    ...(d.data ? { data: d.data } : {}),
  }));
  return { state: { ...state, log: [...state.log, ...events] }, events };
}

/** Keeps the log from growing without bound in very long AI simulations. */
export const MAX_LOG_ENTRIES = 600;

export function trimLog(state: GameState): GameState {
  if (state.log.length <= MAX_LOG_ENTRIES) return state;
  return { ...state, log: state.log.slice(state.log.length - MAX_LOG_ENTRIES) };
}
