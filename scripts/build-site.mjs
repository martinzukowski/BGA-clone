// Builds the Game Center: every game under /<slug>/ plus the hub page at /.
//
//   node scripts/build-site.mjs            build everything into dist/
//   node scripts/build-site.mjs splendor   rebuild one game (and the hub)
//
// Games are listed in games.json. 'vite' games are built with Vite using
// --base=/<slug>/ so their assets resolve under that path; 'static' games are
// copied as-is. Each game page gets a small "Game Center" link back to the hub;
// a static game can hold sub-games in its own folders (High Rollers does), and
// their pages link back to that game's front page instead.
// No dependencies: runs on plain Node 20+, locally or on Vercel.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist')
const hubDir = path.join(root, 'hub')
const { games } = JSON.parse(fs.readFileSync(path.join(root, 'games.json'), 'utf8'))

const only = process.argv[2]
const selected = only ? games.filter((g) => g.slug === only) : games
if (only && selected.length === 0) {
  console.error(`No game with slug "${only}" in games.json`)
  process.exit(1)
}

/** Never copied into a static game's output. */
const STATIC_SKIP = new Set(['.git', '.claude', 'node_modules', 'dist', 'start.bat'])

function run(command, cwd) {
  console.log(`  $ ${command}`)
  execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } })
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (STATIC_SKIP.has(entry.name)) continue
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(src, dest)
    else fs.copyFileSync(src, dest)
  }
}

const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/**
 * A tab on the left edge, halfway down, linking back to the hub. Every corner
 * of the screen is used by at least one game (title bars, zoom buttons, hand
 * of cards), but the middle of the left edge is empty in all of them, so the
 * tab never covers anything clickable. It shows just an icon until hovered or
 * focused, then slides out its label. Scoped by id so it cannot collide with
 * a game's own CSS.
 */
const HUB_ICON = `<rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>`
const BACK_ICON = `<path d="M10.5 2.5 5 8l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`

const backLink = (href, label, icon) => `
<style>
  #game-center-back{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147483000;
    display:flex;align-items:center;gap:7px;padding:11px 10px 11px 8px;
    border:1px solid rgba(255,255,255,.18);border-left:0;border-radius:0 12px 12px 0;
    background:rgba(10,13,20,.86);color:#e9e6df;text-decoration:none;
    font:600 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;
    box-shadow:0 6px 18px rgba(0,0,0,.4);opacity:.55;transition:opacity .15s}
  #game-center-back svg{flex:none}
  #game-center-back span{max-width:0;overflow:hidden;white-space:nowrap;transition:max-width .2s ease}
  #game-center-back:hover,#game-center-back:focus-visible{opacity:1;outline:none}
  #game-center-back:hover span,#game-center-back:focus-visible span{max-width:130px}
  @media (prefers-reduced-motion:reduce){#game-center-back,#game-center-back span{transition:none}}
</style>
<a href="${href}" id="game-center-back" aria-label="Back to ${label}" title="Back to ${label}">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
    ${icon}
  </svg>
  <span>${label}</span>
</a>
`

function injectBackLink(indexHtml, link) {
  const html = fs.readFileSync(indexHtml, 'utf8')
  if (html.includes('id="game-center-back"')) return
  if (!html.includes('</body>')) throw new Error(`${indexHtml} has no </body> to inject into`)
  fs.writeFileSync(indexHtml, html.replace('</body>', `${link}</body>`))
}

/** index.html files in the immediate subfolders of `dir` (a static game's sub-games). */
function subPages(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name, 'index.html'))
    .filter((f) => fs.existsSync(f))
}

function buildGame(game) {
  const src = path.join(root, game.slug)
  const dest = path.join(out, game.slug)
  if (!fs.existsSync(src)) throw new Error(`games.json lists "${game.slug}" but there is no ${game.slug}/ folder`)
  console.log(`\n▸ ${game.title} (${game.kind}) → /${game.slug}/`)
  fs.rmSync(dest, { recursive: true, force: true })

  if (game.kind === 'vite') {
    if (!fs.existsSync(path.join(src, 'node_modules'))) {
      run(fs.existsSync(path.join(src, 'package-lock.json')) ? 'npm ci --no-audit --no-fund' : 'npm install --no-audit --no-fund', src)
    }
    run(`npx vite build --base=/${game.slug}/ --outDir="${dest}" --emptyOutDir`, src)
  } else if (game.kind === 'static') {
    copyDir(src, dest)
  } else {
    throw new Error(`Unknown kind "${game.kind}" for ${game.slug}`)
  }

  injectBackLink(path.join(dest, 'index.html'), backLink('/', 'Game Center', HUB_ICON))
  if (game.kind === 'static') {
    for (const page of subPages(dest)) injectBackLink(page, backLink(`/${game.slug}/`, escape(game.title), BACK_ICON))
  }
}

function renderCard(game) {
  const thumbFile = `thumbs/${game.slug}.jpg`
  const hasThumb = fs.existsSync(path.join(hubDir, thumbFile))
  const thumb = hasThumb
    ? `<img src="${thumbFile}" alt="" loading="lazy" decoding="async" width="800" height="500" />`
    : `<div class="thumb-fallback" aria-hidden="true">${escape(game.title[0])}</div>`
  const tags = game.tags.map((t) => `<span class="tag">${escape(t)}</span>`).join('')
  // "Globle, inspired by Globle" says nothing, so only show it when it adds something.
  const inspired =
    game.inspiredBy && game.inspiredBy !== game.title
      ? `<span class="inspired">inspired by ${escape(game.inspiredBy)}</span>`
      : ''

  return `
        <li>
          <a class="card" href="/${game.slug}/" style="--accent: ${escape(game.accent)}">
            <div class="thumb">${thumb}</div>
            <div class="body">
              <div class="title-row">
                <h2 class="title">${escape(game.title)}</h2>
                ${inspired}
              </div>
              <p class="tagline">${escape(game.tagline)}</p>
              <div class="meta">
                ${tags}
                <span class="players">${escape(game.players)}</span>
                <span class="play" aria-hidden="true">Play &rarr;</span>
              </div>
            </div>
          </a>
        </li>`
}

function buildHub() {
  console.log('\n▸ Game Center hub → /')
  for (const entry of fs.readdirSync(hubDir, { withFileTypes: true })) {
    if (entry.name === 'index.html') continue
    const src = path.join(hubDir, entry.name)
    const dest = path.join(out, entry.name)
    if (entry.isDirectory()) copyDir(src, dest)
    else fs.copyFileSync(src, dest)
  }
  const template = fs.readFileSync(path.join(hubDir, 'index.html'), 'utf8')
  const html = template
    .replace('<!-- GAMES -->', games.map(renderCard).join(''))
    .replace('<!-- COUNT -->', String(games.length))
  fs.writeFileSync(path.join(out, 'index.html'), html)

  fs.writeFileSync(
    path.join(out, '404.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · Game Center</title><link rel="stylesheet" href="/styles.css"></head><body><header class="hero"><p class="eyebrow">404</p><h1>Nothing here</h1><p class="lede"><a href="/" style="color:var(--brass)">Back to the Game Center</a></p></header></body></html>`,
  )
}

const started = Date.now()
if (!only) fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
for (const game of selected) buildGame(game)
buildHub()
console.log(`\n✓ Built ${selected.length} game(s) + hub into dist/ in ${((Date.now() - started) / 1000).toFixed(1)}s`)
