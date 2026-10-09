// Menus: play setup, garage (progression), pause and end-of-match screens.

function showScreen(name) {
  $('menu').classList.toggle('hidden', name !== 'menu');
  $('hud').classList.toggle('hidden', name !== 'hud');
  $('pause').classList.add('hidden'); $('over').classList.add('hidden');
  overlayOpen = false;
}
function setMsg(text, isError) { $('netMsg').textContent = text || ''; $('netMsg').classList.toggle('err', !!isError); }
const fmt = n => (Math.round(n * 10) / 10).toString();

// ---------------- play tab ----------------
function settingsFromMenu() {
  SAVE.bots = +$('selBots').value; SAVE.diff = $('selDiff').value; SAVE.limit = +$('selLimit').value;
  persist();
  return { map: SAVE.map, bots: SAVE.bots, diff: SAVE.diff, limit: SAVE.limit };
}
function renderMaps() {
  $('maps').innerHTML = MAP_ORDER.map(id => {
    const m = MAPS[id], c = THEMES[m.theme];
    const sw = `rgb(${c.ground.map(v => Math.round(v * 255)).join(',')})`;
    return `<button class="map ${SAVE.map === id ? 'on' : ''}" data-map="${id}"><span class="sw" style="background:${sw}"></span><b>${m.name}</b><small>${m.size} · ${m.theme}</small></button>`;
  }).join('');
}
$('maps').addEventListener('click', e => {
  const b = e.target.closest('[data-map]');
  if (!b || SAVE.map === b.dataset.map) return;
  SAVE.map = b.dataset.map; persist(); renderMaps(); buildWorld(SAVE.map);
});
function renderWallet() {
  const lvl = levelOf(SAVE.xp), a = xpForLevel(lvl), b = xpForLevel(lvl + 1);
  $('wallet').innerHTML = `<span class="lvl">Level ${lvl}</span><span class="xpbar"><i style="width:${100 * (SAVE.xp - a) / (b - a)}%"></i></span><span class="cr">${SAVE.credits.toLocaleString()} cr</span>`;
  const s = SAVE.stats;
  $('career').textContent = `${s.kills} kills · ${s.deaths} deaths · ${s.wins} wins in ${s.matches} matches`;
}
function needPeer() {
  if (typeof Peer !== 'undefined') return true;
  setMsg('Online play could not load (no internet connection?). Solo still works.', true);
  return false;
}
$('btnSolo').addEventListener('click', () => { setMsg(''); startMatch(settingsFromMenu(), 'solo'); });
$('btnHost').addEventListener('click', () => {
  if (!needPeer()) return;
  const settings = settingsFromMenu();
  setMsg('Creating room…');
  hostOnline(() => { setMsg(''); startMatch(settings, 'host'); openPause(true); }, err => setMsg(err, true));
});
$('btnJoin').addEventListener('click', () => {
  const code = $('inCode').value.trim();
  if (code.length < 5) { setMsg('Enter the 5-letter room code from your friend.', true); return; }
  if (!needPeer()) return;
  setMsg('Connecting…');
  joinOnline(code, w => { setMsg(''); enterClientMatch(w); }, err => setMsg(err, true));
});
$('inCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnJoin').click(); });
$('inName').addEventListener('change', () => { SAVE.name = cleanName($('inName').value); $('inName').value = SAVE.name; persist(); });

// ---------------- garage ----------------
function statLine(label, now, next) {
  return `<div class="st"><span>${label}</span><b>${now}${next != null && next !== now ? ` <em>→ ${next}</em>` : ''}</b></div>`;
}
function itemCard(type, id) {
  const item = type === 'weapon' ? WEAPONS[id] : HULLS[id];
  const owned = !!SAVE.owned[id], mk = mkOf(id), equipped = SAVE[type] === id, canUp = owned && mk < MAX_MK;
  let stats;
  if (type === 'weapon') {
    const s = weaponStats(id, mk), n = canUp ? weaponStats(id, mk + 1) : null;
    const dmg = w => fmt(w.dmg) + (w.pellets ? ` ×${w.pellets}` : '');
    stats = statLine('Damage', dmg(s), n && dmg(n)) + statLine('Reload', s.reload.toFixed(2) + 's', n && n.reload.toFixed(2) + 's') +
      statLine('Range', Math.round(weaponRange(s)) + 'm') + (s.splash ? statLine('Blast', `${fmt(s.splashDmg)} in ${s.splash}m`, n && `${fmt(n.splashDmg)} in ${s.splash}m`) : '');
  } else {
    const s = hullStats(id, mk), n = canUp ? hullStats(id, mk + 1) : null;
    stats = statLine('Armor', s.hp, n && n.hp) + statLine('Speed', fmt(s.speed), n && fmt(n.speed)) + statLine('Turning', fmt(s.turn));
  }
  const pips = Array.from({ length: MAX_MK + 1 }, (_, i) => `<i class="${owned && i <= mk ? 'on' : ''}"></i>`).join('');
  const btn = (act, label, cost) => `<button data-act="${act}" data-type="${type}" data-id="${id}" ${cost != null && SAVE.credits < cost ? 'disabled' : ''}>${label}</button>`;
  let actions;
  if (!owned) actions = btn('buy', `Buy · ${item.cost.toLocaleString()} cr`, item.cost);
  else actions = (equipped ? '<button disabled class="eq">Equipped</button>' : btn('equip', 'Equip')) +
    (canUp ? btn('up', `${MK_NAMES[mk + 1]} · ${upgradeCost(item, mk).toLocaleString()} cr`, upgradeCost(item, mk)) : '<button disabled>Max level</button>');
  return `<div class="card ${equipped ? 'equipped' : ''} ${owned ? '' : 'locked'}">
    <div class="ch"><b>${item.name}</b><span class="pips" title="${owned ? MK_NAMES[mk] : 'Locked'}">${pips}</span></div>
    <p>${item.desc}</p>${stats}<div class="acts">${actions}</div></div>`;
}
function renderGarage() {
  $('wCards').innerHTML = WEAPON_ORDER.map(id => itemCard('weapon', id)).join('');
  $('hCards').innerHTML = HULL_ORDER.map(id => itemCard('hull', id)).join('');
  renderWallet();
}
$('tab-garage').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (!b || b.disabled) return;
  const { act, type, id } = b.dataset, item = type === 'weapon' ? WEAPONS[id] : HULLS[id];
  if (act === 'buy' && SAVE.credits >= item.cost) { SAVE.credits -= item.cost; SAVE.owned[id] = true; SAVE[type] = id; }
  else if (act === 'equip') SAVE[type] = id;
  else if (act === 'up') {
    const cost = upgradeCost(item, mkOf(id));
    if (SAVE.credits >= cost && mkOf(id) < MAX_MK) { SAVE.credits -= cost; SAVE.mk[id] = mkOf(id) + 1; }
  }
  persist(); renderGarage();
});
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === tab));
  $('tab-play').classList.toggle('hidden', tab.dataset.tab !== 'play');
  $('tab-garage').classList.toggle('hidden', tab.dataset.tab !== 'garage');
  if (tab.dataset.tab === 'garage') renderGarage();
}));

