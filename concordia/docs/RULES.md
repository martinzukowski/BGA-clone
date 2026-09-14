# IMPERIVM MERCATORVM — Complete Rules Specification

> **Version 1.0** — this document is the *authoritative* rules specification for the game engine.
> Every rule implemented in `src/game/engine` must be traceable to a numbered rule here.
>
> **Design lineage.** This game is an original digital implementation of a *Concordia-style*
> Roman economic strategy game. The mechanical rule-set below was researched from the
> publicly available Rio Grande Games / PD-Verlag rulebook and setup sheets for *Concordia*
> (game rules are not copyrightable; presentation is). **No artwork, board graphics, card
> illustrations, logos, fonts, city layouts or other proprietary visual assets are copied.**
> The maps (`Mare Nostrum`, `Italia Antiqua`), all card art, all iconography and the entire
> visual identity are original works created for this project.
>
> **Uncertainty policy.** Where a rule or constant could not be confirmed from a primary
> source, it is marked **`RULE_REVIEW_REQUIRED`** here *and* in
> [`src/game/data/ruleConstants.ts`](../src/game/data/ruleConstants.ts), where it lives as a
> single named constant so it can be corrected in one place without touching game logic.

---

## Table of contents

1. [Overview & objective](#1-overview--objective)
2. [Components](#2-components)
3. [The map](#3-the-map)
4. [Setup](#4-setup)
5. [Turn structure](#5-turn-structure)
6. [Personality cards — full action reference](#6-personality-cards--full-action-reference)
7. [Movement](#7-movement)
8. [Construction](#8-construction)
9. [Production](#9-production)
10. [The storehouse](#10-the-storehouse)
11. [Trade](#11-trade)
12. [The card display (market)](#12-the-card-display-market)
13. [Praefectus Magnus](#13-praefectus-magnus)
14. [Intermediate scoring](#14-intermediate-scoring)
15. [End of game](#15-end-of-game)
16. [Final scoring](#16-final-scoring)
17. [Rule review register](#17-rule-review-register)

---

## 1. Overview & objective

**1.1** 2–5 players (this build: 1 human + 1–4 AI). Each player is a Roman merchant house
expanding a trade network across the Mediterranean.

**1.2** A player's turn is: **play exactly one personality card from hand and resolve it.**
There are no other actions.

**1.3** Personality cards are *both* the action system *and* the scoring system. Each card is
dedicated to a god; at game end each god converts a specific board achievement into victory
points, multiplied by the number of that god's cards you own.

**1.4** The player with the most victory points at the end wins.

---

## 2. Components

**2.1 Per player** (`PLAYER_COMPONENTS`):

| Component | Count |
|---|---|
| Houses | 15 |
| Land colonists | 3 |
| Sea colonists | 3 |
| Storehouse storage spaces | 12 |
| Starting personality cards | 7 |

**2.2** Maximum colonists on the board per player: **6** (3 land + 3 sea). *(Confirmed:
"The number of colonists is restricted to 6 per player.")*

**2.3 Goods** — five types, with a fixed market value used for buying, selling, construction
cost tiers, bonus-marker assignment and Vesta scoring:

| Good | Value (sestertii) |
|---|---|
| Brick | 3 |
| Food | 4 |
| Tool | 5 |
| Wine | 6 |
| Cloth | 7 |

**2.4** Goods and coins in the bank are **unlimited**. Players may never trade goods with
each other.

**2.5** 30 city tokens (one per non-capital city), 1 bonus marker per province,
1 Concordia card, 1 Praefectus Magnus card.

---

## 3. The map

**3.1** A map is a **graph**, defined entirely as data (`MapDefinition`). It contains:

* **Cities** — nodes. Each belongs to exactly one province, except the capital.
* **The capital** (`Roma`) — belongs to no province, produces no goods, and **no house may
  ever be built there** (rule 8.7).
* **Provinces** — disjoint groups of 2–3 cities.
* **Routes** — undirected edges between two cities, each of type `land` or `sea`.

**3.2** Land colonists travel **only** on land routes; sea colonists **only** on sea routes.

**3.3 A route may be occupied by at most one colonist at a time** (any player's). This is a
hard constraint on where a move may *end*, not on pass-through (rule 7.6).

**3.4** Two maps ship with this build; both are original designs:

| Map | Cities (excl. capital) | Provinces | Players |
|---|---|---|---|
| `mare-nostrum` | 30 | 12 | 2–5 |
| `italia-antiqua` | 24 | 11 | 2–4 |

**3.5** City goods are **randomised at setup** (rule 4.2), so no two games have the same
economic geography. Rendering never reads gameplay data from SVG coordinates; coordinates are
presentation-only fields on the map data.

---

## 4. Setup

**4.1** Choose a map. Seed the RNG (games are fully reproducible from `{seed, setupOptions}`).

**4.2 Distribute city goods.** Every non-capital city carries a `tokenGroup` letter. The map
defines, per token group, the exact multiset of goods for that group. Within each group the
goods are shuffled and dealt to the cities of that group. This keeps the *global* distribution
fixed while randomising the *local* geography.
Global distribution for `mare-nostrum` (30 tokens): **9 brick, 8 food, 6 tool, 4 wine, 3 cloth**.
→ `CITY_TOKEN_DISTRIBUTION` — **`RULE_REVIEW_REQUIRED`** (original map; the published
distribution of the original game's tokens was not available, so this distribution was chosen
to mirror the goods' price hierarchy: cheap goods are common, expensive goods are rare).

**4.3 Assign bonus markers.** For every province, find the **most valuable** good produced by
any of its cities (using the values in 2.3). The province receives a bonus marker of that good
type, **goods side up** ("active").

**4.4 Bonus marker coin values.** Each marker's reverse shows a number of coins determined by
its good type:

| Marker good | Coins |
|---|---|
| Brick | 1 |
| Food | 1 |
| Tool | 2 |
| Wine | 2 |
| Cloth | 3 |

→ `BONUS_MARKER_COIN_VALUES` — **`RULE_REVIEW_REQUIRED`**. The original rulebook states only
that the cash bonus pays 1 sestertius per *visible coin* across all markers, and its worked
example shows 6 flipped markers yielding 10 coins (mean 1.67). The table above reproduces that
average and ties coin value to good value.

**4.5 Prepare the card stack.** The 30 cards for sale carry a deck numeral **I–V**. Remove every
card whose numeral is **greater than the player count**. Shuffle each remaining numeral group
independently, then stack them **I on top, then II, III, IV, V** — so cheap early cards come out
first and the powerful late cards arrive as the game matures.

Deck sizes: **I = 8, II = 7, III = 6, IV = 5, V = 4** (30 total).

| Players | Decks in play | Cards for sale |
|---|---|---|
| 2 | I–II | 15 |
| 3 | I–III | 21 |
| 4 | I–IV | 26 |
| 5 | I–V | 30 |

**4.6 The display.** Deal the top **7** cards of the stack face up into display positions 1–7
(left to right). Set the Concordia card aside.

**4.7 Player setup.** Each player:

* places **1 land colonist and 1 sea colonist in the capital**;
* keeps **2 land + 2 sea colonists in the storehouse** (occupying 4 storage spaces);
* stores **2 food, 1 cloth, 1 wine, 1 brick, 1 tool** (6 goods → 10 of 12 spaces now used);
* takes **15 houses** into supply;
* takes the **7 starting cards** into hand;
* sets their score marker to 0.

**4.8 Starting money.** The start player receives **5 sestertii**; each subsequent player in
turn order receives **one more** than the previous (5, 6, 7, 8, 9).

**4.9 Praefectus Magnus** goes to the **last player in turn order**.

**4.10 Starting hand (7 cards, identical for every player):**

| # | Card | God |
|---|---|---|
| 1 | Architect | Jupiter |
| 2 | Diplomat | Jupiter |
| 3 | Mercator (3 sestertii variant) | Mercurius |
| 4 | Prefect | Saturnus |
| 5 | Prefect | Saturnus |
| 6 | Senator | Vesta |
| 7 | Tribune | Mars |

---

## 5. Turn structure

**5.1** Play proceeds clockwise from the start player.

**5.2** On your turn you **must** play exactly one card from your hand and resolve its action.
The card then goes face up on top of your personal **discard pile** (your "played" area). Only
the top card of a discard pile is considered "showing" for the Diplomat.

**5.3** Your hand is only replenished by the **Tribune** (rule 6.8) and by buying cards
(rules 6.6, 6.7).

**5.4** If your hand contains only the Tribune, you must play the Tribune — so the hand can
never be empty at the start of a turn (the Tribune always returns itself plus everything else).
The engine guarantees at least one legal action exists on every turn.

**5.5 Optional parts are optional.** Every "you may" clause may be declined. Playing a card
whose optional parts you decline is always legal (e.g. an Architect with no movement and no
build is a legal — if wasteful — turn). The engine never forces a player to spend resources.

---

## 6. Personality cards — full action reference

Roles and their gods:

| Role | God | Appears in |
|---|---|---|
| Architect | Jupiter | starting hand, decks I–IV |
| Prefect | Saturnus | starting hand ×2, decks I–V |
| Mercator | Mercurius | starting hand (3₴), decks I, II, III, V (5₴) |
| Colonist | Mars | decks I, II, III, IV |
| Diplomat | Jupiter | starting hand, decks I, III, IV, V |
| Senator | Vesta | starting hand |
| Consul | Jupiter | decks II, III, IV, V |
| Tribune | Mars | starting hand |
| Mason / Farmer / Smith / Vintner / Weaver | Minerva | decks I (Mason, Farmer, Smith), II (Vintner, Weaver) |

### 6.1 ARCHITECT — *Jupiter*

Resolved in two ordered phases; both are optional.

1. **Move colonists.** You receive **movement steps equal to the number of your colonists on
   the board** (not in the storehouse). Distribute them freely among your own colonists. See
   [§7](#7-movement).
2. **Build houses** — *after all movement is finished*. You may build any number of houses, in
   any legal cities, paying each in full. See [§8](#8-construction).

### 6.2 PREFECT — *Saturnus*

Choose **exactly one** of two alternatives.

**(a) Production.** Choose a province whose bonus marker is **active** (goods side up).

   1. Flip that province's marker to its **coin side**.
   2. **You** receive **1 unit of the marker's good** from the bank (**2 units** if you hold the
      Praefectus Magnus — rule 13.2).
   3. Then **every house in that province produces**, regardless of owner: each house yields 1
      unit of *its own city's* good to that house's owner.

   You do **not** need to own a house in the province. All receipts respect storehouse
   capacity ([§10](#10-the-storehouse)).

**(b) Cash bonus.** Take **1 sestertius per visible coin** across **all** provinces' markers
   (i.e. sum the coin values of every marker currently on its coin side). Then flip **all**
   markers back to their goods side. The Praefectus Magnus is **not** activated by this option
   and stays with its owner (rule 13.4).

* If **no** province is active, option (a) is unavailable. Option (b) is always available (it
  may yield 0 sestertii).

### 6.3 MERCATOR — *Mercurius*

Two ordered steps:

1. **Take money**: 3 sestertii (starting card) or **5 sestertii** (any purchased Mercator).
2. **Trade with the bank** in **at most two *types*** of goods. For each chosen type you either
   buy or sell — never both for the same type. Quantities are unlimited except by:
   * money on hand (for buying),
   * goods on hand (for selling),
   * free storage space (for buying) — [§10](#10-the-storehouse).

   Prices are the fixed values in 2.3 (buy price = sell price).

### 6.4 COLONIST — *Mars*

Choose **exactly one**:

**(a) Recruit.** Place any number of new colonists, **each costing 1 food + 1 tool**. Each new
   colonist is placed **in the capital, or in any city where you own a house**. You choose land
   or sea per colonist. Limited by colonists remaining in your storehouse (max 6 on board).
   Each colonist that leaves the storehouse **frees one storage space**.

**(b) Money.** Take **5 sestertii + 1 per colonist you have on the board**.

### 6.5 DIPLOMAT — *Jupiter*

Execute the action of the card **on top of another player's discard pile**, exactly as if you
had played that card yourself.

* You may **not** copy a Diplomat (a player whose top card is a Diplomat is not a legal target).
* A player who has just played a Tribune has an *empty* discard pile, so they are not a legal
  target — the rulebook's "cannot copy someone who just took their cards back" falls out of this.
* Your own discard pile is never a legal target.
* The copied action is resolved with **your** resources, colonists, houses and Praefectus
  Magnus status. The copied card stays with its owner.
* If no legal target exists, the Diplomat may still be played (it simply does nothing) — rule 5.5.
* A copied Mercator uses the **money value printed on the copied card** (3 or 5).

### 6.6 SENATOR — *Vesta*

Purchase **up to two** personality cards from the display. Each card's price is:

> **goods printed on the card** **+** **goods printed beneath its display position**

A `?` in a position cost is a **wildcard**: pay any one good of your choice.

Purchases are resolved **one at a time**; after *all* purchases the display is compacted and
refilled (rule 12.3). Positions are therefore evaluated against the display as it stood at the
start of the Senator action — buying the card in position 1 does not make the card in position 2
cheaper within the same Senator action. → `SENATOR_COMPACTS_BETWEEN_PURCHASES = false` —
**`RULE_REVIEW_REQUIRED`**. The rulebook's worked example buys positions 1 and 3 and then
compacts once, which is consistent with this reading.

Bought cards go **into your hand** (not your discard pile).

### 6.7 CONSUL — *Jupiter*

Purchase **exactly one** card from the display, paying **only the goods printed on the card**.
The display position cost is **ignored**. Then compact and refill (rule 12.3).

### 6.8 TRIBUNE — *Mars*

1. **Recover**: take **all** cards from your discard pile back into your hand. The Tribune
   itself is included in the count but — like every played card — it goes to the discard pile
   *first*, so it is recovered too and your discard pile ends **empty**.
2. **Payment**: receive **1 sestertius for each recovered card in excess of 3**
   (`max(0, recovered − 3)`).
3. **Optional colonist**: pay **1 food + 1 tool** to place **1** new colonist (land or sea) **in
   the capital only**. Subject to the 6-colonist limit and storehouse availability.
4. The **first** time you play a Tribune, an intermediate scoring is triggered
   ([§14](#14-intermediate-scoring)).

### 6.9 SPECIALISTS (Mason, Farmer, Smith, Vintner, Weaver) — *Minerva*

Every one of **your** houses in a city producing the specialist's good produces **1 unit** of
that good. No other player receives anything. Subject to storehouse capacity.

| Specialist | Good | Minerva VP per matching city |
|---|---|---|
| Mason | Brick | **2** — `RULE_REVIEW_REQUIRED` |
| Farmer | Food | 3 — confirmed |
| Smith | Tool | 3 — confirmed |
| Vintner | Wine | 4 — confirmed |
| Weaver | Cloth | **5** — `RULE_REVIEW_REQUIRED` |

---

## 7. Movement

**7.1 Where colonists live.** A colonist occupies **either a city** (only immediately after
being placed there, and at setup) **or a route**. A colonist never *ends* movement in a city.

**7.2 Steps.** Each step moves a colonist onto exactly one route.

* From a **city**: the first step moves the colonist onto any route incident to that city of
  the colonist's own type.
* From a **route** `(A, B)`: a step moves the colonist *through* one of the two endpoint cities
  and onto a different route incident to that city, of the colonist's type.

**7.3** A colonist may not immediately re-enter the route it just left within the same step
(that would be a null move); it may, however, return to it later in the same Architect action
via a longer path.

**7.4 Allowance.** Total steps available = number of your colonists **on the board**. Steps may
be split among colonists in any way. Unused steps are lost.

**7.5 Type restriction.** Land colonists use only land routes; sea colonists only sea routes.

**7.6 Occupancy.** A colonist may **pass through** an occupied route (each traversed route costs
1 step) but may **not end its movement** on a route occupied by any colonist — its own or
another player's. Two colonists may never share a route.

**7.7** Movement is per-colonist and sequential: you finish moving one colonist (committing its
final position) before moving another. The engine models this as a sequence of single-step
actions, so the UI can animate each step and so occupancy is always evaluated against the
current board.

**7.8** A colonist that is in a city may also simply stay there (0 steps).

---

## 8. Construction

**8.1 Where.** You may build in any city **adjacent to one of your own colonists**.

* A colonist on route `(A, B)` makes **both** `A` and `B` adjacent.
* A colonist sitting in city `C` makes **`C`** adjacent.

**8.2 Goods cost.**

* Building in a **brick city**: **1 food**.
* Building in **any other** city: **1 brick + 1 unit of that city's good**.

**8.3 Coin cost — base by city type:**

| City good | Base sestertii |
|---|---|
| Brick | 1 |
| Food | 2 |
| Tool | 3 |
| Wine | 4 |
| Cloth | 5 |

**8.4 Crowding multiplier.** The coin cost is multiplied by **the number of houses that will be
in the city after this build**. Building the 4th house in a city costs `base × 4`. The **goods
cost is never multiplied**.

**8.5** You may never own **more than one** house in a single city.

**8.6** Building consumes a house from your supply of 15. When you place your **15th** house the
game-end trigger fires (rule 15.1).

**8.7** No house may ever be built in the capital.

**8.8** All builds in an Architect action happen after **all** movement is complete, and may be
performed in any order (the order matters, because the crowding multiplier depends on houses
already present).

---

## 9. Production

**9.1** Production is the act of a house yielding 1 unit of its city's good to that house's owner.

**9.2** Three things cause production:

* **Prefect (a)** — every house in the chosen province produces (all owners).
* **Specialists** — every one of the acting player's houses of the matching good produces.
* Nothing else. There is no automatic per-turn income.

**9.3** Production respects storehouse capacity ([§10](#10-the-storehouse)). Goods that cannot
be stored are lost (not banked, not deferred).

---

## 10. The storehouse

**10.1** Each player's storehouse has **12 storage spaces**.

**10.2** Each space holds **either one unit of goods or one colonist not yet on the board**.

**10.3** Free space = `12 − (goods held) − (colonists still in storehouse)`.

**10.4** When a player would receive more goods than they have free space for, they receive as
many as fit and **choose which** units to take; the remainder is lost. They may **not** leave a
space empty if goods are still available, and may **not** discard goods to make room.

**10.5** The engine models 10.4 with an explicit **selection preference order** supplied by the
caller (the UI presents a chooser; the AI supplies a valuation order). If no preference is given
the engine takes the most valuable goods first, deterministically.

**10.6** Placing a colonist on the board frees its storage space permanently (colonists never
return to the storehouse).

---

## 11. Trade

**11.1** Only via the **Mercator** action (rule 6.3). Prices are fixed (2.3); buy price equals
sell price.

**11.2** At most **two distinct goods types** per Mercator, and each chosen type is either
bought or sold, not both.

**11.3** Money may never go negative; goods may never go negative; storage may never be exceeded.

---

## 12. The card display (market)

**12.1** The display holds up to **7** face-up cards in positions 1–7, position 1 leftmost and
cheapest.

**12.2 Position surcharges** (added by Senator, ignored by Consul):

| Position | Surcharge |
|---|---|
| 1 | — |
| 2 | — |
| 3 | 1 × `?` |
| 4 | 1 cloth |
| 5 | 1 × `?` + 1 × `?` |
| 6 | 1 × `?` + 1 cloth |
| 7 | 1 × `?` + 1 × `?` + 1 cloth |

→ `DISPLAY_POSITION_COSTS` — positions **1, 3, 4 and 6 are confirmed** from the rulebook's two
worked examples; positions **2, 5 and 7** are **`RULE_REVIEW_REQUIRED`** (interpolated to keep
the surcharge monotonically non-decreasing left to right).

**12.3 Compaction and refill.** After a purchase action completes:

1. Remaining cards slide **left** to fill gaps, preserving order.
2. The display is refilled from the top of the stack up to 7 cards, or until the stack is empty.

**12.4** Cards are never removed from the display except by purchase.

---

## 13. Praefectus Magnus

**13.1** One copy exists; at setup it goes to the last player in turn order.

**13.2** If its holder resolves a **Prefect production** (option a) — including one copied by a
Diplomat — the production bonus is **doubled** (2 units of the marker's good instead of 1).

**13.3** After such a turn, the Praefectus Magnus passes to the player on the holder's **right**
(i.e. the *previous* player in clockwise turn order).

**13.4** Choosing the Prefect **cash bonus** does not activate or pass it.

**13.5** Its holder **must** take the doubled bonus when able; it cannot be declined to keep the
card.

**13.6** It breaks ties at game end (rule 16.8).

---

## 14. Intermediate scoring

**14.1** The **first** time a player plays a Tribune, that player immediately scores their cards
exactly as in the final scoring ([§16](#16-final-scoring)) and their score marker is set to that
value.

**14.2** Once **every** player has done so, the intermediate scores are compared:
first place receives **2 sestertii**, second place **1 sestertius**. Ties share the same award
(everyone tied for first gets 2, everyone tied for second gets 1). All score markers then reset
to 0.

**14.3** Intermediate scoring is **optional** and is off by default in this build (it is a
teaching aid). Toggle: `ENABLE_INTERMEDIATE_SCORING`.

---

## 15. End of game

**15.1 Trigger.** The end of the game is triggered the moment **either**:

* a player **purchases the last card** from the display (leaving it empty — the stack must also
  be empty), **or**
* a player places their **15th house**.

**15.2** That player immediately receives the **Concordia card**, worth **7 VP**, and no one
else can take it.

**15.3 Final turns.** *Every other player* then takes **exactly one more turn**, in normal
clockwise order, starting with the player after the trigger. The triggering player does **not**
take another turn. The game ends after the last of those turns resolves.

**15.4** During the final turns everything is legal as normal; a second player reaching a
trigger condition changes nothing (the Concordia card is already gone).

**15.5** Then final scoring is performed.

---

## 16. Final scoring

Gather all your personality cards — **hand and discard pile together** — and group them by god.
For each god, its achievement value is computed **once** and multiplied by **the number of cards
you own bearing that god**.

**16.1 VESTA** — *wealth.*
`floor((money + Σ goods held × their value) / 10)` VP per Vesta card. Fractions ignored.

**16.2 JUPITER** — *settlement.*
`(number of your houses in cities that are NOT brick cities)` VP per Jupiter card. Max 15.

**16.3 SATURNUS** — *provinces.*
`(number of provinces containing at least one of your houses)` VP per Saturnus card.
Max 12 on `mare-nostrum`, 11 on `italia-antiqua`.

**16.4 MERCURIUS** — *diversity.*
`2 × (number of distinct goods types produced by your houses)` VP per Mercurius card. Max 10.

**16.5 MARS** — *colonists.*
`2 × (number of your colonists on the board)` VP per Mars card. Max 12.

**16.6 MINERVA** — *specialisation.*
Each Minerva (specialist) card scores **individually**: `card.minervaValue × (number of your
houses in cities producing that card's good)`. Minerva cards do **not** multiply each other.

**16.7 CONCORDIA CARD** — flat **7 VP** to whoever triggered the end of the game.

**16.8 Winner.** Highest total. Ties are broken in favour of the player holding the **Praefectus
Magnus**; if that player is not among those tied, in favour of whichever tied player would
receive it next in turn order (i.e. the tied player nearest, going anticlockwise, to the current
holder).

---

## 17. Rule review register

Every entry below is a single named export in
[`src/game/data/ruleConstants.ts`](../src/game/data/ruleConstants.ts). Correcting the value there
corrects the whole game; no rule logic needs to change.

| Constant | Chosen value | Why uncertain |
|---|---|---|
| `DISPLAY_POSITION_COSTS[2]` | `[]` (free) | Not shown in any worked example. Position 1 is confirmed free; 2 is assumed free by monotonicity. |
| `DISPLAY_POSITION_COSTS[5]` | `[?, ?]` | Interpolated between confirmed position 4 (`cloth`) and confirmed position 6 (`? + cloth`). |
| `DISPLAY_POSITION_COSTS[7]` | `[?, ?, cloth]` | Extrapolated beyond confirmed position 6. |
| `MINERVA_VP.brick` (Mason) | `2` | Farmer 3 / Smith 3 / Vintner 4 are confirmed; Mason is extrapolated downward as brick cities are the most common. |
| `MINERVA_VP.cloth` (Weaver) | `5` | Extrapolated upward from Vintner 4 as cloth cities are the rarest. |
| `BONUS_MARKER_COIN_VALUES` | `{brick:1, food:1, tool:2, wine:2, cloth:3}` | Only the aggregate behaviour (1₴ per visible coin; example: 6 markers → 10 coins) is documented. |
| `CITY_TOKEN_DISTRIBUTION` | `9/8/6/4/3` | Original map; distribution chosen to mirror the price hierarchy. |
| `SENATOR_COMPACTS_BETWEEN_PURCHASES` | `false` | The rulebook's example is consistent with compacting once at the end, but does not state it explicitly. |
| `DIPLOMAT_CAN_COPY_DIPLOMAT` | `false` | Rulebook says actions of players who "recently used a Diplomat" cannot be copied; read here as "a Diplomat on top of a discard pile is not a legal target". |
| `ENABLE_INTERMEDIATE_SCORING` | `false` | Rulebook recommends it only for first games; off by default, fully implemented. |
| `CARD_FOR_SALE_COSTS` (Mason) | `1 food` | Read from the publisher's card-overview sheet; the Mason's printed cost glyphs were the least legible of the set. |
