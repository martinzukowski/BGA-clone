# IMPERIVM MERCATORVM

An original, offline, single-player digital board game: a Roman trading and
economic strategy game in the *Concordia* tradition, played against one to four
computer opponents.

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # 120 tests, including 120 complete AI-only games
npm run build    # production bundle
npm run lint
```

---

## What it is

You are a Roman merchant house. Every turn you play **one personality card** —
that is the whole of your turn — sending colonists along roads and sea lanes,
raising houses in the cities they reach, and turning the goods those cities
produce into a trade network worth more than anyone else's.

The cards are also the scoring engine. Each belongs to a god, and at the end
each god converts a board achievement into points *multiplied by how many of
that god's cards you hold*. Two Saturnus cards and seven provinces is fourteen
points; four Saturnus cards and the same seven provinces is twenty-eight.

The complete rules are in **[docs/RULES.md](docs/RULES.md)**, and are also
readable in-game under *How to Play*.

### What's in the box

* Two original maps — **Mare Nostrvm** (30 cities, 12 provinces, 2–5 players)
  and **Italia Antiqva** (24 cities, 11 provinces, 2–4 players)
* All thirteen personality roles, fully implemented, including the Diplomat's
  copying, the Tribune's recovery cycle and the Praefectus Magnus
* Three genuinely different AI difficulties
* Save and resume, animation-speed control, an in-game rules reference and a
  development debug panel

---

## Architecture in one line

> **The game engine is a pure, deterministic, framework-free TypeScript module.
> React never decides anything.**

```
components ──dispatch(action)──▶ store ──applyAction(state, action)──▶ ENGINE
                                                                        ▲
                                            AI ──chooseTurn()───────────┘
```

`src/game/**` imports nothing from React, Zustand, Framer Motion or the DOM —
enforced by an ESLint rule, not just by convention. `applyAction(state, action)`
is pure, total (it returns `{ok:false, error}` rather than throwing) and
deterministic: all randomness comes from a seeded PRNG that lives *inside* the
state, so a game replays exactly from `{seed, actions[]}`.

That is what makes online multiplayer a later addition rather than a rewrite:
every mutation already goes through one `dispatch(action)` seam, and actions are
plain JSON. An online build changes *where* `applyAction` runs, and nothing else.

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the module map and the
animation, rendering and testing strategies.

---

## Rule accuracy

Rules were researched from the publisher's own rulebook, setup sheet and card
overview. The engine reproduces the rulebook's worked scoring example exactly
(114 points — see `scoring.test.ts`).

Where a rule or constant could **not** be confirmed from a primary source it is
marked `RULE_REVIEW_REQUIRED`, documented in the register at the end of
[docs/RULES.md](docs/RULES.md), and lives as a single named constant in
[`src/game/data/ruleConstants.ts`](src/game/data/ruleConstants.ts). Correcting
one of those is a one-line change; no rule logic needs to move.

Nine such items exist — mostly card-display position surcharges and two of the
five specialist VP values.

---

## Testing

| Suite | What it proves |
|---|---|
| `setup.test.ts` | Opening position, deck composition, and structural integrity of both maps |
| `actions.test.ts` | 72 tests, one or more per numbered rule, for every card |
| `scoring.test.ts` | Each god in isolation, plus the rulebook's own 114-point example |
| `endgame.test.ts` | Both end triggers, the final-turn sequence, the tiebreak |
| `simulation.test.ts` | **120 complete AI-only games**, asserting invariants after *every action* |
| `smoke.test.ts` | Purely random legal play always terminates and stays valid |

The safety net is `validateState`, an invariant checker covering negative goods,
over-capacity storehouses, duplicate houses, two colonists on one route,
malformed card displays and impossible money. The simulation harness runs it
after every single action of every game.

The AI suite also asserts the difficulties are really different players: over
seeded head-to-head runs, hard beats easy and medium beats easy decisively, and
hard beats medium.

---

## Art & IP

Everything visual here was made for this project: the maps, the coastline, the
goods and god iconography, the pieces, the card frames and all thirteen card
illustrations (layered SVG scenes, drawn from scratch). No artwork, board
graphics, card illustrations, logos or other proprietary assets from any
published edition are reproduced. The two typefaces are open Google fonts.

Card art has a drop-in upgrade path: put a painted illustration at
`/public/assets/cards/<role>.webp` and it replaces the drawing automatically,
with no code change. Sound works the same way — `sound.play('coin')` is a silent
no-op until `/public/assets/sounds/coin.mp3` exists.

---

## Project layout

```
docs/            RULES.md · ARCHITECTURE.md · IMPLEMENTATION_PLAN.md
src/game/
  engine/        the deterministic rules engine (framework-free)
  ai/            candidate turn generation, evaluation, three difficulties
  data/          maps, cards, goods, and every tunable constant
  __tests__/     rule tests + the AI simulation harness
src/components/  Board · Map · City · Route · Colonist · PlayerBoard · Hand
                 PersonalityCard · Market · ActionPanel · Modals · Screens
src/store/       the single dispatch seam (Zustand) + settings
```
