# Game Center

Browser games built from scratch, collected into one static site. Each game lives in its own
folder and still runs on its own; the Game Center builds them all into a single site with a
hub page linking to each.

| Game | Folder | What it is |
|---|---|---|
| **Gemwright** | [`splendor/`](splendor) | Gem-trading engine builder vs 1–3 bots, inspired by *Splendor* |
| **Imperium Mercatorum** | [`concordia/`](concordia) | Roman trading strategy vs 1–4 bots, inspired by *Concordia* |
| **High Rollers** | [`high-rollers/`](high-rollers) | Casino lobby with four play-money games: Hold'em Night (no-limit Texas Hold'em vs 4 bots), Blackjack, Roulette and Liar's Dice |
| **Tank Arena** | [`tank-arena/`](tank-arena) | 3D tank battles vs bots or friends online, with unlockable weapons and hulls |
| **Brain Games** | [`brain-games/`](brain-games) | Puzzle lobby: Deep Cut (name a cheese, a dog breed… rarer answers score more), Chaindle (link two or three words with one of your own; stronger links score more), Originle (eight clues from a guest, guess which country they are from) and Globle (find the mystery country on a 3D globe) |
| **Rubik's Cube Solver** | [`rubiks-cube-solver/`](rubiks-cube-solver) | Scan a real cube with the webcam and get a step-by-step solution |

Everything runs in the browser. There is no backend and no accounts; games keep their
progress in `localStorage`. Tank Arena's online mode connects players' browsers directly over
WebRTC: the host's browser runs the match, and the free [PeerJS](https://peerjs.com) cloud
server is only used to introduce the browsers to each other.

## Run the whole site locally

```bash
npm run build      # builds every game + the hub into dist/
npm run preview    # serves dist/ at http://localhost:4173
```

No root dependencies; the build installs each game's own dependencies as needed. Needs
Node 20+. To rebuild a single game and the hub: `node scripts/build-site.mjs splendor`.

## Add a game

1. Put it in its own folder at the repo root.
2. Add an entry to [`games.json`](games.json):
   - `slug` — the folder name, which is also the URL path (`/<slug>/`)
   - `kind` — `"vite"` for a Vite project (built with `--base=/<slug>/`), or `"static"` for a
     folder of plain HTML/JS that is copied as-is
   - `title`, `tagline`, `players`, `tags`, `accent` (card colour), and optional `inspiredBy`
3. Optionally add a screenshot at `hub/thumbs/<slug>.jpg` (16:10, ~800px wide). Without one
   the card shows the game's initial on a tinted background.

For a Vite game, anything loaded at run time by URL (rather than imported) should use
`import.meta.env.BASE_URL` so it still resolves when the game is served from `/<slug>/`.

Every game page gets a small tab on its left edge linking back to the hub; it is injected at
build time, so games need no changes for it.

A static game can also be a mini-hub with its own games in subfolders, like
[`high-rollers/`](high-rollers): its front page links back to the hub, and each
`<slug>/<sub-game>/index.html` gets a tab linking back to `/<slug>/` instead. High Rollers'
games share their look through [`high-rollers/shared/`](high-rollers/shared). Brain Games works
the same way, with [`brain-games/shared/`](brain-games/shared). The old `/poker/` and `/globle/`
URLs redirect to their new homes (see [`vercel.json`](vercel.json)).

Deep Cut's prompts live in [`brain-games/deep-cut/data/`](brain-games/deep-cut/data), one file per
theme. Each answer is written `Name/Alias=tier`, where tier 1 is what most people say first and
5 is a real deep cut. To add a prompt, add an entry to one of those files.

Guesses that aren't on a prompt's list go to an AI judge, [`api/deep-cut-judge.js`](api/deep-cut-judge.js)
(a Vercel function using Claude Haiku). It decides whether the guess is a listed answer under another
name, a real answer the list is missing (with a rarity tier), or wrong. It needs `ANTHROPIC_API_KEY` set
in the Vercel project; optionally `DEEP_CUT_MODEL` to pick another model, and Vercel's Upstash Redis
integration (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) to remember verdicts across deploys. Without a key,
Deep Cut works as before. To try it locally: `npm install`, `npm run build`, then
`ANTHROPIC_API_KEY=... npm run preview`.

Chaindle's puzzles live in [`brain-games/chaindle/data/puzzles.js`](brain-games/chaindle/data/puzzles.js):
`pairs` (rounds 1–3), `triples` (round 4) and `singles` (round 5, closest relative). Each answer is
written `Word/Alias=links`, from 1 (a stretch) to 5 (a perfect link).

Originle's guests live in [`brain-games/originle/data/guests.js`](brain-games/originle/data/guests.js):
each has a first name, a country (spelled as in [`brain-games/shared/countries.js`](brain-games/shared/countries.js))
and seven `[title, text]` clues from hardest to easiest; the game adds the eighth (the country's outline).
Guests are drawn from their name, so how they look never hints at the answer. Originle reuses Globle's map
data from `brain-games/globle/lib/`.

## Deploy (Vercel, free)

1. On [vercel.com](https://vercel.com), **Add New → Project** and import this repository.
2. Leave every setting as detected — [`vercel.json`](vercel.json) supplies the build command
   (`npm run build`) and output directory (`dist`).
3. Deploy. Every push to `main` redeploys automatically.

The site is fully static, so any static host works the same way: run `npm run build` and
publish `dist/`.
