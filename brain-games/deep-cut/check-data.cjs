// Sanity-checks the Deep Cut prompt data. Run from anywhere: `node brain-games/deep-cut/check-data.cjs`
// Optional args: data file names to report on (e.g. `geography`); all files are always loaded
// so ids are checked for uniqueness across the whole game.
const path = require('path');
const FILES = ['food-animals', 'geography', 'science-nature', 'culture-sports'];
global.window = global;

const owner = new Map();
for (const f of FILES) {
  const before = (window.DEEP_CUT_PROMPTS || []).length;
  require(path.join(__dirname, 'data', f + '.js'));
  for (const p of window.DEEP_CUT_PROMPTS.slice(before)) owner.set(p, f);
}

// Same normalisation as index.html.
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/\+/g, ' plus ').replace(/#/g, ' sharp ').replace(/['’`.!]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(the|a|an) /, '');
const squash = s => norm(s).replace(/ /g, '');

const only = new Set(process.argv.slice(2));
const errors = [], warnings = [];
const ids = new Set();
for (const p of window.DEEP_CUT_PROMPTS) {
  const f = owner.get(p);
  const where = `${f}:${p.id}`;
  if (!p.id || !p.cat || !p.q || typeof p.a !== 'string') { errors.push(`${where}: missing id/cat/q/a`); continue; }
  if (ids.has(p.id)) errors.push(`${where}: duplicate id`);
  ids.add(p.id);
  const keyOwner = new Map(), primary = new Set();
  const tiers = [0, 0, 0, 0, 0, 0];
  let n = 0;
  for (const entry of p.a.split(';').map(x => x.trim()).filter(Boolean)) {
    const parts = entry.split('=');
    if (parts.length !== 2 || !/^[1-5]$/.test(parts[1].trim())) { errors.push(`${where}: bad entry "${entry}" (need Name/Alias=1..5)`); continue; }
    const names = parts[0].split('/').map(x => x.trim()).filter(Boolean);
    if (!names.length) { errors.push(`${where}: empty name in "${entry}"`); continue; }
    const keys = names.map(squash);
    if (keys.some(k => !k)) { errors.push(`${where}: name normalises to nothing in "${entry}"`); continue; }
    if (primary.has(keys[0])) { warnings.push(`${where}: "${names[0]}" listed twice`); continue; }
    primary.add(keys[0]);
    n++; tiers[+parts[1]]++;
    for (const [i, k] of keys.entries()) {
      const prev = keyOwner.get(k);
      if (prev && prev !== names[0]) warnings.push(`${where}: "${names[i]}" is already an alias of "${prev}"`);
      else keyOwner.set(k, names[0]);
    }
  }
  if (!only.size || only.has(f)) {
    if (n < 25) warnings.push(`${where}: only ${n} answers`);
    if (!tiers[1]) warnings.push(`${where}: no tier-1 (obvious) answers`);
  }
}
const shown = only.size ? [...owner].filter(([, f]) => only.has(f)) : [...owner];
const report = arr => (only.size ? arr.filter(m => only.has(m.split(':')[0])) : arr);
console.log(`${window.DEEP_CUT_PROMPTS.length} prompts loaded (${shown.length} in ${only.size ? [...only].join(', ') : 'all files'})`);
for (const e of report(errors)) console.log('ERROR  ' + e);
for (const w of report(warnings)) console.log('warn   ' + w);
process.exitCode = errors.length ? 1 : 0;
