# Game Center

Browser games built from scratch, collected into one static site. Each game lives in its own
folder and still runs on its own; the Game Center builds them all into a single site with a
hub page linking to each.

| Game | Folder | What it is |
|---|---|---|
| **Gemwright** | [`splendor/`](splendor) | Gem-trading engine builder vs 1–3 bots, inspired by *Splendor* |
| **Imperium Mercatorum** | [`concordia/`](concordia) | Roman trading strategy vs 1–4 bots, inspired by *Concordia* |
| **Hold'em Night** | [`poker/`](poker) | No-limit Texas Hold'em vs 4 bots with distinct playing styles |
| **Globle** | [`globle/`](globle) | Find the mystery country on a 3D globe |
| **Rubik's Cube Solver** | [`rubiks-cube-solver/`](rubiks-cube-solver) | Scan a real cube with the webcam and get a step-by-step solution |

Everything runs in the browser. There is no backend and no accounts; games keep their
progress in `localStorage`.

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

## Deploy (Vercel, free)

1. On [vercel.com](https://vercel.com), **Add New → Project** and import this repository.
2. Leave every setting as detected — [`vercel.json`](vercel.json) supplies the build command
   (`npm run build`) and output directory (`dist`).
3. Deploy. Every push to `main` redeploys automatically.

The site is fully static, so any static host works the same way: run `npm run build` and
publish `dist/`.
