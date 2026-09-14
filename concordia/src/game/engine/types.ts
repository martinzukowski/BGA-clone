/**
 * The complete vocabulary of the game. No logic lives here.
 *
 * Everything in this file must be JSON-serialisable: no Map, Set, Date, class
 * instances or functions. That is what makes save/resume, replay, deterministic
 * tests and (later) an authoritative multiplayer server possible.
 *
 * See docs/RULES.md — rule numbers are cited throughout.
 */

/* ────────────────────────────────────────────────────────────── goods ── */

/** RULES 2.3 */
export type Good = 'brick' | 'food' | 'tool' | 'wine' | 'cloth';

/** A quantity of each good. Always all five keys; never negative. */
export type GoodsBag = Record<Good, number>;

/** A cost entry: a specific good, or `'any'` for a wildcard (RULES 12.2). */
export type CostItem = Good | 'any';

/* ────────────────────────────────────────────────────────────── gods ── */

/** RULES 16 */
export type God = 'vesta' | 'jupiter' | 'saturnus' | 'mercurius' | 'mars' | 'minerva';

/* ───────────────────────────────────────────────────────────── cards ── */

export type CardRole =
  | 'architect'
  | 'prefect'
  | 'mercator'
  | 'colonist'
  | 'diplomat'
  | 'senator'
  | 'consul'
  | 'tribune'
  | 'mason'
  | 'farmer'
  | 'smith'
  | 'vintner'
  | 'weaver';

export const SPECIALIST_ROLES = ['mason', 'farmer', 'smith', 'vintner', 'weaver'] as const;
export type SpecialistRole = (typeof SPECIALIST_ROLES)[number];

/** Deck numeral I–V. Cards with `deck > playerCount` are removed (RULES 4.5). */
export type DeckNumeral = 1 | 2 | 3 | 4 | 5;

/**
 * The immutable definition of a card *type*. Individual copies in a game are
 * `CardInstance`s that point back at one of these.
 */
export interface CardDefinition {
  /** Stable id of the definition, e.g. `'architect-jupiter-I'`. */
  readonly defId: string;
  readonly role: CardRole;
  readonly god: God;
  /** `undefined` for the 7 starting cards, which are never bought. */
  readonly deck?: DeckNumeral;
  /** Goods printed on the card itself (RULES 6.6). Empty for starting cards. */
  readonly cost: readonly CostItem[];
  /** Mercator only: sestertii taken in step 1 (3 for the starting card, 5 otherwise). */
  readonly mercatorMoney?: number;
  /** Specialists only: the good produced and scored. */
  readonly specialistGood?: Good;
  /** Specialists only: Minerva VP per matching city (RULES 16.6). */
  readonly minervaValue?: number;
  /** Display name, e.g. "Architectus". */
  readonly title: string;
  /** One-line action summary for the card face. */
  readonly summary: string;
}

export type CardId = string;

/** A single physical card in a game. */
export interface CardInstance {
  readonly id: CardId;
  readonly defId: string;
}

/* ─────────────────────────────────────────────────────────────── map ── */

export type CityId = string;
export type ProvinceId = string;
export type RouteId = string;

export type RouteType = 'land' | 'sea';

export interface CityDefinition {
  readonly id: CityId;
  readonly name: string;
  /** `null` for the capital, which belongs to no province (RULES 3.1). */
  readonly provinceId: ProvinceId | null;
  /** The capital produces nothing and may never be built in (RULES 8.7). */
  readonly isCapital?: boolean;
  /**
   * City-token group. Goods are shuffled *within* a group at setup so the global
   * distribution is fixed but the local geography is not (RULES 4.2).
   */
  readonly tokenGroup?: string;
  /** Presentation only — never read by rules. */
  readonly x: number;
  readonly y: number;
  /** Presentation only: where the name label sits relative to the city marker. */
  readonly labelAnchor?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
}

