/**
 * Player preferences. Persisted to localStorage; never affects the rules.
 */

import { create } from 'zustand';

export type AnimationSpeed = 'normal' | 'fast' | 'instant';

export interface Settings {
  animationSpeed: AnimationSpeed;
  soundEffects: boolean;
  music: boolean;
  volume: number;
  showLegalHighlights: boolean;
  playerName: string;
}

const STORAGE_KEY = 'imperium.settings.v1';

const DEFAULTS: Settings = {
  animationSpeed: 'normal',
  soundEffects: true,
  music: false,
  volume: 0.6,
  showLegalHighlights: true,
  playerName: 'Martin',
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function save(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Private browsing, quota, or a locked-down profile — never fatal. */
  }
}

interface SettingsStore extends Settings {
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  reset(): void;
}

export const useSettings = create<SettingsStore>((setState, getState) => ({
  ...load(),
  set(key, value) {
    setState({ [key]: value } as Partial<SettingsStore>);
    const { set: _s, reset: _r, ...rest } = getState();
    save({ ...rest, [key]: value } as Settings);
  },
  reset() {
    setState({ ...DEFAULTS });
    save(DEFAULTS);
  },
}));

/** Multiplier applied to every animation duration. */
export function speedFactor(speed: AnimationSpeed): number {
  switch (speed) {
    case 'fast':
      return 0.45;
    case 'instant':
      return 0;
    default:
      return 1;
  }
}

/** Honours the OS-level reduced-motion preference. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
