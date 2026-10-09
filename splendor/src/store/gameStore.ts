/**
 * The only stateful glue between React and the engine.
 *
 * The store holds an authoritative `GameState` and forwards user intent as
 * `GameAction`s. It contains no rules: every mutation goes through
 * `applyAction`, which validates first. Swapping this for a WebSocket client
 * later means replacing the `applyAction` calls with a send/receive pair -
 * nothing else in the app needs to change.
 */
import { create } from 'zustand'
import type {
  Difficulty,
  GameAction,
  GameState,
  GemColor,
  Tier,
  TokenPool,
} from '@/game/engine/types'
import { applyAction } from '@/game/engine/actions'
import { createGame, defaultBots } from '@/game/engine/setup'
import { emptyTokens, totalTokens } from '@/game/engine/rules'
import { canTakeTwoSame, excessTokens } from '@/game/engine/validation'
import { redactFor } from '@/game/engine/gameState'
import { autoResolvePending, chooseAction } from '@/game/ai'
import { RngStream, randomSeed } from '@/utils/rng'
import { DEFAULT_SETTINGS, type UiSettings } from './settings'
import { clearSave, loadGame, loadSettings, saveGame, saveSettings } from './persistence'

export const HUMAN_ID = 'p0'

/** UI-only pacing for bot turns. The engine itself is instant. */
const THINK_MIN_MS = 400
const THINK_MAX_MS = 900
const SHOW_RESULT_MS = 550
const FAST_THINK_MS = 60
const FAST_SHOW_MS = 90

export type Screen = 'setup' | 'game'

export interface BotStatus {
  /** Bot currently deliberating, if any. */
  thinkingPlayerId: string | null
  /** Short description of the last bot action, e.g. "Vex reserved a Tier 3 card". */
  lastMessage: string | null
  lastMessagePlayerId: string | null
  /** Bumped on every message so the UI can re-run its entry animation. */
  messageKey: number
}

interface GameStore {
  screen: Screen
  settings: UiSettings
  seed: number
  game: GameState | null
  /** A resumable game found in localStorage at boot. */
  resumable: boolean
  bot: BotStatus
  /** Rejection reason from the last attempted action, shown as a toast. */
  error: string | null
  /** Gems the human has picked but not yet confirmed. */
  gemSelection: GemColor[]
  /** Tokens the human has picked to return. */
  discardSelection: TokenPool
  /** Card the cursor is over, so the purse bar can price it. UI-only. */
  hoveredCardId: string | null
  showDebug: boolean
  showRules: boolean
  /** Invalidates in-flight bot turns when the game is replaced. */
  epoch: number
  botRunning: boolean

  init: () => void
  startGame: (overrides?: Partial<UiSettings> & { seed?: number }) => void
  resumeGame: () => void
  discardSave: () => void
  backToSetup: () => void
  updateSettings: (patch: Partial<UiSettings>) => void

  /**
   * Picks a gem from the bank. Picking the same colour twice (and nothing
   * else) means "take two of this colour". Returns whether the pick landed, so
   * the caller only animates a gem that was actually taken.
   */
  pickGem: (color: GemColor) => boolean
  /** Puts one picked gem back, by its position in the selection. */
  unpickGem: (index: number) => void
  clearGemSelection: () => void
  confirmGemSelection: () => void
  purchase: (cardId: string) => void
  reserveVisible: (cardId: string) => void
  reserveDeck: (tier: Tier) => void
  toggleDiscardToken: (color: keyof TokenPool) => void
  confirmDiscard: () => void
  selectPatron: (patronId: string) => void
  setHoveredCard: (cardId: string | null) => void

  dismissError: () => void
  toggleDebug: () => void
  toggleRules: (open?: boolean) => void

  /** Drives bot seats. Called by `useBotTurns`; safe to call repeatedly. */
  advanceBots: () => Promise<void>
}

