# Architecture

## The one rule

> **The game engine is a pure, deterministic, framework-free TypeScript module.
> React never decides anything.**

`src/game/**` imports nothing from React, Zustand, Framer Motion, the DOM or `window`.
It is a library that could run in Node, in a Web Worker, or on a server. That is what makes
online multiplayer a later addition rather than a rewrite.

```
                    ┌──────────────────────────────────────┐
   user input  ───► │  React components (src/components)   │
                    └───────────────┬──────────────────────┘
                                    │ dispatch(Action)
                    ┌───────────────▼──────────────────────┐
                    │  Zustand store (src/store)           │  ← the *only* stateful glue
                    │  holds: GameState, UI selection,     │
                    │  animation queue, settings           │
                    └───────────────┬──────────────────────┘
                                    │ applyAction(state, action) → Result
                    ┌───────────────▼──────────────────────┐
                    │  ENGINE (src/game/engine)  — pure    │
                    │  (state, action, rng) → (state', log)│
                    └───────────────┬──────────────────────┘
                                    │ legalActions(state)
                    ┌───────────────▼──────────────────────┐
                    │  AI (src/game/ai) — pure             │
                    └──────────────────────────────────────┘
```

---

## Determinism contract

```ts
applyAction(state: GameState, action: GameAction): ActionResult
```

* **Pure.** No mutation of `state`; returns a new state (structural sharing where cheap).
* **Total.** Never throws for illegal input — returns `{ ok: false, error }`.
* **Deterministic.** All randomness comes from `state.rng`, a serialisable
  `{ seed: number }` counter-based PRNG (`mulberry32`). Advancing the RNG *is* a state change,
  so the RNG travels with the state.
* **Replayable.** `setup(options) → S0`; `S0 + [a1..an] → Sn` reproduces exactly, on any
  machine. `GameState` is JSON-serialisable with no `Map`, `Set`, `Date`, class instances or
  functions.

This is the property the tests lean on, and the property an authoritative server would need.

### Why this makes multiplayer a drop-in

An online build changes exactly one thing: *where* `applyAction` runs.

| | Local (today) | Online (later) |
|---|---|---|
| `dispatch` | calls `applyAction` in-process | sends `Action` over the wire |
| authority | the store | the server, running the *same* `applyAction` |
| sync | n/a | server broadcasts `{action, resultingStateHash}`; clients re-apply locally |
| hidden info | none (cards in hand are public in this game) | unchanged |

The store already funnels **every** mutation through a single `dispatch(action)` seam, and
actions are plain JSON. Nothing in `src/game` would change.

---

## Module map

### `src/game/engine`

| File | Responsibility |
|---|---|
| `types.ts` | Every game type. No logic. The vocabulary of the whole app. |
| `rng.ts` | Seeded PRNG, `shuffle`, `pick`. Serialisable state. |
| `gameState.ts` | State constructors, invariant checking (`validateState`), cloning helpers. |
| `setup.ts` | RULES §4 — builds `GameState` from `SetupOptions`. |
| `movement.ts` | RULES §7 — the route graph, step generation, occupancy, reachability. |
| `economy.ts` | RULES §10/§11 — storehouse capacity, receiving goods, paying costs, trade. |
| `cards.ts` | RULES §12 — the display: purchase pricing, compaction, refill. |
| `actions.ts` | RULES §6 — one resolver per card role. The heart of the engine. |
| `validation.ts` | `legalActions(state)` + per-action legality. Used by UI *and* AI. |
| `scoring.ts` | RULES §16 — `calculateScore(state, playerId) → ScoreBreakdown`. |
| `endGame.ts` | RULES §15 — trigger detection, final-turn bookkeeping. |
| `rules.ts` | Public façade: `applyAction`, `legalActions`, re-exports. **Import this.** |
| `log.ts` | Structured, replayable, human-readable event log entries. |

### `src/game/data`

Pure data, zero logic. Swapping a file here changes content, not behaviour.

