# Gemwright

A local, single-player gem-trading engine builder: you against one to three bots, in the
browser, with no backend and no accounts.

```bash
cd splendor      # from the root of the BGA-clone repo
npm install
npm run dev      # http://localhost:5173
npm test         # engine + AI + 300-game simulation suite
npm run build    # typecheck + production bundle
npm run lint
```

Names, card text, colours and layout styling are original to this project. The artwork is
public-domain painting from Wikimedia Commons — see [CREDITS.md](CREDITS.md). The mechanics
are the familiar gem/card/patron family; no content is copied from any published game.

---

## Architecture

The single most important property of this codebase: **the game engine knows nothing about
React, the DOM, `localStorage`, `Math.random` or `Date`.** It is a pure function library over
plain JSON. Everything else is a client of it.

```
        React UI                          Bot (easy / medium / hard)
            │                                        │
   GameAction│                             GameAction│
            ▼                                        ▼
        ┌──────────────────────────────────────────────┐
        │  applyAction(state, playerId, action)        │
        │    1. validation.ts   — is this legal?       │
        │    2. actions.ts      — apply it immutably   │
        │    3. resolveTurnEnd  — tokens, patrons, end │
        └──────────────────────────────────────────────┘
                              │
                          GameState
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              UI renders it       redactFor(state, seat)
                                         │
                                         ▼
                                 VisibleGameState → Bot
```

### `src/game/engine/`

| File | Responsibility |
|---|---|
| `types.ts` | Every domain type. All plain JSON — no `Map`, `Set`, `Date` or class instances, so a `GameState` round-trips through `JSON.stringify` losslessly. |
| `rules.ts` | Constants and pure derivations (`playerBonuses`, `discountedCost`, `determineWinners`, token scaling…). |
| `validation.ts` | **The** rule layer. `canTakeThree`, `canTakeTwoSame`, `canReserveVisible`, `canReserveDeck`, `canPurchaseCard`, `canPurchaseReservedCard`, `calculatePurchaseCost`, `canDiscard`, `canAcquirePatron`. Each returns `{ok:true}` or `{ok:false, reason}`. |
| `actions.ts` | `applyAction` — the only way state changes. Also `legalMainActions`, which is the move generator every bot draws from. |
| `setup.ts` | Deterministic game construction from `{seed, bots}`. |
| `scoring.ts` | End-of-game summary. |
| `gameState.ts` | `redactFor` (hidden-information boundary), serialization, and `checkInvariants`. |

**Rules are never enforced in the UI.** The UI *asks* the validation layer and uses its
`reason` string as the disabled-button tooltip, so an explanation can never drift from the
rule it explains.

### Determinism

The RNG is a seeded mulberry32 whose entire state (`{seed, cursor}`) lives *inside*
`GameState`. A state snapshot therefore fixes every future draw. That gives three things for
free: `?seed=12345` reproduces a game exactly, a restored save resumes at precisely the right
point in the shuffle, and the simulation tests can print a failing seed.

### Hidden information

`redactFor(state, seatId)` produces a `VisibleGameState`: deck arrays are replaced by counts,
and another player's face-down reserved cards are replaced by a count. This is exactly what a
server would send one client — and it is what makes the bots honest, structurally rather than
by convention (see below).

---

## The AI

```ts
chooseAction(view: VisibleGameState, playerId, difficulty, rng): GameAction | null
```

Bots receive **only** a redacted view and emit **only** a `GameAction` — the same contract a
remote human would have, so the two are interchangeable later.

**Easy** (`ai/easy.ts`) — picks at random from `legalMainActions` with a light type weighting.
It never makes an illegal move and will buy an affordable card fairly often, but it hoards
useless tokens and has no plan.

**Medium** (`ai/medium.ts`) — scores every legal action with `scoreAction` and picks from the
top three with weighted randomness. The heuristic weighs affordability, prestige, bonus-colour
demand, patron progress, the token limit, gold cost and light denial. Competent, and
exploitable because it never looks past this turn.

**Hard** (`ai/hard.ts`) — determinized Monte-Carlo:

1. `determinize()` reconstructs a *plausible* full state: unknown cards are dealt into the
   decks from the bot's own RNG. This is card-counting, not cheating.