export interface ProvinceDefinition {
  readonly id: ProvinceId;
  readonly name: string;
  readonly cityIds: readonly CityId[];
  /**
   * Presentation only: an explicit polygon outlining the province. When absent
   * the renderer derives a smoothed hull from the member cities' coordinates.
   */
  readonly shape?: readonly (readonly [number, number])[];
  /** Presentation only: where the province name is drawn. Defaults to the centroid. */
  readonly labelX?: number;
  readonly labelY?: number;
  /** Presentation only: terrain tint key. */
  readonly terrain?: 'coast' | 'inland' | 'mountain' | 'desert' | 'island';
}

export interface RouteDefinition {
  readonly id: RouteId;
  readonly type: RouteType;
  readonly from: CityId;
  readonly to: CityId;
  /** Presentation only: Bézier bow, in SVG units, perpendicular to the chord. */
  readonly curve?: number;
}

export interface MapDefinition {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly capitalId: CityId;
  readonly cities: readonly CityDefinition[];
  readonly provinces: readonly ProvinceDefinition[];
  readonly routes: readonly RouteDefinition[];
  /**
   * Goods dealt to each token group at setup (RULES 4.2). The multiset for a
   * group must have exactly as many entries as the group has cities.
   */
  readonly tokenGroups: Readonly<Record<string, readonly Good[]>>;
  /** Presentation only: SVG viewBox. */
  readonly width: number;
  readonly height: number;
}

/* ─────────────────────────────────────────────────────────── players ── */

export type PlayerId = number;

export type PlayerColorId = 'crimson' | 'verdigris' | 'ochre' | 'azure' | 'obsidian';

export type ColonistType = 'land' | 'sea';
export type ColonistId = string;

/** RULES 7.1 — a colonist is in a city, or on a route. Never anywhere else. */
export type ColonistLocation =
  | { readonly kind: 'city'; readonly cityId: CityId }
  | { readonly kind: 'route'; readonly routeId: RouteId };

export interface Colonist {
  readonly id: ColonistId;
  readonly owner: PlayerId;
  readonly type: ColonistType;
  readonly location: ColonistLocation;
}

export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerState {
  readonly id: PlayerId;
  readonly name: string;
  readonly color: PlayerColorId;
  readonly isHuman: boolean;
  readonly difficulty?: AiDifficulty;

  readonly money: number;
  readonly goods: GoodsBag;
  /** Colonists still in the storehouse, occupying storage spaces (RULES 10.2). */
  readonly reserveColonists: Record<ColonistType, number>;
  /** Houses not yet built (RULES 2.1, 8.6). */
  readonly housesRemaining: number;

  readonly hand: readonly CardId[];
  /** Face-up played pile; the LAST element is the visible top card (RULES 5.2). */
  readonly discard: readonly CardId[];

  /** RULES 14 — set once the player's first Tribune has been played. */
  readonly hasScoredIntermediate: boolean;
  /** Score-marker position. Only meaningful with intermediate scoring on. */
  readonly vpMarker: number;
}

/* ───────────────────────────────────────────────── in-flight actions ── */

/**
 * What the engine is waiting for. `null` between turns.
 * The UI's clickable targets are always derived from this plus `legalActions`.
 */
export type PendingStep =
  | 'architect:move'
  | 'architect:build'
  | 'prefect:choose'
  | 'mercator:trade'
  | 'colonist:choose'
  | 'colonist:recruit'
  | 'diplomat:choose'
  | 'senator:buy'
  | 'consul:buy'
  | 'tribune:colonist'
  | 'done';

export interface PendingAction {
  /** The card played from hand this turn (already moved to the discard pile). */
  readonly cardId: CardId;
  /** The role currently being resolved — differs from the played card for a Diplomat copy. */
  readonly role: CardRole;
  /** The definition supplying parameters (e.g. Mercator 3₴ vs 5₴). */
  readonly effectiveDefId: string;
  /** Set when this resolution came from a Diplomat (RULES 6.5). */
  readonly copiedFrom?: { readonly playerId: PlayerId; readonly cardId: CardId };
  readonly step: PendingStep;