| File | Contents |
|---|---|
| `ruleConstants.ts` | **Every tunable number in the game**, including all `RULE_REVIEW_REQUIRED` items. |
| `goods.ts` | The five goods, values, display order, palette. |
| `cards.ts` | The 7 starting cards + 30 cards for sale (role, god, deck numeral, cost). |
| `maps/mareNostrum.ts` | 30 cities, 12 provinces, ~90 routes, SVG geometry. |
| `maps/italiaAntiqua.ts` | Compact 24-city map. |
| `maps/index.ts` | Map registry — add a map by adding one entry. |
| `names.ts` | Roman AI names. |

### `src/game/ai`

| File | Responsibility |
|---|---|
| `moveGeneration.ts` | Turns `legalActions` into *candidate whole turns* (a card play plus its full parameterisation), which is the real decision unit. |
| `evaluation.ts` | `evaluatePosition(state, playerId) → number`. Shared by all difficulties. |
| `easy.ts` / `medium.ts` / `hard.ts` | Three policies over the same generator + evaluator. |
| `index.ts` | `chooseTurn(state, playerId, difficulty, rng) → GameAction[]` |

The AI returns a **sequence of engine actions**, never a mutated state. It therefore cannot
cheat, and every AI turn is replayable and animatable.

### `src/store`

Zustand. Three slices, deliberately separate:

* `gameSlice` — the authoritative `GameState` + `dispatch` + undo-free history for replay.
* `uiSlice` — selection, hover, current interaction phase, modals. Never affects rules.
* `settingsSlice` — animation speed, sound, persisted to `localStorage`.

### `src/components`

Presentational. A component may read state and call `dispatch`; it may **never** compute
legality, cost or score — it asks the engine.

---

## Interaction model: "phases" are a UI concept

The engine accepts fine-grained actions (`MOVE_COLONIST_STEP`, `BUILD_HOUSE`, `END_ACTION`).
The UI wraps them in a small state machine (`uiSlice.interaction`) that decides what is
clickable:

```
idle → cardSelected → (architect: moving → building) → resolving → idle
                    → (prefect:   choosingProvince)
                    → (mercator:  trading)
                    ...
```

Every clickable target is derived from `legalActions(state)` — filtered, not re-derived. That
is what guarantees the highlight rules in the UI can never disagree with the engine.

---

## Animation model

Engine actions produce **log events**; log events map to **animation intents**
(`{kind, from, to, payload}`) which the animation layer plays out of a queue. The board renders
the *current* state; in-flight animations are overlays. Consequences:

* Skipping an animation can never desync the board.
* "Instant" speed simply drains the queue without waiting.
* AI turns replay the same queue the human's turns produce.

---

## Rendering the map

The board is one SVG in a pan/zoom viewport.

* Map data supplies `{x, y}` for cities and a path spec for routes — **presentation only**.
* Rules never read coordinates. `movement.ts` sees an adjacency graph and nothing else.
* Routes are rendered as quadratic Béziers with a data-supplied curvature so land roads and sea
  lanes read differently; colonists animate along `getPointAtLength` of the very same path, so
  a piece can never visually cut a corner the rules do not allow.

---

## Asset interface

Card art is referenced by convention, never imported:

```
/public/assets/cards/<roleId>.webp     e.g. architect.webp, vintner.webp
/public/assets/sounds/<soundId>.mp3
```

`CardArt` renders the `.webp` if it loads, and otherwise renders a **procedural original SVG
illustration** for that role. Dropping real artwork into `/public/assets/cards/` upgrades the
game with no code change. The sound system is identical: `sound.play('coin')` is a no-op with a
console-silent miss when the asset slot is empty.

---

## Testing strategy

| Layer | Approach |
|---|---|
| Rules | Table-driven unit tests per rule number in `docs/RULES.md`. |
| Engine safety | `validateState` invariant checker asserted after **every** action in tests. |
| AI | Property test: every action an AI emits must be in `legalActions`. |
| Whole system | 100+ seeded AI-only games; assert termination, invariants, finite scores. |

`validateState` is the safety net: negative goods, over-capacity storehouses, duplicate houses,
two colonists on one route, malformed display, and impossible money all fail loudly.
