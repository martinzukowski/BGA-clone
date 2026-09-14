/**
 * The sound system.
 *
 * Real audio files are optional. Drop an mp3 into `/public/assets/sounds/`
 * named after the id below and it plays; with no file present every call is a
 * silent no-op — the game never depends on audio being there.
 *
 * Documented asset slots:
 *   /public/assets/sounds/card-draw.mp3
 *   /public/assets/sounds/card-shuffle.mp3
 *   /public/assets/sounds/card-play.mp3
 *   /public/assets/sounds/coin.mp3
 *   /public/assets/sounds/goods.mp3
 *   /public/assets/sounds/ship.mp3
 *   /public/assets/sounds/colonist.mp3
 *   /public/assets/sounds/build.mp3
 *   /public/assets/sounds/score.mp3
 *   /public/assets/sounds/victory.mp3
 *   /public/assets/sounds/ambient.mp3   (music loop)
 */

export type SoundId =
  | 'card-draw'
  | 'card-shuffle'
  | 'card-play'
  | 'coin'
  | 'goods'
  | 'ship'
  | 'colonist'
  | 'build'
  | 'score'
  | 'victory';

const BASE = '/assets/sounds';

const cache = new Map<string, HTMLAudioElement | null>();
let enabled = true;
let musicEnabled = false;
let volume = 0.6;
let music: HTMLAudioElement | null = null;

function element(id: string): HTMLAudioElement | null {
  if (cache.has(id)) return cache.get(id) ?? null;
  if (typeof Audio === 'undefined') {
    cache.set(id, null);
    return null;
  }
  const audio = new Audio(`${BASE}/${id}.mp3`);
  audio.preload = 'auto';
  // A missing file is the expected case, not an error worth logging.
  audio.addEventListener('error', () => cache.set(id, null), { once: true });
  cache.set(id, audio);
  return audio;
}

export const sound = {
  configure(options: { effects?: boolean; music?: boolean; volume?: number }): void {
    if (options.effects !== undefined) enabled = options.effects;
    if (options.volume !== undefined) volume = options.volume;
    if (options.music !== undefined) {
      musicEnabled = options.music;
      if (!musicEnabled) sound.stopMusic();
      else sound.startMusic();
    }
    if (music) music.volume = volume * 0.35;
  },

  play(id: SoundId): void {
    if (!enabled) return;
    const audio = element(id);
    if (!audio) return;
    try {
      const instance = audio.cloneNode(true) as HTMLAudioElement;
      instance.volume = volume;
      void instance.play().catch(() => undefined);
    } catch {
      /* Autoplay policy or a missing file. Never fatal. */
    }
  },

  startMusic(): void {
    if (!musicEnabled || typeof Audio === 'undefined') return;
    if (!music) {
      music = new Audio(`${BASE}/ambient.mp3`);
      music.loop = true;
      music.addEventListener('error', () => (music = null), { once: true });
    }
    if (music) {
      music.volume = volume * 0.35;
      void music.play().catch(() => undefined);
    }
  },

  stopMusic(): void {
    music?.pause();
  },
};