  /** Architect: movement steps still available (RULES 7.4). */
  readonly movementRemaining?: number;
  /** Mercator: trades made this action. At most 2 distinct goods types (RULES 11.2). */
  readonly trades?: readonly { readonly good: Good; readonly direction: 'buy' | 'sell' }[];
  /** Senator: purchases still allowed (RULES 6.6). */
  readonly purchasesRemaining?: number;
  /** True once a purchase happened, so the display is compacted at action end. */
  readonly displayDirty?: boolean;
  /** Colonist / Tribune: how many colonists have been placed so far. */
  readonly colonistsPlaced?: number;
  /**
   * Set when a Prefect *production* was resolved by the Praefectus Magnus holder,
   * so the card is passed on at the end of the turn (RULES 13.3).
   */
  readonly praefectusUsed?: boolean;
}

/* ───────────────────────────────────────────────────────────── state ── */

export interface RngState {
  readonly seed: number;
}

/** RULES 4.3 — one per province. */
export interface BonusMarker {
  readonly good: Good;
  /** `true` = goods side up and available to produce (RULES 6.2a). */
  readonly active: boolean;
}

export type GamePhase = 'playing' | 'finalTurns' | 'finished';

export interface GameSettingsSnapshot {
  readonly intermediateScoring: boolean;
}

export interface GameState {
  /** Save-format version, for migrating localStorage saves. */
  readonly version: number;
  readonly rng: RngState;
  readonly mapId: string;
  readonly settings: GameSettingsSnapshot;

  readonly players: readonly PlayerState[];
  /** Index into `players`; play is clockwise, wrapping (RULES 5.1). */
  readonly currentPlayer: PlayerId;

  /** Randomised at setup (RULES 4.2). The capital is absent. */
  readonly cityGoods: Readonly<Record<CityId, Good>>;
  /** Owners of the houses in each city, in build order (RULES 8.4 crowding). */
  readonly houses: Readonly<Record<CityId, readonly PlayerId[]>>;
  readonly colonists: readonly Colonist[];
  readonly bonusMarkers: Readonly<Record<ProvinceId, BonusMarker>>;

  /** All card instances in the game, by id. */
  readonly cards: Readonly<Record<CardId, CardInstance>>;
  /** Length 7; `null` is an emptied slot awaiting compaction (RULES 12.1). */
  readonly display: readonly (CardId | null)[];
  /** Face-down draw stack; index 0 is the top. */
  readonly stack: readonly CardId[];

  readonly praefectusMagnus: PlayerId;
  /** RULES 15.2 — who took the Concordia card, if anyone. */
  readonly concordiaHolder: PlayerId | null;

  readonly phase: GamePhase;
  /** Players who still owe a final turn, in order (RULES 15.3). */
  readonly finalTurnQueue: readonly PlayerId[];

  readonly pending: PendingAction | null;

  readonly turnNumber: number;
  readonly roundNumber: number;
  readonly log: readonly LogEntry[];
}

/* ─────────────────────────────────────────────────────────── actions ── */

/**
 * Everything a player can do. Plain JSON — these are exactly the messages an
 * online build would send over the wire.
 */
