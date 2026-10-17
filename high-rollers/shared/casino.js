// Shared helpers for the High Rollers games: cards, chips, the help dialog and
// a few small utilities. Loaded as a plain script, so everything is a global.

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => n.toLocaleString('en-US');

// ---------- Cards ----------
const SUITS = ['♠', '♥', '♦', '♣'];
const RANK_STR = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const rs = r => RANK_STR[r] || String(r);
const isRed = c => c.s === 1 || c.s === 2;

/** A shuffled shoe of `decks` 52-card decks. Cards are {r: 2..14, s: 0..3}. */
function newShoe(decks = 1) {
  const d = [];
  for (let k = 0; k < decks; k++)
    for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Cards animate in the first time they are drawn, and flip when first shown face up.
const dealtCards = new WeakSet(), shownCards = new WeakSet();

function cardEl(c, { hidden = false, from = null } = {}) {
  const d = document.createElement('div');
  d.className = 'card';
  if (!dealtCards.has(c)) {
    dealtCards.add(c);
    d.classList.add('deal');
    if (from) { d.style.setProperty('--fx', from[0] + 'px'); d.style.setProperty('--fy', from[1] + 'px'); }
  } else if (!hidden && !shownCards.has(c)) d.classList.add('flip');
  if (hidden) { d.classList.add('back'); return d; }
  shownCards.add(c);
  if (isRed(c)) d.classList.add('red');
  const r = rs(c.r), s = SUITS[c.s];
  const face = c.r >= 11 && c.r <= 13;
  d.innerHTML = `<div class="idx"><span class="r">${r}</span><span class="s">${s}</span></div>` +
    `<div class="pip${face ? ' face' : ''}">${face ? r + s : s}</div>` +
    `<div class="idx br"><span class="r">${r}</span><span class="s">${s}</span></div>`;
  return d;
}

// ---------- Chips ----------
// [value, colour, edge shadow, stripe colour, label colour]
const DENOMS = [
  [1000, '#e8b51e', '#9a7409', 'rgba(255,255,255,.92)', '#2a1d00'],
  [500, '#7d43c4', '#4b2380', 'rgba(255,255,255,.92)', '#fff'],
  [100, '#25282b', '#000', 'rgba(255,255,255,.92)', '#fff'],
  [25, '#1f9150', '#0e5a2f', 'rgba(255,255,255,.92)', '#fff'],
  [5, '#cf2e2e', '#7d1515', 'rgba(255,255,255,.92)', '#fff'],
  [1, '#f2f2ee', '#a7a7a0', '#2c6fd6', '#1a1a1a'],
];
const denomOf = v => DENOMS.find(d => d[0] === v) || DENOMS[DENOMS.length - 1];

function chipStack(amount, maxCols = 5, perCol = 9) {
  const cols = [];
  let a = amount;
  for (const [v, c, d, e] of DENOMS) {
    let n = Math.floor(a / v);
    a -= n * v;
    while (n > 0 && cols.length < maxCols) {
      const take = Math.min(n, perCol);
      cols.push({ n: take, c, d, e });
      n -= take;
    }
  }
  const el = document.createElement('div');
  el.className = 'stack';
  for (const col of cols) {
    const ce = document.createElement('div');
    ce.className = 'col';
    ce.style.height = (22 + (col.n - 1) * 3.5) + 'px';
    for (let i = 0; i < col.n; i++) {
      const ch = document.createElement('div');
      ch.className = 'chip';
      ch.style.bottom = (i * 3.5) + 'px';
      ch.style.setProperty('--c', col.c); ch.style.setProperty('--d', col.d); ch.style.setProperty('--e', col.e);
      ce.appendChild(ch);
    }
    el.appendChild(ce);
  }
  return el;
}

/** Style a .bigchip button as the chip of value `v`. */
function paintChip(el, v) {
  const [, c, d, e, t] = denomOf(v);
  el.style.setProperty('--c', c); el.style.setProperty('--d', d);
  el.style.setProperty('--e', e); el.style.setProperty('--t', t);
  el.textContent = v >= 1000 ? (v / 1000) + 'K' : v;
}

// ---------- Saved bankroll (per game) ----------
function loadNumber(key, fallback) {
  try { const v = Number(localStorage.getItem(key)); return Number.isFinite(v) && v > 0 ? v : fallback; }
  catch { return fallback; }
}
function saveNumber(key, v) {
  try { localStorage.setItem(key, String(v)); } catch { /* private mode: just don't persist */ }
}

// ---------- Log ----------
function logLine(html, cls = '') {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  const log = $('log');
  log.appendChild(d);
  while (log.children.length > 200) log.firstChild.remove();
  log.scrollTop = 1e9;
}

// ---------- Settings menu & help dialog ----------
// Expects #btnSettings/#settings, #btnHelp/#helpOverlay/#btnHelpClose, and
// .tab[data-tab=x] buttons paired with #tab-x panes.
const helpOpen = () => $('helpOverlay').classList.contains('show');
function openHelp() {
  $('settings')?.classList.remove('open');
  $('helpOverlay').classList.add('show');
}
function closeHelp() { $('helpOverlay').classList.remove('show'); }
function setupChrome() {
  if ($('btnSettings')) {
    $('btnSettings').onclick = e => { e.stopPropagation(); $('settings').classList.toggle('open'); };
    $('settings').onclick = e => e.stopPropagation();
    document.addEventListener('click', () => $('settings').classList.remove('open'));
  }
  const tabs = document.querySelectorAll('.tab');
  for (const t of tabs) t.onclick = () => {
    for (const u of tabs) { u.classList.toggle('active', u === t); $('tab-' + u.dataset.tab).hidden = u !== t; }
  };
  $('btnHelp').onclick = e => { e.stopPropagation(); openHelp(); };
  $('btnHelpClose').onclick = closeHelp;
  $('helpOverlay').onclick = e => { if (e.target === $('helpOverlay')) closeHelp(); };
}
/** Keyboard: Esc or a help key closes help, a help key opens it; everything else goes to `handler(key, event)`. */
function onKeys(handler, helpKeys = ['h', '?']) {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.key !== 'Enter') return;
    const k = e.key.toLowerCase();
    if (helpOpen()) { if (k === 'escape' || helpKeys.includes(k)) closeHelp(); return; }
    if (helpKeys.includes(k)) { openHelp(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    handler(k, e);
  });
}