2. The heuristic filters ~30 legal actions down to the best 7.
3. Each candidate is applied through the real engine, then rolled out for a few rounds with a
   fast greedy policy for every seat, over several fresh determinizations.
4. Leaves are scored with `evaluatePosition` — a **differential** evaluation (my strength
   minus the strongest opponent's), because winning is relative. It accounts for prestige,
   engine strength with diminishing returns, patron progress, demand-weighted token value,
   gold, reserve quality, turns-to-afford across the market, and proximity to the threshold.
5. An immediate winning purchase short-circuits the whole search.

Search width/depth is configurable (`HardConfig`), so the simulation suite can run a cheaper
Hard without changing its behaviour in kind.

### Why the bots cannot cheat

This is enforced by construction, not by discipline:

- they are only ever handed the output of `redactFor`, so `market[t].deck` and other players'
  `reservedHidden` are not in scope at all;
- every move comes from `legalMainActions`, and the engine re-validates it anyway;
- simulations use a throwaway RNG seeded from the bot's own stream, never the game's, so a
  rollout cannot predict the real next draw;
- they receive no extra tokens, cards or turns — `applyAction` is the same code path the human
  uses.

The test suite asserts the first two directly.

---

## Tests

```
npm test
```

- **`engine.test.ts`** — 56 cases: deck composition, token scaling per player count, market
  setup and replenishment, take-three / take-two (including the "bank had ≥4" rule and the
  short-draw case), discounts, gold substitution, tokens returning to the bank, reserving
  (limit of 3, gold grant, blind draws staying hidden), the token limit and its discard step,
  patron qualification (tokens never count) and the one-per-turn cap, the end-game trigger and
  equal-turns final round, tie-breaking, scoring, serialization, redaction, and the
  affordability breakdown the UI renders from (including that it agrees with the engine).
- **`ai.test.ts`** — honesty of the redaction boundary and determinizer, plus a legality sweep
  where each difficulty drives *every* seat across many seeds; each proposed action is checked
  against `validateAction` before it is applied.
- **`simulation.test.ts`** — 300 complete bot-vs-bot games plus dedicated Hard games, with
  `checkInvariants` re-run after **every ply**: token conservation, card conservation and
  uniqueness, no negative resources, market refill, reserve limit, token limit, patron
  bookkeeping. Also asserts termination, result consistency, and seed reproducibility.
- **Difficulty ladder** — a statistical check that the levels are genuinely different.
  Measured head-to-head with the reduced search: medium beats easy **97%**, hard beats easy
  **100%**, hard beats medium **71%**. Thresholds are set below those with margin.

---

## UI notes

### The table

Laid out like a physical game table, so everything fits on one desktop screen without
scrolling:

```
 TopBar  · round · turn · bots · Fast AI · Rules · New game
 Turn banner — "Your turn" / "Vex is thinking…" / picked gems with Confirm · Cancel
┌───────────────────────────────────────────────────────────┬──────────────┐
│ [III deck] card card card card   ● bank      ▣ patron     │ player board │
│ [II  deck] card card card card   ● column    ▣ column     │  (all seats, │
│ [I   deck] card card card card   ● + gold                 │   you incl.) │
│               [ My Gems: bonus│tokens × 5, gold, n/10 ]   │              │
│ [ My Reserved Cards  n/3 ]   [ My Patrons ]               │ log          │
└───────────────────────────────────────────────────────────┴──────────────┘
```

Below `xl` the bank and patron columns turn into rows under the market, and the sidebar
moves below the table.

- **Cards** are compact and full-bleed: prestige top-left, permanent bonus top-right on a
  band tinted in the bonus colour, cost as a column of coins down the bottom-left. Hover a
  card for Purchase / Reserve; its name and full verdict are in the tooltip.
- **Decks** show cards remaining and the tier as pips; hover for a blind reserve.
- **Patrons** waiting to be claimed stand in a column; once claimed they move to the
  owner's board, where they now score.
- **Picking gems** works from the bank column: click a gem to pick it, click the same gem
  again (with nothing else picked) to take two. The turn banner shows the picks as chips
  — click one to put it back — with Confirm and Cancel. Confirm is enabled straight from
  the engine's validators, and its disabled tooltip is the engine's own reason.

### Card art

Every card and patron is a **public-domain painting** from Wikimedia Commons (25 files,
~1.3 MB, in `public/art/`). Credits are in [CREDITS.md](CREDITS.md) and in-game under
*Rules → Art*.

| | Theme | Examples |
|---|---|---|
| Tier I | raw sources | *Hunters in the Snow*, *Eruption of Vesuvius*, *Return from the Mine* |
| Tier II | workshops and trade | *An Iron Forge*, *The Moneylender and His Wife*, *The Lacemaker* |
| Tier III | grand works | *The Tower of Babel*, *The Night Watch*, Bellotto's Grand Canal |
| Patrons | portraits | Holbein's *Erasmus* and *Thomas More*, Raphael's *Julius II*, Vermeer's *Geographer* |

One painting per tier and bonus colour, chosen for its palette. Cards that share a
painting each show a **different slice** of it: the paintings are landscape and the cards
portrait, so `utils/art.ts` slides each card's crop across the canvas by its index within
the group — eight Tier I white cards are eight views of *Hunters in the Snow*, not eight
copies.

Every file's license was read from Commons metadata at download time and only *Public
domain* or *CC0* was accepted. The license and source URL in `src/game/data/art.ts` are
verbatim from that metadata; titles, artists and dates were hand-curated because the raw
metadata mixes in Wikidata tags and other languages.

### Reading your purchasing power

Affordability is computed once, in `engine/rules.ts` → `affordability(player, card)`, and
every surface renders from that single breakdown so they cannot disagree:

- **Cost coins** show the **effective** cost after your permanent bonuses. A colour you
  cannot cover from tokens gets a red rim and a `−n` tag. A card you can buy right now gets
  a brass frame; if it would take wilds, a gold tag says how many.
- **My Gems** pairs, per colour, the stack of cards giving a permanent discount with the
  loose tokens you hold, so a colour's buying power reads as one unit. Hovering a card
  re-reads it against that card: irrelevant colours fade, short colours get a red `−n`,
  gold reports the wilds it would need, and a line underneath spells out the verdict.

A test asserts that `affordability().affordable` agrees with the engine's
`canPurchaseCard` at every token level, so a card can never claim "can buy" where the rules
disagree.

### Gem flights

Picking a gem tosses it, on an arc, from the bank into its chip in **My Gems**, where it
lands with a pulse; the slot shows a brass `+n` until you confirm or cancel. Reserving
flies the gold wild the same way, and any token that arrives floats a `+n` — gold
especially, since it otherwise arrives silently as a side effect of reserving. The flight
resolves its destination from the DOM at run time. Its state lives in a tiny event bus
(`utils/gemFlight.ts`), deliberately not in the store and never in `GameState`.

### Everything else

- Reserve buttons show in advance whether a gold wild comes with the reservation; when the
  supply is empty the tooltip says so and the gold stack's count turns red.
- Disabled actions carry the engine's own explanation ("Cannot reserve: you already hold 3
  reserved cards.").
- Bots pause 400–900 ms before acting and then report what they did on their board and in
  the turn banner. *Fast AI* in the top bar reduces this to near-zero.
- Animations honour `prefers-reduced-motion`, gem flights included.

## Persistence

The game is written to `localStorage` after every action. Refreshing offers **Continue game**
or a new one. Saves carry a schema `version` and are validated on load; a save from an
incompatible build is discarded rather than crashing the app.

## Debug

- `?seed=12345` starts a reproducible game (and pins that seed for subsequent New Games, so
  drop the parameter to get random shuffles again).
- In `npm run dev`, the **Debug** button opens a panel with round, turn, phase, deck *sizes*,
  seed, RNG cursor, last action, per-player state, and a live invariant check. It deliberately
  never reveals deck contents.
- Also in dev only, `window.__gemwright` exposes the Zustand store for console poking.

## What is deliberately not here

No networking. The seams for it exist and are load-bearing today rather than speculative:
`GameState` and `GameAction` are serializable, `applyAction(state, playerId, action)` already
has a server route's signature, `redactFor` is already the per-seat projection, and the AI
already talks through that same boundary. Adding a server means moving `applyAction` behind a
socket — the rules, the AI and the components do not change.

Per-seat bot difficulty is already modelled (`BotConfig` carries its own `difficulty`, and
`chooseAction` takes one per call); only the setup UI currently applies one choice to every
bot.