// ---------------- pause / over ----------------
function roomBox() {
  return `<div class="roombox"><div>Room code</div><div class="code">${Net.code}</div>
    <button class="alt" id="btnCopy">Copy invite link</button><div class="small">Friends can also type the code under <b>Join</b>.</div></div>`;
}
function wireCopy() {
  const b = $('btnCopy');
  if (b) b.onclick = e => {
    e.stopPropagation();
    const done = () => { b.textContent = 'Copied!'; setTimeout(() => (b.textContent = 'Copy invite link'), 1500); };
    navigator.clipboard ? navigator.clipboard.writeText(shareLink()).then(done, () => prompt('Invite link:', shareLink())) : prompt('Invite link:', shareLink());
  };
}
function openPause(justHosted) {
  overlayOpen = true; mouseDown = false; zoom = false;
  if (ROLE === 'solo') state = 'paused';
  const online = ROLE !== 'solo';
  $('pauseBody').innerHTML = `<h1>${justHosted ? 'ROOM READY' : 'PAUSED'}</h1>` + (online ? roomBox() +
    `<p class="small">${ROLE === 'host' ? 'Your browser runs the match: keep this tab open. ' : ''}The match keeps running while this menu is open.</p>` : '') +
    `<button id="btnResume">${justHosted ? 'Start playing' : 'Resume'}</button><button id="btnLeave" class="alt">${online ? 'Leave match' : 'Quit to menu'}</button>`;
  $('pause').classList.remove('hidden');
  wireCopy();
  $('btnResume').onclick = resume;
  $('btnLeave').onclick = () => toMenu();
}
function resume() {
  $('pause').classList.add('hidden'); overlayOpen = false;
  if (state === 'paused') state = 'playing';
  lockMouse();
}
function renderOver(w) {
  overlayOpen = true;
  const title = !w ? 'MATCH OVER' : w === player ? 'VICTORY!' : `${w.name} wins`;
  let btns;
  if (ROLE === 'solo') btns = '<button id="btnAgain">Play again</button><button id="btnMenu" class="alt">Menu</button>';
  else if (ROLE === 'host') btns = '<button id="btnAgain">Rematch</button><button id="btnMenu" class="alt">End room</button>';
  else btns = '<p class="small">Waiting for the host to start a rematch…</p><button id="btnMenu" class="alt">Leave</button>';
  $('overBody').innerHTML = `<h1></h1>${matchEarned ? `<p class="earned">+${matchEarned.toLocaleString()} credits this match</p>` : ''}${boardHTML()}${btns}`;
  $('overBody').querySelector('h1').textContent = title;
  $('over').classList.remove('hidden');
  if ($('btnAgain')) $('btnAgain').onclick = rematch;
  $('btnMenu').onclick = () => toMenu();
}
function toMenu(msg) {
  Net.close();
  clearMatch();
  ROLE = 'solo'; state = 'menu'; mouseDown = false; zoom = false;
  if (document.pointerLockElement) document.exitPointerLock();
  if (engGain) engGain.gain.value = 0;
  if (MAP !== MAPS[SAVE.map]) buildWorld(SAVE.map);
  showScreen('menu');
  renderWallet(); renderMaps();
  setMsg(msg || '', !!msg);
}

// Esc normally arrives as a pointer-lock exit; this covers play without a locked mouse.
addEventListener('keydown', e => {
  if (e.code === 'Escape' && state === 'playing' && !overlayOpen && !document.pointerLockElement) openPause();
});

// ---------------- boot ----------------
$('inName').value = SAVE.name;
$('selBots').value = SAVE.bots; $('selDiff').value = SAVE.diff; $('selLimit').value = SAVE.limit;
renderMaps(); renderWallet();
buildWorld(SAVE.map);
showScreen('menu');
{
  const join = new URLSearchParams(location.search).get('join');
  if (join) { $('inCode').value = join.toUpperCase().slice(0, 5); setMsg(`You're invited to room ${$('inCode').value}. Set your name and press Join.`); }
}
