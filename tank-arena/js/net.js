// Online play over WebRTC via PeerJS. The host's browser runs the match (bots, damage, pickups,
// respawns). Each friend's browser drives its own tank, sends its position and shots, and renders
// what the host broadcasts. PeerJS's free cloud server is only used for the two browsers to find
// each other; game traffic then goes peer to peer.

const PEER_PREFIX = 'bga-tank-arena-';
const PROTO = 1, MAX_HUMANS = 8, SEND_EVERY = .05;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const Net = {
  peer: null, conns: [], host: null, code: null, sendT: 0, nextId: 100,
  send(msg) { if (this.host && this.host.open) this.host.send(msg); },                  // client → host
  event(ev) { this.broadcast({ t: 'e', ev }); },                                          // host → clients
  broadcast(msg) { for (const c of this.conns) if (c.ready && c.open) c.send(msg); },
  tick(dt) {
    this.sendT -= dt;
    if (this.sendT > 0) return;
    this.sendT = SEND_EVERY;
    if (ROLE === 'host') this.broadcast(snapshot());
    else if (ROLE === 'client' && player && player.alive) {
      const p = player;
      this.send({ t: 'st', x: r2(p.pos.x), z: r2(p.pos.z), yaw: r2(p.yaw), tYaw: r2(p.tYaw), pitch: r2(p.pitch), vx: r2(p.vel.x), vz: r2(p.vel.z), spd: r2(p.speed) });
    }
  },
  close() {
    for (const c of this.conns) try { c.close(); } catch (e) {}
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.peer = null; this.conns = []; this.host = null; this.code = null;
  },
};
const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const shareLink = () => `${location.origin}${location.pathname}?join=${Net.code}`;
const cleanName = s => String(s || 'Tanker').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 16) || 'Tanker';

function serTank(t) {
  return { id: t.id, name: t.name, color: t.color, bot: !!t.bot, weapon: t.weapon, wmk: t.ws.mk, hull: t.hull, hmk: t.hs.mk,
    x: r2(t.pos.x), z: r2(t.pos.z), yaw: r2(t.yaw), tYaw: r2(t.tYaw), hp: r2(t.hp), alive: t.alive, k: t.kills, d: t.deaths };
}
function snapshot() {
  return {
    t: 's',
    k: tanks.map(t => [t.id, r2(t.pos.x), r2(t.pos.z), r2(t.yaw), r2(t.tYaw), r2(t.pitch), r2(t.hp), t.alive ? 1 : 0, r2(t.vel.x), r2(t.vel.z), r2(t.speed)]),
    c: crates.map(c => (c.active ? 1 : 0)).join(''),
  };
}

// ---------------- host ----------------
function hostOnline(onReady, onError, tries = 0) {
  Net.close();
  const code = makeCode(), peer = new Peer(PEER_PREFIX + code, { debug: 0 });
  Net.peer = peer;
  peer.on('open', () => { Net.code = code; onReady(code); });
  peer.on('connection', conn => {
    Net.conns.push(conn);
    conn.on('data', d => hostOnData(conn, d));
    conn.on('close', () => hostDrop(conn));
    conn.on('error', () => hostDrop(conn));
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} }); // signalling only; open games keep running
  peer.on('error', e => {
    if (e.type === 'unavailable-id' && tries < 3) hostOnline(onReady, onError, tries + 1);
    else if (!Net.code) onError(`Could not create a room (${e.type}).`);
  });
}
function hostOnData(conn, d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hello') {
    if (conn.tankId != null) return;
    if (tanks.filter(t => !t.bot).length >= MAX_HUMANS) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); return; }
    const weapon = WEAPONS[d.weapon] ? d.weapon : 'cannon', hull = HULLS[d.hull] ? d.hull : 'hunter';
    const mk = v => clamp(Math.floor(+v || 0), 0, MAX_MK);
    const humans = tanks.filter(t => !t.bot).length;
    const t = createTank({ id: Net.nextId++, name: cleanName(d.name), color: HUMAN_COLORS[humans % HUMAN_COLORS.length], ctrl: 'remote', weapon, wmk: mk(d.wmk), hull, hmk: mk(d.hmk) });
    conn.tankId = t.id;
    respawn(t, true);
    Net.event({ e: 'join', tank: serTank(t) });
    conn.send({ t: 'welcome', v: PROTO, you: t.id, code: Net.code, match: MATCH, tanks: tanks.map(serTank), crates: snapshot().c, over: state === 'over' });
    conn.ready = true;
    feedText(`${t.name} joined`);
    return;
  }
  const t = tankById.get(conn.tankId);
  if (!t) return;
  if (d.t === 'st' && t.alive) {
    t.net = { x: +d.x || 0, z: +d.z || 0, yaw: +d.yaw || 0, tYaw: +d.tYaw || 0, pitch: clamp(+d.pitch || 0, -.2, .4), vx: +d.vx || 0, vz: +d.vz || 0, spd: +d.spd || 0 };
  } else if (d.t === 'fire' && t.alive && state === 'playing' && Array.isArray(d.o) && Array.isArray(d.ds)) {
    const ds = d.ds.slice(0, 12).map(vec).map(v => v.normalize());
    shotFx(t, vec(d.o), ds, true);
    Net.event({ e: 'shot', id: t.id, o: d.o, ds: d.ds.slice(0, 12) });
  }
}
function hostDrop(conn) {
  Net.conns = Net.conns.filter(c => c !== conn);
  const t = tankById.get(conn.tankId);
  if (!t) return;
  conn.tankId = null;
  removeTank(t);
  Net.event({ e: 'leave', id: t.id });
  feedText(`${t.name} left`);
}

