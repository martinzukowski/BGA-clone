/**
 * Core domain types for Gemwright.
 *
 * DESIGN CONTRACT (important for the future online-multiplayer step):
 * Every type in this file is plain JSON — objects, arrays, numbers, strings,
 * booleans. No Map, no Set, no Date, no class instances, no functions.
 * `JSON.parse(JSON.stringify(state))` must round-trip a GameState losslessly,
 * because a server will eventually ship these over the wire.
 */

/** The five tradeable gem colours. Gold is deliberately NOT part of this union. */
export type GemColor = 'white' | 'blue' | 'green' | 'red' | 'black'

/** Gem colours plus the gold wild token. */
export type TokenColor = GemColor | 'gold'

export const GEM_COLORS: readonly GemColor[] = ['white', 'blue', 'green', 'red', 'black']
export const TOKEN_COLORS: readonly TokenColor[] = [...GEM_COLORS, 'gold']

/** A count of tokens/bonuses per colour. Always fully populated (no optional keys). */
export type GemCount = Record<GemColor, number>
/** A count including gold. Always fully populated. */
export type TokenPool = Record<TokenColor, number>

export type Tier = 1 | 2 | 3

export interface Card {
  id: string
  tier: Tier
  /** Permanent bonus colour this card grants when purchased. */
  bonus: GemColor
  /** Prestige points awarded on purchase. */
  points: number
  /** Token cost, before permanent-bonus discounts. */
  cost: GemCount
  name: string
}

export interface Patron {
  id: string
  /** Permanent card bonuses required to attract this patron. Tokens never count. */
  requirement: GemCount
  points: number
  name: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface PlayerState {
  id: string
  name: string
  /** null for the human player. */
  difficulty: Difficulty | null
  isBot: boolean
  tokens: TokenPool
  /** Ids of purchased development cards, in purchase order. */
  purchased: string[]
  /** Ids of reserved cards (max 3). */
  reserved: string[]
  /**
   * Subset of `reserved` that was drawn blind from a deck top.
   * Used only for redaction: opponents may not see these cards' identities.
   */
  reservedHidden: string[]
  /** Ids of patrons acquired. */
  patrons: string[]
}

export type GamePhase =
  /** Normal play. */
  | 'playing'
  /** Current player must discard down to the token limit before ending their turn. */
  | 'discarding'
  /** Current player qualifies for 2+ patrons and must pick one. */
  | 'choosing-patron'
  /** A player hit the prestige threshold; the round is being completed. */
  | 'final-round'
  /** Game over. */
  | 'finished'

/** Serializable RNG state. Advancing the RNG advances `cursor`. */
export interface RngState {
  seed: number
  cursor: number
}

export interface MarketTier {
  /** Ordered deck; index 0 is the top (next card drawn). Hidden information. */
  deck: string[]
  /**
   * Face-up slots. Fixed length 4. `null` means the slot is permanently empty
   * because the deck ran out.
   */
  visible: (string | null)[]
}

export interface GameConfig {
  playerCount: number
  /** Prestige needed to trigger the final round. */
  winningScore: number
  /** Max tokens a player may hold at end of turn. */
  tokenLimit: number
  /** Max cards a player may hold in reserve. */
  reserveLimit: number
}

export interface GameState {
  /** Schema version, so persisted saves can be rejected/migrated. */
  version: number
  config: GameConfig
  rng: RngState
  players: PlayerState[]
  /** Index into `players`. */
  currentPlayerIndex: number
  /** Increments each time play returns to player 0. 1-based. */
  round: number
  /** Total main actions resolved so far. */
  turnCount: number
  phase: GamePhase
  bank: TokenPool
  market: Record<Tier, MarketTier>
  patrons: string[]
  /** Ids of patrons still available (subset of `patrons`). */
  availablePatrons: string[]
  /**
   * Index of the player who triggered the end game. The round completes so that
   * every player has had an equal number of turns. null while nobody has.
   */
  endTriggeredByIndex: number | null
  /** Ids of winners after `phase === 'finished'` (usually one; ties resolved by rules). */
  winnerIds: string[]
  /** Human-readable log of everything that happened, newest last. */
  log: LogEntry[]
}

export interface LogEntry {
  id: number
  playerId: string
  /** Pre-rendered summary, e.g. "Vex purchased Sapphire Kiln". */
  text: string
  kind: 'take' | 'reserve' | 'purchase' | 'discard' | 'patron' | 'system'
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export interface TakeThreeAction {
  type: 'TAKE_THREE'
  /** Between 1 and 3 DISTINCT gem colours. Fewer than 3 only when the bank is short. */
  colors: GemColor[]
}

export interface TakeTwoAction {
  type: 'TAKE_TWO'
  color: GemColor
}

export interface ReserveVisibleAction {
  type: 'RESERVE_VISIBLE'
  cardId: string
}

export interface ReserveDeckAction {
  type: 'RESERVE_DECK'
  tier: Tier
}

export interface PurchaseAction {
  type: 'PURCHASE'
  cardId: string
  /**
   * Optional explicit payment. When omitted the engine computes the
   * gold-minimising payment. When supplied it must be exactly sufficient.
   */
  payment?: TokenPool
}

/** Returns tokens to the bank to satisfy the 10-token limit. */
export interface DiscardAction {
  type: 'DISCARD'
  tokens: TokenPool
}

/** Resolves a 'choosing-patron' phase. */
export interface ChoosePatronAction {
  type: 'CHOOSE_PATRON'
  patronId: string
}

export type GameAction =
  | TakeThreeAction
  | TakeTwoAction
  | ReserveVisibleAction
  | ReserveDeckAction
  | PurchaseAction
  | DiscardAction
  | ChoosePatronAction

/** The subset of action types that count as a player's single main action. */
export type MainAction =
  | TakeThreeAction
  | TakeTwoAction
  | ReserveVisibleAction
  | ReserveDeckAction
  | PurchaseAction

/* ------------------------------------------------------------------ *
 * Results
 * ------------------------------------------------------------------ */

export type Validity = { ok: true } | { ok: false; reason: string }

export type ActionResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string }

/* ------------------------------------------------------------------ *
 * Redacted (client-visible) state
 * ------------------------------------------------------------------ */

/**
 * What a single seat is allowed to know. Produced by `redactFor`.
 * Deck contents are replaced by counts; opponents' blind reserves are hidden.
 * The AI is handed ONLY this, which is what structurally prevents it cheating.
 */
export interface VisiblePlayerState extends Omit<PlayerState, 'reserved' | 'reservedHidden'> {
  /** Reserved cards this viewer may see. */
  reserved: string[]
  /** Count of reserved cards whose identity is hidden from this viewer. */
  hiddenReservedCount: number
}

export interface VisibleMarketTier {
  deckCount: number
  visible: (string | null)[]
}

export interface VisibleGameState
  extends Omit<GameState, 'players' | 'market' | 'rng'> {
  players: VisiblePlayerState[]
  market: Record<Tier, VisibleMarketTier>
  /** The seat this view was produced for. */
  viewerId: string
}
