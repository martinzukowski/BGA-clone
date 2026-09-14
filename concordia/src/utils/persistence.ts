/**
 * Save and resume, in localStorage.
 *
 * `GameState` is plain JSON by construction, so a save is just the state plus a
 * little metadata for the "Continue" card on the main menu.
 */

import { STATE_VERSION } from '../game/data/ruleConstants';
import type { GameState } from '../game/engine/types';

const KEY = 'imperium.save.v1';

export interface SavedGame {
  readonly version: number;
  readonly savedAt: number;
  readonly state: GameState;
  readonly summary: {
    readonly mapId: string;
    readonly turnNumber: number;
    readonly roundNumber: number;
    readonly players: readonly { name: string; color: string; isHuman: boolean }[];
  };
}

export function saveGame(state: GameState): void {
  try {
    const payload: SavedGame = {
      version: STATE_VERSION,
      savedAt: Date.now(),
      state,
      summary: {
        mapId: state.mapId,
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
        players: state.players.map((p) => ({ name: p.name, color: p.color, isHuman: p.isHuman })),
      },
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* Out of quota or storage disabled — the game keeps running regardless. */
  }
}

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (parsed.version !== STATE_VERSION) return null;
    if (!parsed.state || !Array.isArray(parsed.state.players)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