function readSeedFromUrl(): number | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('seed')
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.floor(parsed) >>> 0 : null
  } catch {
    return null
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const useGameStore = create<GameStore>((set, get) => {
  /**
   * Per-game rng for bot decisions. Kept OUT of GameState on purpose: it is a
   * property of the opponents, not of the game, and a resumed save should not
   * replay identical bot choices when the human plays differently.
   */
  let botRng = new RngStream(1)

  function commit(next: GameState): void {
    const { settings, seed } = get()
    set({ game: next, resumable: true })
    saveGame(next, settings, seed)
  }

  /** Applies a human action, surfacing the engine's rejection reason on failure. */
  function perform(action: GameAction): boolean {
    const state = get().game
    if (!state) return false
    const result = applyAction(state, HUMAN_ID, action)
    if (!result.ok) {
      set({ error: result.reason })
      return false
    }
    // The hovered card may have just left the market; stop pricing it.
    set({ error: null, gemSelection: [], discardSelection: emptyTokens(), hoveredCardId: null })
    commit(result.state)
    return true
  }

  function beginGame(state: GameState, settings: UiSettings, seed: number): void {
    botRng = new RngStream(seed ^ 0x5bf03635)
    set((prev) => ({
      screen: 'game',
      game: state,
      settings,
      seed,
      resumable: true,
      error: null,
      gemSelection: [],
      discardSelection: emptyTokens(),
      hoveredCardId: null,
      bot: { thinkingPlayerId: null, lastMessage: null, lastMessagePlayerId: null, messageKey: 0 },
      epoch: prev.epoch + 1,
      botRunning: false,
    }))
    saveGame(state, settings, seed)
    saveSettings(settings)
  }

  return {
    screen: 'setup',
    settings: DEFAULT_SETTINGS,
    seed: 0,
    game: null,
    resumable: false,
    bot: { thinkingPlayerId: null, lastMessage: null, lastMessagePlayerId: null, messageKey: 0 },
    error: null,
    gemSelection: [],
    discardSelection: emptyTokens(),
    hoveredCardId: null,
    showDebug: false,
    showRules: false,
    epoch: 0,
    botRunning: false,

    init: () => {
      const saved = loadGame()
      const settings = saved?.settings ?? loadSettings()
      const urlSeed = readSeedFromUrl()
      set({
        settings,
        resumable: saved !== null && saved.state.phase !== 'finished',
        seed: urlSeed ?? saved?.seed ?? 0,
      })
      // ?seed=N always starts a fresh reproducible game, overriding any save.
      if (urlSeed !== null) {
        get().startGame({ seed: urlSeed })
      }
    },

    startGame: (overrides = {}) => {
      const { seed: seedOverride, ...settingsPatch } = overrides
      const settings = { ...get().settings, ...settingsPatch }
      const seed = seedOverride ?? readSeedFromUrl() ?? randomSeed()
      const state = createGame({
        seed,
        humanName: settings.playerName,
        bots: defaultBots(settings.opponents, settings.difficulty),
      })
      beginGame(state, settings, seed)
    },

    resumeGame: () => {
      const saved = loadGame()
      if (!saved) {
        set({ resumable: false })
        return
      }
      beginGame(saved.state, saved.settings, saved.seed)
    },

    discardSave: () => {
      clearSave()
      set({ resumable: false })
    },

    backToSetup: () => {
      clearSave()
      set((prev) => ({
        screen: 'setup',
        game: null,
        resumable: false,
        epoch: prev.epoch + 1,
        botRunning: false,
        bot: { thinkingPlayerId: null, lastMessage: null, lastMessagePlayerId: null, messageKey: 0 },
      }))
    },

    updateSettings: (patch) => {
      const settings = { ...get().settings, ...patch }
      set({ settings })
      saveSettings(settings)
    },

    pickGem: (color) => {
      const state = get().game
      if (!state) return false
      const current = get().gemSelection
      const fail = (message: string) => {
        set({ error: message })
        return false
      }

      if (state.bank[color] < 1) return fail(`The bank has no ${color} gems left.`)

      // A pair is a complete selection on its own.
      if (current.length === 2 && current[0] === current[1]) {
        return fail(`You have picked two ${current[0]}. Confirm, or cancel to choose again.`)
      }

      if (current.includes(color)) {
        // Second pick of the only colour chosen so far: switch to "take two".
        // The engine decides whether that is legal, so the reason shown is
        // exactly the rule that blocks it.
        if (current.length === 1) {
          const check = canTakeTwoSame(state, HUMAN_ID, color)
          if (!check.ok) return fail(check.reason)
          set({ gemSelection: [color, color], error: null })
          return true
        }
        return fail('Pick three different colours, or two of a single colour on its own.')
      }

      if (current.length >= 3) return fail('You may take at most three different gems.')

      set({ gemSelection: [...current, color], error: null })
      return true
    },

    unpickGem: (index) => {
      const current = get().gemSelection
      set({ gemSelection: current.filter((_, i) => i !== index), error: null })
    },

    clearGemSelection: () => set({ gemSelection: [], error: null }),

    confirmGemSelection: () => {
      const colors = get().gemSelection
      if (colors.length === 0) return
      const isPair = colors.length === 2 && colors[0] === colors[1]
      perform(isPair ? { type: 'TAKE_TWO', color: colors[0] } : { type: 'TAKE_THREE', colors })
    },

    purchase: (cardId) => {
      perform({ type: 'PURCHASE', cardId })
    },
    reserveVisible: (cardId) => {
      perform({ type: 'RESERVE_VISIBLE', cardId })
    },
    reserveDeck: (tier) => {
      perform({ type: 'RESERVE_DECK', tier })
    },

    toggleDiscardToken: (color) => {
      const state = get().game
      if (!state) return
      const player = state.players.find((p) => p.id === HUMAN_ID)
      if (!player) return
      const selection = { ...get().discardSelection }
      const needed = excessTokens(player)
      const chosen = totalTokens(selection)
      if (selection[color] > 0 && chosen >= needed) {
        // Clicking a selected token when the quota is full removes it again.
        selection[color] -= 1
      } else if (selection[color] < player.tokens[color] && chosen < needed) {
        selection[color] += 1
      } else if (selection[color] > 0) {
        selection[color] -= 1
      } else {
        return
      }
      set({ discardSelection: selection, error: null })
    },

    confirmDiscard: () => {
      perform({ type: 'DISCARD', tokens: get().discardSelection })
    },
    selectPatron: (patronId) => {
      perform({ type: 'CHOOSE_PATRON', patronId })
    },

    setHoveredCard: (cardId) => set({ hoveredCardId: cardId }),

    dismissError: () => set({ error: null }),
    toggleDebug: () => set((prev) => ({ showDebug: !prev.showDebug })),
    toggleRules: (open) => set((prev) => ({ showRules: open ?? !prev.showRules })),

    advanceBots: async () => {
      if (get().botRunning) return
      const epoch = get().epoch
      set({ botRunning: true })

      try {
        // Loop, because several bots may act back-to-back before the human.
        for (;;) {
          const store = get()
          if (store.epoch !== epoch) return
          const state = store.game
          if (!state || state.phase === 'finished') return

          const player = state.players[state.currentPlayerIndex]
          if (!player.isBot || !player.difficulty) return

          const fast = store.settings.fastAi
          const think = fast
            ? FAST_THINK_MS
            : THINK_MIN_MS + Math.floor(Math.random() * (THINK_MAX_MS - THINK_MIN_MS))

          set({
            bot: { ...store.bot, thinkingPlayerId: player.id },
          })
          await delay(think)
          if (get().epoch !== epoch) return

          const next = playBotTurn(state, player.id, player.difficulty, botRng)
          if (get().epoch !== epoch) return

          set((prev) => ({
            bot: {
              thinkingPlayerId: null,
              lastMessage: next.message,
              lastMessagePlayerId: player.id,
              messageKey: prev.bot.messageKey + 1,
            },
          }))
          commit(next.state)

          await delay(fast ? FAST_SHOW_MS : SHOW_RESULT_MS)
          if (get().epoch !== epoch) return
        }
      } finally {
        if (get().epoch === epoch) set({ botRunning: false, bot: { ...get().bot, thinkingPlayerId: null } })
        else set({ botRunning: false })
      }
    },
  }
})

/**
 * Dev-only console handle, e.g. `__gemwright.getState().game`.
 * Guarded by import.meta.env.DEV so it is stripped from production builds.
 */
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__gemwright = useGameStore
}

/* ------------------------------------------------------------------ *
 * Bot turn execution
 * ------------------------------------------------------------------ */

interface BotTurnOutcome {
  state: GameState
  message: string
}

/**
 * Runs one bot turn including any discard / patron sub-decision.
 * Everything goes through the redaction boundary and `applyAction`, exactly as
 * a networked opponent would.
 */
function playBotTurn(
  state: GameState,
  playerId: string,
  difficulty: Difficulty,
  rng: RngStream,
): BotTurnOutcome {
  let current = state
  const player = current.players.find((p) => p.id === playerId)!
  const logBefore = current.log.length

  const action = chooseAction(redactFor(current, playerId), playerId, difficulty, rng)
  if (action) {
    const result = applyAction(current, playerId, action)
    if (result.ok) current = result.state
  }

  // Resolve token limit and patron choice with the AI's own sub-decisions.
  current = autoResolvePending(current)

  const added = current.log.slice(logBefore)
  const summary =
    added.find((entry) => entry.kind !== 'system' && entry.kind !== 'discard')?.text ??
    added[0]?.text ??
    `${player.name} passed.`
  return { state: current, message: summary }
}

