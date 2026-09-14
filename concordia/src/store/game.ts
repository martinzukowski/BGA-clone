/**
 * The one place where React and the engine meet.
 *
 * Every mutation in the whole application goes through `dispatch(action)`.
 * That single seam is what an online build would swap for a socket send — the
 * engine, the AI and every component stay exactly as they are.
 */

import { create } from 'zustand';
import { chooseTurn } from '../game/ai';
import { computeHint, type Hint } from '../game/ai/hint';
import { applyAction, setupGame, validateState } from '../game/engine/rules';
import type {
  CityId,
  ColonistType,
  GameAction,
  GameState,
  Good,
  LogEntry,
  PlayerId,
  SetupOptions,
} from '../game/engine/types';
import { clearSave, loadGame, saveGame } from '../utils/persistence';
import { sound, type SoundId } from '../utils/sound';
import { speedFactor, useSettings } from './settings';

export type Screen = 'menu' | 'setup' | 'game' | 'over' | 'rules';

/** Purely visual selection state. It can never change what is legal. */
export interface Interaction {
  selectedColonistId: string | null;
  hoveredCity: CityId | null;
  hoveredRoute: string | null;
  hoveredProvince: string | null;
  /** City awaiting build confirmation. */
  pendingBuild: CityId | null;
  /** Goods the player would rather keep when the storehouse overflows. */
  goodsPreference: Good[];
  /** Which kind of colonist a Colonist card will place on the next city click. */
  recruitType: ColonistType;
  inspectingCard: string | null;
}

const EMPTY_INTERACTION: Interaction = {
  selectedColonistId: null,
  hoveredCity: null,
  hoveredRoute: null,
  hoveredProvince: null,
  pendingBuild: null,
  goodsPreference: [],
  recruitType: 'land',
  inspectingCard: null,
};

export interface AiNarration {
  readonly playerId: PlayerId;
  readonly name: string;
  /** `null` while "thinking"; set once the chosen card is known. */
  readonly label: string | null;
}

interface GameStore {
  screen: Screen;
  game: GameState | null;
  /** Events from the most recent action, for the animation layer to consume. */
  recentEvents: readonly LogEntry[];
  interaction: Interaction;
  aiTurn: AiNarration | null;
  lastError: string | null;
  /** Bumped whenever a save is written, so the menu can react. */
  saveToken: number;
  /** True while an AI turn is being played out. */
  busy: boolean;

  /**
   * States to step back to, oldest first — one entry per action taken *this
   * turn*. Undo is deliberately scoped to the player's own current turn: it
   * exists to walk back a move you regret, not to relitigate a turn you have
   * already committed (and which the AI may already be reacting to).
   */
  history: GameState[];
  /** Which turn `history` belongs to; a turn change invalidates it. */
  historyTurn: number | null;

  /** The current best-move suggestion, or `null` if none has been asked for (or it's gone stale). */
  hint: Hint | null;

  go(screen: Screen): void;
  newGame(options: SetupOptions): void;
  continueGame(): boolean;
  abandonGame(): void;

  dispatch(action: GameAction): boolean;
  /** Steps back to the state before your last action. False if there is none. */
  undo(): boolean;
  /** Computes and stores a suggestion for the human player's next move. */
  requestHint(): void;
  clearHint(): void;
  /** Performs the current hint's actions in full, then clears it. */
  applyHint(): void;
  setInteraction(patch: Partial<Interaction>): void;
  clearSelection(): void;
  dismissError(): void;
  /** Development only. Replaces the state wholesale. */
  debugSetState(state: GameState): void;
}

/* ─────────────────────────────────────────────── event → sound map ── */

const SOUND_FOR: Partial<Record<LogEntry['kind'], SoundId>> = {
  'card-played': 'card-play',
  'card-bought': 'card-draw',
  'display-refilled': 'card-shuffle',
  'cards-recovered': 'card-shuffle',
  'house-built': 'build',
  production: 'goods',
  'bonus-received': 'goods',
  'cash-bonus': 'coin',
  money: 'coin',
  trade: 'coin',
  'colonist-recruited': 'colonist',
  'game-over': 'victory',
  'intermediate-scoring': 'score',
};