// ---------------- client ----------------
let netOnWelcome = null;
function joinOnline(code, onWelcome, onError) {
  Net.close();
  code = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const peer = new Peer({ debug: 0 });
  Net.peer = peer;
  let done = false;
  const fail = msg => { if (done) return; done = true; clearTimeout(timer); Net.close(); onError(msg); };
  const timer = setTimeout(() => fail('Could not reach that room. Check the code, or the host may be behind a strict firewall.'), 15000);
  peer.on('open', () => {
    const conn = peer.connect(PEER_PREFIX + code, { serialization: 'json', reliable: true });
    Net.host = conn;
    conn.on('open', () => conn.send({ t: 'hello', v: PROTO, name: SAVE.name, ...myLoadout() }));
    conn.on('data', d => {
      if (!d) return;
      if (d.t === 'welcome') { done = true; clearTimeout(timer); Net.code = d.code; onWelcome(d); }
      else if (d.t === 'full') fail('That room is full.');
      else clientOnData(d);
    });
    conn.on('close', () => { if (done) hostLost(); });
  });
  peer.on('error', e => {
    if (!done) fail(e.type === 'peer-unavailable' ? 'No room with that code.' : `Connection failed (${e.type}).`);
  });
}
function enterClientMatch(w) {
  clearMatch();
  ROLE = 'client'; MATCH = w.match; DIFF = DIFFS[MATCH.diff] || DIFFS.normal;
  buildWorld(MATCH.map); setupCrates();
  for (const s of w.tanks) addNetTank(s, s.id === w.you);
  player = tankById.get(w.you);
  applyCrates(w.crates);
  beginPlay();
  if (w.over) { state = 'over'; renderOver(null); }
}
function addNetTank(s, mine) {
  const t = createTank({ id: s.id, name: s.name, color: s.color, ctrl: mine ? 'local' : 'remote', bot: s.bot, weapon: s.weapon, wmk: s.wmk, hull: s.hull, hmk: s.hmk, k: s.k, d: s.d });
  placeAt(t, s.x, s.z, s.yaw);
  t.tYaw = s.tYaw; t.hp = s.hp;
  if (!s.alive) { t.alive = false; t.hm.color.setHex(0x1c1c1c); if (t.label) t.label.sprite.visible = false; }
  else if (t.label) drawLabel(t);
  return t;
}
function applyCrates(str) { crates.forEach((c, i) => { const a = str[i] === '1'; if (a !== c.active) setCrate(c, a); }); }

function clientOnData(d) {
  if (d.t === 's') {
    for (const [id, x, z, yaw, tYaw, pitch, hp, alive, vx, vz, spd] of d.k) {
      const t = tankById.get(id);
      if (!t) continue;
      if (t.hp !== hp) { t.hp = hp; if (t.label) drawLabel(t); }
      if (t === player) continue;
      t.net = { x, z, yaw, tYaw, pitch, vx, vz, spd };
      if (alive && !t.alive) placeAt(t, x, z, yaw);
    }
    applyCrates(d.c);
    return;
  }
  if (d.t !== 'e') return;
  const ev = d.ev, T = id => tankById.get(id);
  switch (ev.e) {
    case 'shot': { const t = T(ev.id); if (t && t !== player) shotFx(t, vec(ev.o), ev.ds.map(vec), false); break; }
    case 'hit': { const v = T(ev.v), a = T(ev.a); if (v) hitFx(v, a); break; }
    case 'kill': { const v = T(ev.v); if (v && v.alive) applyKill(v, T(ev.a)); break; }
    case 'spawn': { const t = T(ev.id); if (t) placeAt(t, ev.x, ev.z, ev.yaw); break; }
    case 'pick': if (ev.id === player.id) sfxPickup(); break;
    case 'join': if (!T(ev.tank.id)) { addNetTank(ev.tank, false); feedText(`${ev.tank.name} joined`); } break;
    case 'leave': { const t = T(ev.id); if (t) { feedText(`${t.name} left`); removeTank(t); } break; }
    case 'over': showOver(T(ev.w)); break;
    case 'reset':
      for (const t of tanks) { t.kills = 0; t.deaths = 0; }
      beginPlay();
      break;
  }
}
function hostLost() {
  if (ROLE !== 'client') return;
  Net.close();
  toMenu('The host ended the game.');
}
