// Game data: weapons, hulls, maps, bot difficulty, and the progression saved in localStorage.

const WEAPONS = {
  cannon:  { name: 'Cannon',  desc: 'Reliable all-rounder. Solid shells with a small blast.', cost: 0,
             kind: 'shell',  dmg: 25, reload: 1.5,  speed: 115, grav: 4,  life: 2.2, splash: 4.5, splashDmg: 12, recoil: 1 },
  twins:   { name: 'Twins',   desc: 'Rapid plasma bolts from two alternating barrels.', cost: 800,
             kind: 'plasma', dmg: 5,  reload: .22,  speed: 85,  grav: 0,  life: 1.4, spread: .012, recoil: .25 },
  scatter: { name: 'Scatter', desc: 'Shotgun blast of eight pellets. Brutal up close.', cost: 1000,
             kind: 'pellet', dmg: 6,  reload: 1.4,  speed: 120, grav: 2,  life: .45, spread: .07, pellets: 8, recoil: .8 },
  flame:   { name: 'Inferno', desc: 'Flamethrower. Melts anything within a few tank lengths.', cost: 1200,
             kind: 'flame',  dmg: 2.6, reload: .07, speed: 32,  grav: 0,  life: .5,  spread: .06, recoil: 0 },
  thunder: { name: 'Thunder', desc: 'Heavy artillery shell with a huge blast radius.', cost: 1600,
             kind: 'heavy',  dmg: 34, reload: 2.6,  speed: 95,  grav: 6,  life: 2.6, splash: 7.5, splashDmg: 24, recoil: 1.4 },
  rail:    { name: 'Railgun', desc: 'Charges for a moment, then fires an instant beam that pierces every tank in line.', cost: 2200,
             kind: 'rail',   dmg: 55, reload: 3.2,  charge: .6, range: 250, recoil: 1.2 },
};
const WEAPON_ORDER = ['cannon', 'twins', 'scatter', 'flame', 'thunder', 'rail'];

const HULLS = {
  hunter: { name: 'Hunter', desc: 'Balanced medium hull.', cost: 0,
            hp: 100, speed: 13, rev: 7, turn: 1.9, accel: 16, scale: 1 },
  wasp:   { name: 'Wasp', desc: 'Light and fast, but fragile.', cost: 700,
            hp: 75, speed: 16.5, rev: 9, turn: 2.4, accel: 22, scale: .86 },
  titan:  { name: 'Titan', desc: 'Slow, heavy fortress with thick armor.', cost: 1400,
            hp: 150, speed: 9.5, rev: 5.5, turn: 1.4, accel: 11, scale: 1.16 },
};
const HULL_ORDER = ['hunter', 'wasp', 'titan'];

const MAX_MK = 3; // Mk I (0) .. Mk IV (3)
const MK_NAMES = ['Mk I', 'Mk II', 'Mk III', 'Mk IV'];

function weaponStats(id, mk = 0) {
  const w = WEAPONS[id];
  return { ...w, id, mk, dmg: w.dmg * (1 + .1 * mk), splashDmg: (w.splashDmg || 0) * (1 + .1 * mk), reload: w.reload * (1 - .07 * mk) };
}
function hullStats(id, mk = 0) {
  const h = HULLS[id];
  return { ...h, id, mk, hp: Math.round(h.hp * (1 + .1 * mk)), speed: h.speed * (1 + .03 * mk) };
}
function weaponRange(ws) { return ws.kind === 'rail' ? ws.range : ws.speed * ws.life * .9; }
function upgradeCost(item, mk) { return Math.round(Math.max(item.cost, 600) * .5 * (mk + 1)); }

const DIFFS = {
  easy:   { err: .07, react: 1.0, ts: 1.1, reloadMul: 1.5, lead: .3, mk: [0, 0] },
  normal: { err: .04, react: .6,  ts: 1.7, reloadMul: 1.2, lead: .7, mk: [0, 1] },
  hard:   { err: .02, react: .3,  ts: 2.4, reloadMul: 1.0, lead: 1,  mk: [1, 3] },
};

const THEMES = {
  grass:  { ground: [.38, .52, .25], dirt: [.52, .44, .31], road: [.45, .43, .39], fog: 0xc8dcea, skyTop: '#3a78c2',
            facades: ['#b9a58a', '#8f9aa3', '#a3786a', '#c9b98f', '#8a9a86', '#9a8f84'], deco: 'pine', rock: 0x8a8780, wall: 0xc8c2b4 },
  snow:   { ground: [.90, .92, .96], dirt: [.72, .75, .80], road: [.55, .56, .60], fog: 0xdbe4ec, skyTop: '#6d8fb5',
            facades: ['#9aa6b2', '#b2a196', '#8f9b8a', '#c4c0b8', '#a08a7a'], deco: 'snowpine', rock: 0xa9b0b8, wall: 0xbfc6cc },
  desert: { ground: [.80, .68, .47], dirt: [.70, .53, .35], road: [.62, .56, .46], fog: 0xead9b8, skyTop: '#4f8fd6',
            facades: ['#d8c29a', '#c9a878', '#b88d63', '#e0cfa8'], deco: 'cactus', rock: 0xb48a5e, wall: 0xd9c49c },
};

const MAPS = {
  outpost:  { name: 'Outpost',   size: 'Small',  half: 50,  theme: 'grass',  hills: .8,  gen: 'outpost' },
  downtown: { name: 'Downtown',  size: 'Medium', half: 70,  theme: 'grass',  hills: 1,   gen: 'downtown', roads: true },
  frost:    { name: 'Frostbite', size: 'Large',  half: 95,  theme: 'snow',   hills: 1.4, gen: 'proc', seed: 31 },
  dunes:    { name: 'Dunes',     size: 'Huge',   half: 125, theme: 'desert', hills: 2,   gen: 'proc', seed: 7 },
};
const MAP_ORDER = ['outpost', 'downtown', 'frost', 'dunes'];

const BOT_NAMES = ['Viper', 'Rhino', 'Ghost', 'Hammer', 'Blaze', 'Falcon', 'Brutus', 'Nova', 'Grizzly'];
const BOT_COLORS = [0xa83a32, 0x3a5fa8, 0xc0782a, 0x6d6d73, 0x7d3f9a, 0x2a9a6a, 0x9a5a2a, 0x4a4a9a, 0x8a3a5a];
const HUMAN_COLORS = [0x55703f, 0xd4a017, 0xe05a9a, 0x2fb5c4, 0xd8d8d8, 0x8a5cff, 0xff7043, 0x7cb342];

// ---------------- progression ----------------
const REWARD = { kill: 100, killXp: 60, finish: 150, finishXp: 80, win: 400, winXp: 200 };
const SAVE_KEY = 'tank-arena:save:v1';

function defaultSave() {
  return {
    name: 'Tanker' + Math.floor(100 + Math.random() * 900),
    credits: 300, xp: 0,
    owned: { cannon: true, hunter: true }, mk: {},
    weapon: 'cannon', hull: 'hunter',
    map: 'downtown', bots: 5, diff: 'normal', limit: 15,
    stats: { kills: 0, deaths: 0, wins: 0, matches: 0 },
  };
}
function loadSave() {
  const d = defaultSave();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) return { ...d, ...s, stats: { ...d.stats, ...s.stats }, owned: { ...d.owned, ...s.owned } };
  } catch (e) {}
  return d;
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
const SAVE = loadSave();
const mkOf = id => SAVE.mk[id] || 0;
const levelOf = xp => Math.floor(Math.sqrt(xp / 150)) + 1;
const xpForLevel = l => 150 * (l - 1) * (l - 1);