function playSounds(events: readonly LogEntry[]): void {
  const seen = new Set<SoundId>();
  for (const event of events) {
    if (event.kind === 'colonist-moved') {
      const id: SoundId = event.data?.['colonistType'] === 'sea' ? 'ship' : 'colonist';
      if (!seen.has(id)) {
        seen.add(id);
        sound.play(id);
      }
      continue;
    }
    const id = SOUND_FOR[event.kind];
    if (id && !seen.has(id)) {
      seen.add(id);
      sound.play(id);
    }
  }
}

/** Awaits only when there is really something to wait for. */
const wait = (ms: number) => (ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

/**
 * How long to dwell between an AI's actions.
 *
 * Zero while the tab is hidden: there is nobody watching, and browsers throttle
 * background timers hard enough that a paced AI turn can stall for minutes.
 */
function pace(base: number): number {
  if (typeof document !== 'undefined' && document.hidden) return 0;
  return Math.round(base * speedFactor(useSettings.getState().animationSpeed));
}

export const useGame = create<GameStore>((set, get) => ({
  screen: 'menu',
  game: null,
  recentEvents: [],
  interaction: EMPTY_INTERACTION,
  aiTurn: null,
  lastError: null,
  saveToken: 0,
  busy: false,
  history: [],
  historyTurn: null,
  hint: null,

  go(screen) {
    set({ screen });
  },

  newGame(options) {
    const game = setupGame(options);
    set({
      game,
      screen: 'game',
      recentEvents: [],
      interaction: EMPTY_INTERACTION,
      aiTurn: null,
      lastError: null,
      busy: false,
      history: [],
      historyTurn: null,
      hint: null,
    });
    saveGame(game);
    set((s) => ({ saveToken: s.saveToken + 1 }));
    sound.play('card-shuffle');
    void maybeRunAi();
  },

  continueGame() {
    const saved = loadGame();
    if (!saved) return false;
    // Never trust a save blindly: a corrupted or hand-edited one is discarded.
    if (validateState(saved.state).length > 0) {
      clearSave();
      return false;
    }
    set({
      game: saved.state,
      screen: saved.state.phase === 'finished' ? 'over' : 'game',
      recentEvents: [],
      interaction: EMPTY_INTERACTION,
      aiTurn: null,
      lastError: null,
      busy: false,
      history: [],
      historyTurn: null,
      hint: null,
    });
    void maybeRunAi();
    return true;
  },

  abandonGame() {
    clearSave();
    set({
      game: null,
      screen: 'menu',
      recentEvents: [],
      interaction: EMPTY_INTERACTION,
      aiTurn: null,
      busy: false,
      saveToken: get().saveToken + 1,
      history: [],
      historyTurn: null,
      hint: null,
    });
  },

  dispatch(action) {
    const state = get().game;
    if (!state) return false;

    // Undo is scoped to the current turn: a turn boundary (yours ending, or
    // control passing to an opponent) starts a fresh, empty window. This is
    // what keeps "undo my last move" from ever reaching back into a turn
    // that has already been committed and possibly acted on by the AI.
    const scoped = get().historyTurn === state.turnNumber ? get().history : [];

    const result = applyAction(state, action);
    if (!result.ok) {
      set({ lastError: result.error });
      return false;
    }

    playSounds(result.events);

    const finished = result.state.phase === 'finished';
    set({
      game: result.state,
      recentEvents: result.events,
      lastError: null,
      history: [...scoped, state],
      historyTurn: state.turnNumber,
      // Any suggestion referred to the position before this action; it no longer applies.
      hint: null,
      // Selections that referred to the old position are no longer meaningful.
      interaction: {
        ...get().interaction,
        selectedColonistId:
          action.type === 'MOVE_COLONIST' ? null : get().interaction.selectedColonistId,
        pendingBuild: null,
      },
    });

    // RULES: a save is written after every completed turn.
    if (result.state.pending === null) {
      saveGame(result.state);
      set((s) => ({ saveToken: s.saveToken + 1 }));
    }

    if (finished) {
      set({ screen: 'over' });
    } else if (result.state.pending === null) {
      void maybeRunAi();
    }
    return true;
  },

  undo() {
    const { history, game } = get();
    if (!game || history.length === 0) return false;
    const prev = history[history.length - 1]!;
    set({
      game: prev,
      history: history.slice(0, -1),
      recentEvents: [],
      lastError: null,
      hint: null,
      interaction: EMPTY_INTERACTION,
    });
    // Keep the on-disk save in step, so a refresh mid-undo can't resurrect
    // the move you just took back.
    saveGame(prev);
    return true;
  },

  requestHint() {
    const state = get().game;
    if (!state) return;
    const you = state.players.findIndex((p) => p.isHuman);
    if (you < 0 || state.currentPlayer !== you) return;
    set({ hint: computeHint(state, you) });
  },

  clearHint() {
    set({ hint: null });
  },

  applyHint() {
    const { hint, dispatch, clearHint } = get();
    if (!hint) return;
    for (const action of hint.actions) {
      if (!dispatch(action)) break;
    }
    clearHint();
  },

  setInteraction(patch) {
    set({ interaction: { ...get().interaction, ...patch } });
  },

  clearSelection() {
    set({
      interaction: { ...get().interaction, selectedColonistId: null, pendingBuild: null },
    });
  },

  dismissError() {
    set({ lastError: null });
  },

  debugSetState(state) {
    // Arbitrary state surgery invalidates any assumptions the undo stack was
    // relying on (it was built by replaying real actions from a real state).
    set({ game: state, recentEvents: [], history: [], historyTurn: null, hint: null });
  },
}));

/* ────────────────────────────────────────────────── the AI turn loop ── */

let aiRunning = false;

/**
 * Plays out AI turns until it is the human's move again.
 *
 * The AI's whole turn is decided up front and then *performed* one action at a
 * time with a pause between, so the board tells the story rather than snapping
 * to the finished position.
 */
async function maybeRunAi(): Promise<void> {
  if (aiRunning) return;
  aiRunning = true;
  try {
    for (;;) {
      const store = useGame.getState();
      const state = store.game;
      if (!state || state.phase === 'finished') break;
      if (state.pending !== null) break;

      const player = state.players[state.currentPlayer]!;
      if (player.isHuman) break;

      useGame.setState({
        busy: true,
        aiTurn: { playerId: player.id, name: player.name, label: null },
      });

      const thinkTime = pace(520);
      const turn = chooseTurn(state, player.difficulty ?? 'medium');
      if (thinkTime) await wait(thinkTime);

      useGame.setState({
        aiTurn: { playerId: player.id, name: player.name, label: turn.label },
      });
      if (thinkTime) await wait(pace(430));

      for (const action of turn.actions) {
        const current = useGame.getState().game;
        if (!current) break;
        const result = applyAction(current, action);
        if (!result.ok) {
          // Should be impossible; the AI only emits actions it has simulated.
          useGame.setState({ lastError: `${player.name} attempted an illegal move.` });
          break;
        }
        playSounds(result.events);
        useGame.setState({ game: result.state, recentEvents: result.events });
        await wait(pace(actionPause(action)));
      }

      const after = useGame.getState().game;
      if (after) {
        saveGame(after);
        useGame.setState((s) => ({ saveToken: s.saveToken + 1 }));
        if (after.phase === 'finished') {
          useGame.setState({ screen: 'over' });
          break;
        }
      }

      await wait(pace(260));
      useGame.setState({ aiTurn: null });
    }
  } finally {
    aiRunning = false;
    useGame.setState({ busy: false, aiTurn: null });
  }
}

/** How long to dwell on each kind of action so the story stays readable. */
function actionPause(action: GameAction): number {
  switch (action.type) {
    case 'PLAY_CARD':
      return 340;
    case 'MOVE_COLONIST':
      return 300 + Math.min(action.path.length, 4) * 130;
    case 'BUILD_HOUSE':
      return 460;
    case 'PREFECT_PRODUCE':
      return 720;
    case 'BUY_CARD':
      return 540;
    case 'TRADE':
      return 320;
    case 'RECRUIT_COLONIST':
      return 380;
    case 'END_MOVEMENT':
      return 60;
    case 'END_ACTION':
      return 120;
    default:
      return 240;
  }
}

/** Exposed for the debug panel, which can leave the AI mid-turn. */
export function resumeAi(): void {
  void maybeRunAi();
}
