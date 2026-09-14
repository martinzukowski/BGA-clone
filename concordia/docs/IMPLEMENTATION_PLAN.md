# Implementation Plan

Ordered by dependency, not by visibility. Nothing visual is polished while a rule below it is
still wrong.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 1 — Rules specification
- [x] Research primary sources (publisher rulebook, setup sheet, card overview sheet)
- [x] `docs/RULES.md` with numbered, traceable rules
- [x] Register every uncertain constant as `RULE_REVIEW_REQUIRED`
- [x] `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`

## Phase 2 — Data model
- [x] `engine/types.ts` — full state, action and result vocabulary
- [x] `engine/rng.ts` — serialisable seeded PRNG
- [x] `data/ruleConstants.ts` — every tunable number in one file
- [x] `data/goods.ts`, `data/cards.ts` (7 starting + 30 for sale)
- [x] `data/maps/mareNostrum.ts` — 30 cities / 12 provinces / route graph
- [x] `data/maps/italiaAntiqua.ts` — compact 24-city map
- [x] `engine/gameState.ts` — constructors + `validateState` invariant checker

## Phase 3 — Deterministic engine core
- [x] `engine/setup.ts` (RULES §4)
- [x] `engine/movement.ts` (RULES §7)
- [x] `engine/economy.ts` (RULES §10, §11)
- [x] `engine/cards.ts` — display pricing / compaction / refill (RULES §12)
- [x] `engine/log.ts`

## Phase 4 — Every personality card
- [x] Architect — movement allowance, step legality, occupancy, build phase
- [x] Prefect — production & cash bonus, marker flipping, Praefectus Magnus
- [x] Mercator — 3₴/5₴, two-type trade restriction
- [x] Colonist — recruit / money
- [x] Diplomat — copy legality, resolution with copier's resources
- [x] Senator — two purchases, position surcharges, wildcards
- [x] Consul — one purchase, ignore position surcharge
- [x] Tribune — recovery, excess payment, optional colonist, intermediate scoring
- [x] Specialists ×5
- [x] `engine/validation.ts` — `legalActions` for every phase
- [x] `engine/rules.ts` — public façade

## Phase 5 — Scoring & end game
- [x] `engine/scoring.ts` — all six gods + Concordia, detailed breakdown with explanations
- [x] `engine/endGame.ts` — triggers, final turns, ranking, tiebreak

## Phase 6 — Tests
- [x] Unit tests per rule section
- [x] `validateState` asserted after every action
- [x] 120 seeded AI-only games: termination, invariants, legality, finite scores

## Phase 7 — AI
- [x] `ai/moveGeneration.ts` — candidate *whole turns*
- [x] `ai/evaluation.ts` — shared positional evaluation
- [x] `ai/easy.ts` — noisy, shallow, deliberately imperfect
- [x] `ai/medium.ts` — greedy over a full evaluation
- [x] `ai/hard.ts` — evaluation + opponent-aware lookahead + endgame timing

## Phase 8 — Functional UI
- [x] Zustand store, dispatch seam, save/resume
- [x] Setup screen, board, player panels, hand, market, action panel

## Phase 9 — Board & map polish
- [x] Parchment/ocean textures, province shading, engraved route styling
- [x] Pan / zoom / fit, hover tooltips for city, province, route, colonist, house

## Phase 10 — Card art system
- [x] Procedural original SVG portraits per role + `/public/assets/cards/*.webp` slot
- [x] Original goods, coin, house, ship and colonist iconography

## Phase 11 — Animations
- [x] Card play, colonist travel along real paths, construction, production, market flow
- [x] Animation speed: Normal / Fast / Instant, plus `prefers-reduced-motion`

## Phase 12 — Systems
- [x] Sound abstraction with documented empty asset slots
- [x] localStorage save/resume, settings, main menu
- [x] How to Play

## Phase 13 — UX & visual consistency pass
- [x] Contextual guidance, legal-move highlighting, end-game score reveal

## Phase 14 — Verification
- [x] `npm test` — 120 tests green
- [x] `npm run build` — clean
- [x] `npm run lint` — clean, including a rule that forbids React/Zustand/Framer
      imports anywhere under `src/game/**`
- [x] Played through in a real browser at 1920×1080 and 1366×768: card play,
      colonist selection and movement, construction, province production,
      trading, card purchase, AI turns, end-game trigger and the scoring screen
- [x] No console errors

---

## Defects found and fixed during the browser pass

Recorded because each one is the kind of thing only a real play-through surfaces.

| Symptom | Cause | Fix |
|---|---|---|
| Every board click did nothing | Panning called `setPointerCapture`, which retargets `pointerup` and makes the browser fire the click on the container instead of the city/route/colonist | Drag via `window` listeners; never capture |
| Zoom and fit controls dead | Same pointer capture swallowed clicks on the controls floating over the board | Controls marked `data-map-ui` and exempted |
| Camera snapped back mid-pan | The `ResizeObserver` fired on its own state update (the SVG was sized in pixels), re-fitting continuously | SVG sized by CSS; observer re-fits only on a real size change |
| Action panel stuck on the previous step's buttons | `AnimatePresence mode="wait"` never completed the exit | Keyed `motion.div` without `AnimatePresence` |
| Card preview stayed open after the pointer left | Framer's `onHoverEnd` does not fire reliably when a card is re-laid-out under the cursor | Touching the board clears the preview |
| AI turns froze when the tab was backgrounded | Browsers throttle background timers; the paced AI loop stalled for minutes | Pacing drops to zero while `document.hidden` |
| Wheat-sheaf icon logged an SVG error 54× | A negative sign interpolated into a path as `--3.4` | Sign folded into the computed number |
| Board squeezed to 256 px tall at 1366×768 | Fixed furniture heights | Compact layout below 900 px viewport height (board 256 → 323 px) |
| Landmass a spindly web, then an over-merged continent | Province hulls alone were too thin; then discs plus road bands were too fat and closed the sea | Coastline is the union of city discs and road bands at tuned radii, with province tints clipped to it by an SVG mask |
