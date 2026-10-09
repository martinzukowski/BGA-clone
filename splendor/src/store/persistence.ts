/**
 * localStorage persistence.
 *
 * Deliberately confined to this one module: the engine itself never touches a
 * browser API, so the same GameState can be persisted server-side later without
 * changing a line of game logic.
 */
import type { GameState } from '@/game/engine/types'
import { deserializeState, serializeState } from '@/game/engine/gameState'
import type { UiSettings } from './settings'
import { DEFAULT_SETTINGS, normaliseSettings } from './settings'

const SAVE_KEY = 'gemwright:save:v1'
const SETTINGS_KEY = 'gemwright:settings:v1'

export interface SavedGame {
  state: GameState
  settings: UiSettings
  seed: number
  savedAt: number
}

function storage(): Storage | null {
  try {
    // Private-mode browsers can throw on access, not just on write.
    return window.localStorage
  } catch {
    return null
  }
}

export function saveGame(state: GameState, settings: UiSettings, seed: number): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(
      SAVE_KEY,
      JSON.stringify({ state: serializeState(state), settings, seed, savedAt: Date.now() }),
    )
  } catch {
    // Quota or private mode. A missing save is never fatal.
  }
}

export function loadGame(): SavedGame | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      state: string
      settings: unknown
      seed: number
      savedAt: number
    }
    const state = deserializeState(parsed.state)
    if (!state) {
      // Save is from an incompatible build - drop it rather than crash on load.
      clearSave()
      return null
    }
    return {
      state,
      settings: normaliseSettings(parsed.settings),
      seed: typeof parsed.seed === 'number' ? parsed.seed : state.rng.seed,
      savedAt: parsed.savedAt ?? 0,
    }
  } catch {
    clearSave()
    return null
  }
}

export function clearSave(): void {
  try {
    storage()?.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  try {
    return storage()?.getItem(SAVE_KEY) != null
  } catch {
    return false
  }
}

export function saveSettings(settings: UiSettings): void {
  try {
    storage()?.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

export function loadSettings(): UiSettings {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return normaliseSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}