export type GameAction =
  | { readonly type: 'PLAY_CARD'; readonly cardId: CardId }
  /** Architect. `path` is the ordered list of routes traversed (RULES 7.2). */
  | { readonly type: 'MOVE_COLONIST'; readonly colonistId: ColonistId; readonly path: readonly RouteId[] }
  | { readonly type: 'END_MOVEMENT' }
  | { readonly type: 'BUILD_HOUSE'; readonly cityId: CityId }
  /** Prefect (RULES 6.2). */
  | { readonly type: 'PREFECT_PRODUCE'; readonly provinceId: ProvinceId; readonly goodsPreference?: readonly Good[] }
  | { readonly type: 'PREFECT_CASH' }
  /** Mercator (RULES 6.3). One good type per action; at most two per turn. */
  | { readonly type: 'TRADE'; readonly good: Good; readonly direction: 'buy' | 'sell'; readonly quantity: number }
  /** Colonist (RULES 6.4). */
  | { readonly type: 'RECRUIT_COLONIST'; readonly colonistType: ColonistType; readonly cityId: CityId }
  | { readonly type: 'COLONIST_MONEY' }
  /** Diplomat (RULES 6.5). */
  | { readonly type: 'DIPLOMAT_COPY'; readonly targetPlayerId: PlayerId }
  /** Senator / Consul (RULES 6.6, 6.7). `wildcards` pays the `'any'` entries in order. */
  | { readonly type: 'BUY_CARD'; readonly position: number; readonly wildcards?: readonly Good[] }
  /** Tribune (RULES 6.8 step 3). */
  | { readonly type: 'TRIBUNE_COLONIST'; readonly colonistType: ColonistType }
  /** Finish the current card and pass the turn (RULES 5.5). */
  | { readonly type: 'END_ACTION' };

export type GameActionType = GameAction['type'];

/* ─────────────────────────────────────────────────────────────── log ── */

export type LogEventKind =
  | 'game-start'
  | 'turn-start'
  | 'card-played'
  | 'diplomat-copy'
  | 'colonist-moved'
  | 'house-built'
  | 'production'
  | 'bonus-received'
  | 'cash-bonus'
  | 'markers-reset'
  | 'trade'
  | 'money'
  | 'colonist-recruited'
  | 'card-bought'
  | 'display-refilled'
  | 'cards-recovered'
  | 'goods-lost'
  | 'praefectus-passed'
  | 'intermediate-scoring'
  | 'end-triggered'
  | 'game-over';

/**
 * A structured, replayable record of what happened. The animation layer maps
 * these to visual intents; the UI log renders `text`.
 */
export interface LogEntry {
  readonly id: number;
  readonly turn: number;
  readonly kind: LogEventKind;
  readonly playerId: PlayerId | null;
  readonly text: string;
  /** Free-form, kind-specific payload used by animations. */
  readonly data?: Readonly<Record<string, unknown>>;
}

/* ─────────────────────────────────────────────────────────── results ── */

export interface ActionSuccess {
  readonly ok: true;
  readonly state: GameState;
  /** Log entries produced by *this* action, for animation. */
  readonly events: readonly LogEntry[];
}

export interface ActionFailure {
  readonly ok: false;
  readonly error: string;
  /** Machine-readable reason, for tests and UI tooltips. */
  readonly code: string;
}

export type ActionResult = ActionSuccess | ActionFailure;

/* ─────────────────────────────────────────────────────────── scoring ── */

export interface ScoreLine {
  readonly god: God | 'concordia';
  /** How many cards of this god the player owns (1 for the Concordia card). */
  readonly cards: number;
  /** The achievement value, before multiplying by `cards`. */
  readonly perCard: number;
  readonly points: number;
  /** Human-readable explanation of *why*, shown on the scoring screen. */
  readonly explanation: string;
}

export interface ScoreBreakdown {
  readonly playerId: PlayerId;
  readonly lines: readonly ScoreLine[];
  readonly total: number;
}

export interface FinalStanding {
  readonly playerId: PlayerId;
  readonly rank: number;
  readonly breakdown: ScoreBreakdown;
  /** True if this player won on the Praefectus Magnus tiebreak (RULES 16.8). */
  readonly wonTiebreak: boolean;
}

/* ────────────────────────────────────────────────────────────── setup ── */

export interface PlayerSetupOptions {
  readonly name: string;
  readonly isHuman: boolean;
  readonly difficulty?: AiDifficulty;
  readonly color?: PlayerColorId;
}

export interface SetupOptions {
  readonly seed: number;
  readonly mapId: string;
  readonly players: readonly PlayerSetupOptions[];
  readonly intermediateScoring?: boolean;
  /** Skip the random shuffle of turn order (tests). */
  readonly keepPlayerOrder?: boolean;
}
