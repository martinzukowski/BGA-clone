// Core: renderer, effects, tanks, weapons, bots, input, camera, HUD and the main loop.
// ROLE decides who is in charge: 'solo' and 'host' run the full simulation (damage, bots, pickups);
// a 'client' drives only its own tank and renders what the host sends (see net.js).

const V3 = THREE.Vector3;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const fwd = a => new V3(Math.sin(a), 0, Math.cos(a));
const dirFrom = (yaw, pitch) => new V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
const hex = c => '#' + c.toString(16).padStart(6, '0');
const $ = id => document.getElementById(id);
const r2 = n => Math.round(n * 100) / 100;
const arr = v => [r2(v.x), r2(v.y), r2(v.z)];
const vec = a => new V3(a[0], a[1], a[2]);
const TANK_R = 2.3;

// ---------------- renderer / scene ----------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc8dcea);
scene.fog = new THREE.Fog(0xc8dcea, 70, 230);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1500);

scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x5a6038, 0.7));
const sun = new THREE.DirectionalLight(0xfff0d0, 0.85);
const SUN_OFF = new V3(60, 95, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 300 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const boomLight = new THREE.PointLight(0xffa040, 0, 30);
scene.add(boomLight);

// ---------------- match state ----------------
let ROLE = 'solo';     // 'solo' | 'host' | 'client'
let state = 'menu';    // 'menu' | 'playing' | 'paused' (solo only) | 'over'
let overlayOpen = false;
let MATCH = { map: 'downtown', bots: 5, diff: 'normal', limit: 15 };
let DIFF = DIFFS.normal;
const tanks = [], tankById = new Map();
let player = null, crates = [], matchEarned = 0;
const isAuth = () => ROLE !== 'client';

// ---------------- tank models ----------------
const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
const metalMat = new THREE.MeshLambertMaterial({ color: 0x45484a });
const HULL_SHAPES = {
  wasp:   { w: 2.4, h: .62, l: 4.3, y: .9 },
  hunter: { w: 2.6, h: .8,  l: 4.4, y: 1 },
  titan:  { w: 2.8, h: .95, l: 4.6, y: 1.05, skirt: true },
};
function makeTank(color, weaponId, hullId) {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.rotation.order = 'YXZ'; body.scale.setScalar(HULLS[hullId].scale); root.add(body);
  const hm = new THREE.MeshLambertMaterial({ color });
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const cyl = (r1, r2, len, mat, x, y, z, parent) => { const m = add(new THREE.CylinderGeometry(r1, r2, len, 12), mat, x, y, z, parent); m.rotation.x = Math.PI / 2; return m; };
  const sh = HULL_SHAPES[hullId];
  add(new THREE.BoxGeometry(sh.w, sh.h, sh.l), hm, 0, sh.y, 0);
  add(new THREE.BoxGeometry(sh.w, .5, 1.0), hm, 0, sh.y - .05, sh.l / 2 + .2).rotation.x = .5;
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(.75, .9, sh.l + .6), darkMat, s * (sh.w / 2 + .25), .55, 0);
    for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(.36, .36, .2, 12), metalMat, s * (sh.w / 2 + .65), .45, -1.8 + i * .9).rotation.z = Math.PI / 2;
    add(new THREE.BoxGeometry(.9, .12, sh.l + .7), hm, s * (sh.w / 2 + .25), 1.05, 0);
    if (sh.skirt) add(new THREE.BoxGeometry(.18, .7, sh.l + .4), hm, s * (sh.w / 2 + .78), .72, 0);
  }
  const turret = new THREE.Group(); turret.position.set(0, sh.y + sh.h / 2, -.2); body.add(turret);
  add(new THREE.BoxGeometry(2.0, .75, 2.6), hm, 0, .37, 0, turret);
  add(new THREE.BoxGeometry(1.6, .5, .8), hm, 0, .35, -1.6, turret);
  add(new THREE.CylinderGeometry(.35, .4, .3, 10), hm, -.45, .88, -.4, turret);
  const gun = new THREE.Group(); gun.position.set(0, .4, 1.25); turret.add(gun);
  const barrel = new THREE.Group(); gun.add(barrel);
  add(new THREE.BoxGeometry(.7, .5, .5), hm, 0, 0, .1, gun);
  let muzzleZ = 3.7, muzzleX = 0, railMat = null;
  switch (weaponId) {
    case 'twins': {
      const tip = new THREE.MeshLambertMaterial({ color: 0x6fd3ff, emissive: 0x2a8ab0 });
      for (const s of [-1, 1]) { cyl(.11, .12, 2.6, metalMat, s * .32, 0, 1.3, barrel); cyl(.15, .15, .3, tip, s * .32, 0, 2.6, barrel); }
      muzzleZ = 2.85; muzzleX = .32; break;
    }
    case 'scatter':
      cyl(.28, .32, 2.2, metalMat, 0, 0, 1.1, barrel); cyl(.44, .3, .45, metalMat, 0, 0, 2.3, barrel);
      muzzleZ = 2.6; break;
    case 'flame': {
      const noz = new THREE.MeshLambertMaterial({ color: 0xff7a20, emissive: 0x802a00 });
      const fuel = new THREE.MeshLambertMaterial({ color: 0xb03a20 });
      cyl(.16, .2, 2.0, metalMat, 0, 0, 1.0, barrel); cyl(.24, .16, .3, noz, 0, 0, 2.1, barrel);
      for (const s of [-1, 1]) cyl(.26, .26, 1.7, fuel, s * 1.15, .35, -.3, turret);
      muzzleZ = 2.4; break;
    }
    case 'thunder':
      cyl(.24, .28, 3.2, metalMat, 0, 0, 1.6, barrel); add(new THREE.BoxGeometry(.62, .42, .6), metalMat, 0, 0, 3.3, barrel);
      muzzleZ = 3.75; break;
    case 'rail':
      railMat = new THREE.MeshLambertMaterial({ color: 0xb070ff, emissive: 0x7a30ff, emissiveIntensity: .6 });
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(.12, .14, 4.0), metalMat, s * .2, 0, 2.0, barrel);
      cyl(.07, .07, 3.8, railMat, 0, 0, 1.95, barrel);
      for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(.6, .36, .12), metalMat, 0, 0, .8 + i * 1.2, barrel);
      muzzleZ = 4.2; break;
    default:
      cyl(.15, .18, 3.4, metalMat, 0, 0, 1.7, barrel); cyl(.24, .24, .45, metalMat, 0, 0, 3.4, barrel);
  }
  scene.add(root);
  return { root, body, turret, gun, barrel, hm, muzzleZ, muzzleX, railMat };
}
function makeLabel(scale) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(5, 1.25, 1); sprite.position.y = 4.4 * scale;
  return { sprite, canvas: c, tex };
}
function drawLabel(t) {
  const g = t.label.canvas.getContext('2d'); g.clearRect(0, 0, 256, 64);
  g.font = 'bold 26px system-ui,sans-serif'; g.textAlign = 'center';
  g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(t.name, 128, 26);
  g.fillStyle = t.bot ? '#fff' : '#ffd166'; g.fillText(t.name, 128, 26);
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(28, 38, 200, 14);
  const f = clamp(t.hp / t.maxHp, 0, 1);
  g.fillStyle = f > .5 ? '#4cd964' : f > .25 ? '#ffcc00' : '#ff3b30'; g.fillRect(30, 40, 196 * f, 10);
  t.label.tex.needsUpdate = true;
}

// ---------------- tanks ----------------
// o: {id, name, color, ctrl: 'local'|'bot'|'remote', bot, weapon, wmk, hull, hmk, k, d}
function createTank(o) {
  const ws = weaponStats(o.weapon, o.wmk || 0), hs = hullStats(o.hull, o.hmk || 0);
  const t = {
    ...o, ...makeTank(o.color, o.weapon, o.hull), ws, hs, r: TANK_R * HULLS[o.hull].scale, maxHp: hs.hp,
    pos: new V3(), vel: new V3(), yaw: 0, tYaw: 0, pitch: 0, speed: 0, hp: hs.hp, alive: false,
    reload: 0, charge: -1, recoil: 0, kills: o.k || 0, deaths: o.d || 0, respawnT: 0, smokeT: 0, killer: null, side: 1, net: null,
  };
  if (o.ctrl !== 'local') { t.label = makeLabel(HULLS[o.hull].scale); t.root.add(t.label.sprite); t.label.sprite.visible = false; }
  if (o.ctrl === 'bot') t.ai = { scan: 0, target: null, los: false, seeT: 0, wp: null, wpT: 0, strafeT: 0, strafeDir: 1, strafeThr: .6, stuckT: 0, lastPos: new V3(), reverseT: 0, side: 1 };
  tanks.push(t); tankById.set(t.id, t);
  return t;
}
function removeTank(t) {
  scene.remove(t.root); disposeTree(t.root);
  tanks.splice(tanks.indexOf(t), 1); tankById.delete(t.id);
}
function clearMatch() {
  while (tanks.length) removeTank(tanks[0]);
  for (const s of shells) { scene.remove(s.mesh); if (s.ownMat) s.mesh.material.dispose(); } shells.length = 0;
  for (const p of particles) { scene.remove(p.mesh); p.mesh.material.dispose(); } particles.length = 0;
  $('feed').innerHTML = '';
  player = null;
}
function pickSpawn(t) {
  let best = mapSpawns[0], bestD = -1;
  for (const s of mapSpawns) {
    let d = 1e9;
    for (const o of tanks) if (o !== t && o.alive) d = Math.min(d, Math.hypot(o.pos.x - s[0], o.pos.z - s[1]));
    d += Math.random() * 8;
    if (d > bestD) { bestD = d; best = s; }
  }
  return best;
}
function respawn(t, silent) {
  const s = pickSpawn(t);
  placeAt(t, s[0], s[1], Math.atan2(-s[0], -s[1]));
  if (ROLE === 'host' && !silent) Net.event({ e: 'spawn', id: t.id, x: s[0], z: s[1], yaw: r2(t.yaw) });
}
function placeAt(t, x, z, yaw) {
  t.pos.set(x, 0, z); t.yaw = t.tYaw = yaw;
  t.pitch = 0; t.speed = 0; t.hp = t.maxHp; t.alive = true; t.reload = 1; t.charge = -1; t.vel.set(0, 0, 0);
  t.hm.color.setHex(t.color);
  t.net = { x, z, yaw, tYaw: yaw, pitch: 0, vx: 0, vz: 0, spd: 0 };
  if (t.label) { t.label.sprite.visible = true; drawLabel(t); }
  if (t.ai) { t.ai.target = null; t.ai.wp = null; }
  syncModel(t);
}
const tankCenter = t => new V3(t.pos.x, t.root.position.y + 1.3 * HULLS[t.hull].scale, t.pos.z);
function muzzlePos(t) { t.root.updateMatrixWorld(true); return t.barrel.localToWorld(new V3(t.muzzleX * t.side, 0, t.muzzleZ)); }

function syncModel(t) {
  const D = 1.8 * HULLS[t.hull].scale, f = fwd(t.yaw), s = new V3(Math.cos(t.yaw), 0, -Math.sin(t.yaw)), x = t.pos.x, z = t.pos.z;
  const hf = groundH(x + f.x * D, z + f.z * D), hb = groundH(x - f.x * D, z - f.z * D);
  const hl = groundH(x + s.x * D, z + s.z * D), hr = groundH(x - s.x * D, z - s.z * D);
  t.root.position.set(x, Math.max(groundH(x, z), (hf + hb + hl + hr) / 4), z);
  t.body.rotation.set(-Math.atan2(hf - hb, 2 * D), t.yaw, Math.atan2(hl - hr, 2 * D));
  t.turret.rotation.y = t.tYaw - t.yaw;
  t.gun.rotation.x = -t.pitch;
  t.barrel.position.z = -t.recoil * .5;
  if (t.railMat) t.railMat.emissiveIntensity = t.charge >= 0 ? 1 + (1 - t.charge / t.ws.charge) * 4 : .6;
}
function driveTank(t, thr, turn, dt) {
  const h = t.hs, target = thr > 0 ? thr * h.speed : thr * h.rev;
  const braking = Math.sign(target - t.speed) !== Math.sign(t.speed) && t.speed !== 0;
  const a = braking ? h.accel * 1.8 : h.accel;
  t.speed += clamp(target - t.speed, -a * dt, a * dt);
  t.yaw += turn * h.turn * dt;
  const ox = t.pos.x, oz = t.pos.z;
  t.pos.addScaledVector(fwd(t.yaw), t.speed * dt);
  if (resolveSolids(t.pos, t.r)) t.speed *= (1 - 2.5 * dt);
  t.vel.set((t.pos.x - ox) / dt, 0, (t.pos.z - oz) / dt);
}
// Tanks controlled elsewhere: dead-reckon toward the last reported state.
function remoteUpdate(t, dt) {
  const n = t.net;
  if (!n || !t.alive) return;
  n.x += n.vx * dt; n.z += n.vz * dt;
  if (Math.hypot(n.x - t.pos.x, n.z - t.pos.z) > 10) t.pos.set(n.x, 0, n.z);
  const k = 1 - Math.exp(-dt * 12);
  t.pos.x += (n.x - t.pos.x) * k; t.pos.z += (n.z - t.pos.z) * k;
  t.yaw += angDiff(t.yaw, n.yaw) * k; t.tYaw += angDiff(t.tYaw, n.tYaw) * k; t.pitch += (n.pitch - t.pitch) * k;
  t.vel.set(n.vx, 0, n.vz); t.speed = n.spd;
}

// ---------------- line of sight / rays ----------------
function castRay(o, d, max, ignore) {
  let best = rayWorld(o, d, max);
  for (const tk of tanks) { if (tk === ignore || !tk.alive) continue; const t = raySphere(o, d, tankCenter(tk), tk.r); if (t < best) best = t; }
  return best;
}
function hasLOS(a, b) {
  const o = new V3(a.pos.x, a.root.position.y + 2.1, a.pos.z), e = new V3(b.pos.x, b.root.position.y + 1.6, b.pos.z);
  const d = e.clone().sub(o), L = d.length(); d.divideScalar(L);
  for (const s of solids) if (rayBox(o, d, s) < L) return false;
  for (let s = 3; s < L; s += 3) if (o.y + d.y * s < groundH(o.x + d.x * s, o.z + d.z * s) + .2) return false;
  return true;
}

// ---------------- effects ----------------
const shells = [], particles = [];
const sphGeo = new THREE.SphereGeometry(1, 10, 8), cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const SHELL_LOOK = {
  shell:  { geo: new THREE.BoxGeometry(.2, .2, 1.6), mat: new THREE.MeshBasicMaterial({ color: 0xffd27a }) },
  heavy:  { geo: new THREE.BoxGeometry(.34, .34, 2), mat: new THREE.MeshBasicMaterial({ color: 0xff9a40 }) },
  pellet: { geo: new THREE.BoxGeometry(.1, .1, .9), mat: new THREE.MeshBasicMaterial({ color: 0xffe6a0 }) },
  plasma: { geo: new THREE.SphereGeometry(.3, 10, 8), mat: new THREE.MeshBasicMaterial({ color: 0x8fe0ff, blending: THREE.AdditiveBlending, transparent: true }) },
};
let shake = 0;

function spawnP(o) {
  const Mat = o.basic ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial;
  const mat = new Mat({ color: o.color, transparent: true, opacity: o.o0, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending });
  const mesh = new THREE.Mesh(o.geo || sphGeo, mat);
  mesh.position.copy(o.pos); mesh.scale.setScalar(o.s0);
  scene.add(mesh);
  particles.push({ mesh, vel: o.vel || new V3(), life: o.life, max: o.life, s0: o.s0, s1: o.s1, g: o.g || 0, o0: o.o0, spin: o.spin || 0 });
}
function smoke(p, size, dark) {
  spawnP({ color: dark ? 0x222222 : 0x6a6a6a, pos: p.clone().add(new V3(rand(-.5, .5), rand(0, .5), rand(-.5, .5))), vel: new V3(rand(-.6, .6), rand(1.5, 3), rand(-.6, .6)), life: rand(1, 1.8), s0: .5 * size, s1: 2 * size, o0: .6 });
}
function spark(p, color, size) {
  spawnP({ basic: true, add: true, color, pos: p, life: .18, s0: .3 * size, s1: 1.4 * size, o0: 1 });
  for (let i = 0; i < 4; i++) spawnP({ basic: true, add: true, geo: cubeGeo, color, pos: p, vel: new V3(rand(-5, 5), rand(1, 6), rand(-5, 5)), life: rand(.2, .4), s0: .12, s1: .05, g: 10, o0: 1 });
}
function explode(p, size) {
  spawnP({ basic: true, add: true, color: 0xffa640, pos: p, life: .38, s0: .4 * size, s1: 2.8 * size, o0: 1 });
  spawnP({ basic: true, add: true, color: 0xfff2b0, pos: p, life: .16, s0: .3 * size, s1: 1.5 * size, o0: 1 });
  for (let i = 0; i < Math.round(4 * size); i++) smoke(p, size, false);
  for (let i = 0; i < Math.round(7 * size); i++)
    spawnP({ geo: cubeGeo, color: 0x3a2e22, pos: p, vel: new V3(rand(-6, 6), rand(4, 10), rand(-6, 6)), life: rand(.6, 1.2), s0: .25, s1: .2, g: 18, o0: 1, spin: rand(5, 12) });
  boomLight.position.copy(p).y += 1; boomLight.intensity = 3 * size;
  const d = camera.position.distanceTo(p);
  shake += size * Math.max(0, 1 - d / 40) * .5;
  sfxBoom(d, size);
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { scene.remove(p.mesh); p.mesh.material.dispose(); particles.splice(i, 1); continue; }
    const k = 1 - p.life / p.max;
    p.vel.y -= p.g * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    if (p.g && p.mesh.position.y < groundH(p.mesh.position.x, p.mesh.position.z)) { p.vel.set(0, 0, 0); p.g = 0; }
    p.mesh.scale.setScalar(p.s0 + (p.s1 - p.s0) * k);
    p.mesh.material.opacity = p.o0 * (1 - k);
    if (p.spin) p.mesh.rotation.x += p.spin * dt;
  }
  boomLight.intensity *= Math.exp(-dt * 10);
}

// ---------------- weapons ----------------
function spreadDirs(ws, dir) {
  const out = [];
  for (let i = 0; i < (ws.pellets || 1); i++) {
    const d = dir.clone(), s = ws.spread || 0;
    if (s) { d.x += rand(-s, s); d.y += rand(-s, s) * .6; d.z += rand(-s, s); d.normalize(); }
    out.push(d);
  }
  return out;
}
// Pull the trigger: starts the railgun charge, or fires everything else straight away.
function trigger(t, aimFn) {
  if (!t.alive || t.reload > 0 || t.charge >= 0) return;
  if (t.ws.kind === 'rail') { t.charge = t.ws.charge; sfxCharge(camera.position.distanceTo(t.pos), t.ws.charge); return; }
  if (t.muzzleX) t.side = -t.side;
  const mz = muzzlePos(t);
  doFire(t, mz, spreadDirs(t.ws, aimFn(mz)));
}
// A shot that originates on this machine (local player or a bot on the authority).
function doFire(t, mz, ds) {
  t.reload = t.ws.reload * (t.ctrl === 'bot' ? DIFF.reloadMul : 1);
  t.charge = -1;
  shotFx(t, mz, ds, isAuth());
  if (ROLE === 'client') Net.send({ t: 'fire', o: arr(mz), ds: ds.map(arr) });
  if (ROLE === 'host') Net.event({ e: 'shot', id: t.id, o: arr(mz), ds: ds.map(arr) });
}
// Spawns the projectiles (or rail beam) for a shot. `auth` shots deal damage; others are visual only.
function shotFx(t, mz, ds, auth) {
  const ws = t.ws, dist = camera.position.distanceTo(mz);
  t.recoil = ws.recoil;
  if (ws.kind === 'rail') { fireRail(t, mz, ds[0], auth); return; }
  for (const d of ds) {
    let mesh, ownMat = false;
    if (ws.kind === 'flame') {
      mesh = new THREE.Mesh(sphGeo, new THREE.MeshBasicMaterial({ color: Math.random() < .5 ? 0xff7a20 : 0xffb030, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.scale.setScalar(.3); ownMat = true;
    } else mesh = new THREE.Mesh(SHELL_LOOK[ws.kind].geo, SHELL_LOOK[ws.kind].mat);
    mesh.position.copy(mz); scene.add(mesh);
    const vel = d.clone().multiplyScalar(ws.speed);
    if (ws.kind === 'flame') vel.add(t.vel);
    shells.push({ pos: mz.clone(), vel, owner: t, ws, life: ws.life, age: 0, mesh, ownMat, auth });
  }
  const fp = mz.clone().addScaledVector(ds[0], .6);
  if (ws.kind === 'flame') { sfxFlame(dist); return; }
  if (ws.kind === 'plasma') { spawnP({ basic: true, add: true, color: 0x6fd3ff, pos: fp, life: .08, s0: .3, s1: .8, o0: 1 }); sfxPlasma(dist); return; }
  spawnP({ basic: true, add: true, color: 0xffc060, pos: fp, life: .1, s0: .5, s1: ws.kind === 'heavy' ? 2 : 1.2, o0: 1 });
  smoke(fp, .5, false); smoke(fp, .5, false);
  if (t === player) shake += ws.kind === 'heavy' ? .25 : .12;
  if (ws.kind === 'pellet') sfxScatter(dist); else sfxFire(dist, ws.kind === 'heavy');
}
function fireRail(t, o, d, auth) {
  const end = rayWorld(o, d, t.ws.range);
  if (auth) {
    for (const tk of tanks) {
      if (tk === t || !tk.alive) continue;
      if (raySphere(o, d, tankCenter(tk), tk.r) < end) damage(tk, t.ws.dmg, t);
    }
  }
  const len = end, mid = o.clone().addScaledVector(d, len / 2);
  for (const [r, c, life] of [[.12, 0xe0c0ff, .35], [.35, 0x9a50ff, .5]]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.copy(mid); beam.quaternion.setFromUnitVectors(new V3(0, 1, 0), d); scene.add(beam);
    particles.push({ mesh: beam, vel: new V3(), life, max: life, s0: 1, s1: .2, g: 0, o0: 1, spin: 0 });
  }
  spark(o.clone().addScaledVector(d, end), 0xb070ff, 1.5);
  if (t === player) shake += .2;
  sfxRail(camera.position.distanceTo(o));
}
function updateShells(dt) {
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i], ws = s.ws, flame = ws.kind === 'flame';
    s.vel.y -= ws.grav * dt; s.age += dt;
    const step = s.vel.length() * dt, dir = s.vel.clone().normalize(), p0 = s.pos;
    const fr = flame ? .3 + s.age * 3 : 0; // flames widen as they travel
    let hitT = step, hitTank = null, hit = false;
    for (const tk of tanks) {
      if (!tk.alive || tk === s.owner) continue;
      const t = raySphere(p0, dir, tankCenter(tk), tk.r + fr * .5);
      if (t < hitT) { hitT = t; hitTank = tk; hit = true; }
    }
    for (const b of solids) { const t = rayBox(p0, dir, b); if (t < hitT) { hitT = t; hitTank = null; hit = true; } }
    for (let k = 1; k <= 4; k++) {
      const tt = hitT * k / 4;
      if (p0.y + dir.y * tt < groundH(p0.x + dir.x * tt, p0.z + dir.z * tt)) { hitT = tt; hitTank = null; hit = true; break; }
    }
    s.life -= dt;
    if (hit || s.life <= 0) {
      const p = p0.clone().addScaledVector(dir, hitT);
      scene.remove(s.mesh); if (s.ownMat) s.mesh.material.dispose();
      shells.splice(i, 1);
      if (!hit) continue;
      if (hitTank && s.auth) damage(hitTank, ws.dmg, s.owner);
      impactFx(ws.kind, p, !!hitTank);
      if (s.auth && ws.splash) for (const tk of tanks) {
        if (!tk.alive || tk === hitTank || tk === s.owner) continue;
        const d = tankCenter(tk).distanceTo(p);
        if (d < ws.splash) damage(tk, ws.splashDmg * (1 - d / ws.splash), s.owner);
      }
      continue;
    }
    s.pos.addScaledVector(dir, step);
    s.mesh.position.copy(s.pos);
    if (flame) { s.mesh.scale.setScalar(fr); s.mesh.material.opacity = .9 * (1 - s.age / ws.life); }
    else s.mesh.lookAt(s.pos.clone().add(s.vel));
  }
}
function impactFx(kind, p, onTank) {
  const d = camera.position.distanceTo(p);
  if (kind === 'shell') explode(p, onTank ? 1.1 : .75);
  else if (kind === 'heavy') explode(p, 1.9);
  else if (kind === 'plasma') { spark(p, 0x6fd3ff, 1); if (onTank) sfxClang(d); }
  else if (kind === 'pellet') { spark(p, 0xffd27a, .6); if (onTank) sfxClang(d); }
  if (onTank && (kind === 'shell' || kind === 'heavy')) sfxClang(d);
}

// ---------------- combat (authority) ----------------
let dmgA = 0, hitA = 0;
function damage(v, amount, a) {
  if (!v.alive || state !== 'playing') return;
  v.hp -= amount;
  if (ROLE === 'host') Net.event({ e: 'hit', v: v.id, a: a ? a.id : -1 });
  hitFx(v, a);
  if (v.hp <= 0) kill(v, a);
  else if (v.label) drawLabel(v);
}
function hitFx(v, a) {
  if (v === player) { dmgA = Math.min(1, dmgA + .5); shake += .25; }
  if (a === player && v !== player) hitA = 1;
}
function kill(v, a) {
  applyKill(v, a);
  if (ROLE === 'host') Net.event({ e: 'kill', v: v.id, a: a ? a.id : -1 });
  if (a && a !== v && a.kills >= MATCH.limit) endMatch(a);
}
function applyKill(v, a) {
  v.alive = false; v.hp = 0; v.deaths++; v.respawnT = 4.5; v.killer = a; v.charge = -1;
  v.hm.color.setHex(0x1c1c1c);
  if (v.label) v.label.sprite.visible = false;
  if (a && a !== v) a.kills++;
  explode(tankCenter(v), 2.2);
  addFeed(a, v);
  if (a === player && v !== player) { reward(REWARD.kill, REWARD.killXp, `+${REWARD.kill} cr · destroyed ${v.name}`); SAVE.stats.kills++; persist(); }
  if (v === player) { SAVE.stats.deaths++; persist(); }
}
function reward(cr, xp, text) {
  const lvl = levelOf(SAVE.xp);
  SAVE.credits += cr; SAVE.xp += xp; matchEarned += cr; persist();
  const el = document.createElement('div'); el.textContent = text; $('rewards').prepend(el);
  if (levelOf(SAVE.xp) > lvl) { const up = document.createElement('div'); up.className = 'lvl'; up.textContent = `LEVEL UP! Level ${levelOf(SAVE.xp)}`; $('rewards').prepend(up); setTimeout(() => up.remove(), 3500); }
  setTimeout(() => el.remove(), 2500);
}
function addFeed(a, v) {
  const el = document.createElement('div');
  const name = t => { const b = document.createElement('b'); b.style.color = hex(t.color); b.textContent = t.name; return b; };
  if (a && a !== v) el.append(name(a), ' 💥 ', name(v)); else el.append(name(v), ' self-destructed');
  feedPush(el);
}
function feedText(text) { const el = document.createElement('div'); el.textContent = text; feedPush(el); }
function feedPush(el) {
  $('feed').prepend(el);
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 500); }, 5000);
  while ($('feed').children.length > 6) $('feed').lastChild.remove();
}

// ---------------- bot AI ----------------
const PREF_DIST = { cannon: 34, twins: 26, scatter: 13, flame: 8, thunder: 42, rail: 60 };
function pickWaypoint(tg) {
  for (let i = 0; i < 25; i++) {
    let x, z;
    if (tg && Math.random() < .6) { x = tg.pos.x + rand(-15, 15); z = tg.pos.z + rand(-15, 15); }
    else { x = rand(-HALF + 8, HALF - 8); z = rand(-HALF + 8, HALF - 8); }
    if (!blockedAt(x, z, 4)) return new V3(x, 0, z);
  }
  return new V3(0, 0, HALF * .4);
}
function pathClear(p, yaw, len) {
  for (let s = 2; s <= len; s += 2) if (blockedAt(p.x + Math.sin(yaw) * s, p.z + Math.cos(yaw) * s, 2.6)) return false;
  return true;
}
function avoid(t, yaw) {
  if (pathClear(t.pos, yaw, 8)) return yaw;
  const side = t.ai.side;
  for (const o of [.4, .8, 1.2, 1.7, 2.3]) {
    if (pathClear(t.pos, yaw + o * side, 8)) return yaw + o * side;
    if (pathClear(t.pos, yaw - o * side, 8)) { t.ai.side = -side; return yaw - o * side; }
  }
  return yaw + Math.PI;
}
const botAimDir = t => dirFrom(t.tYaw + rand(-DIFF.err, DIFF.err), t.pitch + rand(-DIFF.err, DIFF.err) * .6);
function botUpdate(t, dt) {
  const ai = t.ai, ws = t.ws;
  ai.scan -= dt;
  if (ai.scan <= 0) {
    ai.scan = rand(.35, .65);
    let best = null, bs = 1e9;
    for (const o of tanks) {
      if (o === t || !o.alive) continue;
      const d = t.pos.distanceTo(o.pos);
      if (d > 130) continue;
      const score = d + (hasLOS(t, o) ? 0 : 60) - (o.bot ? 0 : 8);
      if (score < bs) { bs = score; best = o; }
    }
    ai.target = best;
    ai.los = !!best && hasLOS(t, best);
  }
  const tg = ai.target && ai.target.alive ? ai.target : null;
  const dist = tg ? t.pos.distanceTo(tg.pos) : 1e9, pref = PREF_DIST[ws.id];
  ai.seeT = tg && ai.los ? ai.seeT + dt : 0;

  let goalYaw, thr = 1, healing = false;
  if (t.hp < t.maxHp * .5) {
    let bc = null, bd = 60;
    for (const c of crates) if (c.active) { const d = t.pos.distanceTo(c.pos); if (d < bd) { bd = d; bc = c; } }
    if (bc) { healing = true; goalYaw = Math.atan2(bc.pos.x - t.pos.x, bc.pos.z - t.pos.z); }
  }
  if (!healing) {
    const toT = tg ? Math.atan2(tg.pos.x - t.pos.x, tg.pos.z - t.pos.z) : 0;
    if (tg && ai.los && dist < pref * 1.6) {
      ai.strafeT -= dt;
      if (ai.strafeT <= 0) { ai.strafeT = rand(1.5, 4); ai.strafeDir = Math.random() < .5 ? -1 : 1; ai.strafeThr = Math.random() < .3 ? 0 : rand(.4, .9); }
      const off = dist > pref * 1.2 ? .5 : dist < pref * .7 ? 2.1 : Math.PI / 2;
      goalYaw = toT + ai.strafeDir * off;
      thr = dist < pref * .7 || dist > pref * 1.2 ? .9 : ai.strafeThr;
    } else if (tg && ai.los) {
      goalYaw = toT; // close the distance
    } else {
      ai.wpT -= dt;
      if (!ai.wp || ai.wpT <= 0 || Math.hypot(ai.wp.x - t.pos.x, ai.wp.z - t.pos.z) < 5) { ai.wp = pickWaypoint(tg); ai.wpT = rand(6, 12); }
      goalYaw = Math.atan2(ai.wp.x - t.pos.x, ai.wp.z - t.pos.z);
    }
  }
  if (thr > 0) goalYaw = avoid(t, goalYaw);
  const diff = angDiff(t.yaw, goalYaw);
  let turn = clamp(diff * 2, -1, 1);
  if (Math.abs(diff) > 1.2) thr *= .2;
  ai.stuckT += dt;
  if (ai.stuckT > 1.2) {
    if (t.pos.distanceTo(ai.lastPos) < 1 && thr > .2) { ai.reverseT = 1; ai.wp = null; }
    ai.stuckT = 0; ai.lastPos.copy(t.pos);
  }
  if (ai.reverseT > 0) { ai.reverseT -= dt; thr = -1; turn = ai.strafeDir; }
  driveTank(t, thr, turn, dt);

  const ts = DIFF.ts * dt;
  if (tg) {
    const muzzleY = t.root.position.y + 2.0, tt = ws.kind === 'rail' ? 0 : dist / ws.speed;
    const aimP = tg.pos.clone().addScaledVector(tg.vel, tt * DIFF.lead);
    aimP.y = groundH(aimP.x, aimP.z) + 1.3;
    const dx = aimP.x - t.pos.x, dz = aimP.z - t.pos.z, h = Math.hypot(dx, dz);
    const wantYaw = Math.atan2(dx, dz), wantPitch = Math.atan2(aimP.y - muzzleY + .5 * (ws.grav || 0) * tt * tt, h);
    t.tYaw += clamp(angDiff(t.tYaw, wantYaw), -ts, ts);
    t.pitch = clamp(t.pitch + clamp(wantPitch - t.pitch, -ts * .5, ts * .5), -.15, .35);
    if (ai.los && ai.seeT > DIFF.react && Math.abs(angDiff(t.tYaw, wantYaw)) < (ws.kind === 'flame' ? .2 : .06) && dist < weaponRange(ws))
      trigger(t, () => botAimDir(t));
  } else {
    t.tYaw += clamp(angDiff(t.tYaw, t.yaw), -ts, ts);
    t.pitch *= .95;
  }
}

// ---------------- input ----------------
const keys = {};
let mouseDown = false, zoom = false, view = 'tp';
const key = c => !!keys[c];
const inputActive = () => state === 'playing' && !overlayOpen;
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyV' && inputActive()) view = view === 'fp' ? 'tp' : 'fp';
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; zoom = false; });
addEventListener('contextmenu', e => e.preventDefault());
renderer.domElement.addEventListener('mousedown', e => {
  if (!inputActive()) return;
  if (!document.pointerLockElement) lockMouse();
  if (e.button === 0) mouseDown = true;
  if (e.button === 2) zoom = true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; if (e.button === 2) zoom = false; });
addEventListener('mousemove', e => {
  if (!inputActive() || !document.pointerLockElement || !player) return;
  const s = zoom ? .0008 : .0022;
  player.tYaw -= e.movementX * s;
  player.pitch = clamp(player.pitch - e.movementY * s, -.15, .35);
});
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && state === 'playing' && !overlayOpen) openPause();
});
function lockMouse() { try { const r = renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

function playerAimDir(mz) {
  const o = camera.position.clone(), d = new V3(); camera.getWorldDirection(d);
  const aim = o.addScaledVector(d, castRay(camera.position, d, 300, player));
  const bd = dirFrom(player.tYaw, player.pitch);
  let dir = aim.sub(mz).normalize();
  if (dir.dot(bd) < .85) dir = bd;
  return dir;
}
function playerControl(dt) {
  const p = player;
  if (!p || !p.alive) return;
  const act = inputActive();
  const thr = act ? (key('KeyW') || key('ArrowUp') ? 1 : 0) - (key('KeyS') || key('ArrowDown') ? 1 : 0) : 0;
  const turn = act ? (key('KeyA') || key('ArrowLeft') ? 1 : 0) - (key('KeyD') || key('ArrowRight') ? 1 : 0) : 0;
  if (act) p.tYaw += ((key('KeyQ') ? 1 : 0) - (key('KeyE') ? 1 : 0)) * 1.8 * dt;
  driveTank(p, thr, turn, dt);
  if (act && (mouseDown || key('Space'))) trigger(p, playerAimDir);
}

// ---------------- audio ----------------
let AC = null, master, noiseBuf, engOsc, engGain;
function initAudio() {
  if (AC) { AC.resume(); return; }
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = .45; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  engOsc = AC.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 35;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
  engGain = AC.createGain(); engGain.gain.value = 0;
  engOsc.connect(f); f.connect(engGain); engGain.connect(master); engOsc.start();
}
const distVol = d => 1 / (1 + d / 14);
function noiseBurst(vol, dur, freq, type = 'lowpass') {
  if (!AC || vol < .01) return;
  const now = AC.currentTime, src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type;
  f.frequency.setValueAtTime(freq, now); if (type === 'lowpass') f.frequency.exponentialRampToValueAtTime(50, now + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.001, now + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(now, Math.random()); src.stop(now + dur);
}
function tone(type, f0, f1, vol, dur) {
  if (!AC || vol < .01) return;
  const now = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.001, now + dur);
  o.connect(g); g.connect(master); o.start(now); o.stop(now + dur);
}
const sfxFire = (d, heavy) => { const v = distVol(d); noiseBurst(v * .9, heavy ? .7 : .45, heavy ? 1400 : 2200); tone('sine', heavy ? 90 : 120, 35, v * .8, heavy ? .45 : .3); };
const sfxPlasma = d => tone('square', 900, 250, distVol(d) * .12, .09);
const sfxScatter = d => { const v = distVol(d); noiseBurst(v * .8, .3, 4000); tone('sine', 140, 50, v * .5, .2); };
const sfxFlame = d => noiseBurst(distVol(d) * .18, .12, 900, 'bandpass');
const sfxRail = d => { const v = distVol(d); tone('sawtooth', 1800, 80, v * .35, .35); noiseBurst(v * .6, .25, 6000); };
const sfxCharge = (d, dur) => tone('sawtooth', 180, 1400, distVol(d) * .12, dur);
const sfxBoom = (d, s) => { const v = distVol(d) * Math.min(1.2, s); noiseBurst(v, .9 + s * .3, 900); tone('sine', 80, 30, v * .7, .6); };
const sfxClang = d => tone('square', 420, 180, distVol(d) * .25, .2);
const sfxPickup = () => tone('sine', 500, 1000, .3, .25);

// ---------------- crates ----------------
const crateTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#2f9e44'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1b5e28'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = '#fff'; g.fillRect(26, 14, 12, 36); g.fillRect(14, 26, 36, 12);
});
const crateMat = new THREE.MeshLambertMaterial({ map: crateTex, emissive: 0x0a3010 });
const crateGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
function setupCrates() {
  crates = mapCrateSpots.map(([x, z]) => {
    const m = new THREE.Mesh(crateGeo, crateMat); m.castShadow = true; worldGroup.add(m);
    return { pos: new V3(x, groundH(x, z), z), mesh: m, active: true, t: 0 };
  });
}
function setCrate(c, active) { c.active = active; c.mesh.visible = active; }
function updateCrates(dt) {
  const time = performance.now() / 1000;
  for (const c of crates) {
    c.mesh.position.set(c.pos.x, c.pos.y + 1.2 + Math.sin(time * 2) * .25, c.pos.z);
    c.mesh.rotation.y += dt;
    if (!isAuth()) continue;
    if (!c.active) { c.t -= dt; if (c.t <= 0) setCrate(c, true); continue; }
    for (const t of tanks) {
      if (!t.alive || t.hp >= t.maxHp || Math.hypot(t.pos.x - c.pos.x, t.pos.z - c.pos.z) > 3) continue;
      t.hp = Math.min(t.maxHp, t.hp + t.maxHp * .4); setCrate(c, false); c.t = 15;
      if (t === player) sfxPickup();
      if (t.label) drawLabel(t);
      if (ROLE === 'host') Net.event({ e: 'pick', id: t.id });
      break;
    }
  }
}

// ---------------- match flow ----------------
function botLoadout() {
  const [lo, hi] = DIFF.mk;
  return {
    weapon: WEAPON_ORDER[Math.floor(Math.random() * WEAPON_ORDER.length)], wmk: Math.floor(rand(lo, hi + 1)),
    hull: HULL_ORDER[Math.floor(Math.random() * HULL_ORDER.length)], hmk: Math.floor(rand(lo, hi + 1)),
  };
}
function myLoadout() { return { weapon: SAVE.weapon, wmk: mkOf(SAVE.weapon), hull: SAVE.hull, hmk: mkOf(SAVE.hull) }; }

// Solo or host: build the map and spawn everyone.
function startMatch(settings, role) {
  clearMatch();
  ROLE = role; MATCH = settings; DIFF = DIFFS[MATCH.diff];
  buildWorld(MATCH.map); setupCrates();
  player = createTank({ id: 0, name: SAVE.name, color: HUMAN_COLORS[0], ctrl: 'local', ...myLoadout() });
  for (let i = 0; i < MATCH.bots; i++)
    createTank({ id: i + 1, name: BOT_NAMES[i], color: BOT_COLORS[i], ctrl: 'bot', bot: true, ...botLoadout() });
  for (const t of tanks) respawn(t, true);
  beginPlay();
}
function beginPlay() {
  view = 'tp'; shake = 0; dmgA = 0; matchEarned = 0; camElev = .35; camDist = 10;
  state = 'playing'; overlayOpen = false;
  showScreen('hud');
  initAudio();
  lockMouse();
}
function rematch() {
  if (ROLE === 'host') Net.event({ e: 'reset' });
  for (const s of shells) { scene.remove(s.mesh); if (s.ownMat) s.mesh.material.dispose(); } shells.length = 0;
  for (const t of tanks) { t.kills = 0; t.deaths = 0; t.alive = false; }
  for (const t of tanks) respawn(t);
  for (const c of crates) setCrate(c, true);
  beginPlay();
}
function endMatch(w) {
  if (ROLE === 'host') Net.event({ e: 'over', w: w.id });
  showOver(w);
}
function showOver(w) {
  state = 'over'; mouseDown = false;
  if (document.pointerLockElement) document.exitPointerLock();
  reward(REWARD.finish, REWARD.finishXp, `+${REWARD.finish} cr · match finished`);
  if (w === player) { reward(REWARD.win, REWARD.winXp, `+${REWARD.win} cr · victory`); SAVE.stats.wins++; }
  SAVE.stats.matches++; persist();
  if (engGain) engGain.gain.value = 0;
  renderOver(w);
}

// ---------------- update ----------------
function update(dt) {
  playerControl(dt);
  for (const t of tanks) {
    if (t.ctrl === 'bot' && t.alive && isAuth()) botUpdate(t, dt);
    else if (t.ctrl === 'remote') remoteUpdate(t, dt);
  }
  // tank vs tank: only tanks simulated here get pushed
  for (let i = 0; i < tanks.length; i++) for (let j = i + 1; j < tanks.length; j++) {
    const a = tanks[i], b = tanks[j];
    if (!a.alive || !b.alive) continue;
    const wa = a.ctrl === 'remote' ? 0 : 1, wb = b.ctrl === 'remote' ? 0 : 1;
    if (!wa && !wb) continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), m = a.r + b.r;
    if (d < m && d > 1e-4) {
      const push = (m - d) / (wa + wb), nx = dx / d, nz = dz / d;
      a.pos.x -= nx * push * wa; a.pos.z -= nz * push * wa; b.pos.x += nx * push * wb; b.pos.z += nz * push * wb;
      if (wa) resolveSolids(a.pos, a.r);
      if (wb) resolveSolids(b.pos, b.r);
    }
  }
  for (const t of tanks) {
    t.reload -= dt; t.recoil = Math.max(0, t.recoil - dt * 3);
    if (t.charge >= 0 && t.alive) {
      t.charge -= dt;
      if (t.charge < 0) {
        const mz = muzzlePos(t);
        doFire(t, mz, [t === player ? playerAimDir(mz) : botAimDir(t)]);
      }
    }
    if (!t.alive) {
      t.respawnT -= dt; t.smokeT -= dt;
      if (t.smokeT <= 0) { t.smokeT = .12; smoke(tankCenter(t), 1, true); }
      if (t.respawnT <= 0 && isAuth() && state === 'playing') respawn(t);
    } else if (t.hp < t.maxHp * .35) {
      t.smokeT -= dt;
      if (t.smokeT <= 0) { t.smokeT = .2; smoke(tankCenter(t).add(new V3(0, .5, 0)), .6, true); }
    }
    syncModel(t);
  }
  updateCrates(dt);
  updateShells(dt);
  if (engGain && player) {
    engGain.gain.value = player.alive && state === 'playing' ? .05 + Math.abs(player.speed) * .006 : 0;
    engOsc.frequency.value = 32 + Math.abs(player.speed) * 2.8;
  }
}

// ---------------- camera ----------------
// Third person by default. If a wall is behind the tank the camera swings up over it
// instead of zooming in, so the hull always stays in view.
let menuAng = 0, camElev = .35, camDist = 10;
function updateCamera(dt) {
  if (state === 'menu' || !player) {
    menuAng += dt * .06;
    const R = HALF * 1.35;
    camera.position.set(Math.cos(menuAng) * R, HALF * .7, Math.sin(menuAng) * R);
    camera.lookAt(0, 0, 0);
    if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
    sun.target.position.set(0, 0, 0);
  } else {
    const p = player, base = p.root.position, S = HULLS[p.hull].scale, d = dirFrom(p.tYaw, p.pitch);
    if (view === 'fp') {
      camera.position.set(base.x, base.y + 2.75 * S, base.z).addScaledVector(fwd(p.tYaw), -.35);
      camera.lookAt(camera.position.clone().add(d));
    } else {
      const head = new V3(base.x, base.y + 2.6 * S, base.z), want = 9 + 2 * S, yawB = p.tYaw + Math.PI;
      let elev = clamp(.32 - p.pitch * .6, .12, 1.3), dist = want;
      while (elev < 1.3 && rayWorld(head, dirFrom(yawB, elev), want + .5) < want) elev += .1;
      if (elev >= 1.3) { elev = 1.3; dist = Math.max(4, rayWorld(head, dirFrom(yawB, elev), want) - .6); }
      const k = 1 - Math.exp(-dt * 6);
      camElev += (elev - camElev) * k; camDist += (dist - camDist) * k;
      camera.position.copy(head).addScaledVector(dirFrom(yawB, camElev), camDist);
      camera.lookAt(head.clone().add(new V3(0, 1, 0)).addScaledVector(d, 30));
    }
    if (shake > .001) {
      camera.position.add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(shake * .4));
      shake *= Math.exp(-dt * 7);
    }
    const fov = zoom ? 28 : 70;
    if (Math.abs(camera.fov - fov) > .1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix(); }
    sun.target.position.set(base.x, 0, base.z);
  }
  sun.position.copy(sun.target.position).add(SUN_OFF);
}

// ---------------- HUD ----------------
const mm = $('minimap'), mg = mm.getContext('2d');
function drawMinimap() {
  const S = mm.width, k = S / (2 * HALF + 4), X = v => (v + HALF + 2) * k;
  mg.clearRect(0, 0, S, S);
  mg.fillStyle = 'rgba(40,60,35,.7)'; mg.fillRect(0, 0, S, S);
  mg.fillStyle = 'rgba(200,200,190,.8)';
  for (const b of solids) mg.fillRect(X(b.minX), X(b.minZ), (b.maxX - b.minX) * k, (b.maxZ - b.minZ) * k);
  mg.fillStyle = '#4cd964';
  for (const c of crates) if (c.active) mg.fillRect(X(c.pos.x) - 3, X(c.pos.z) - 3, 6, 6);
  for (const t of tanks) {
    if (!t.alive || t === player) continue;
    mg.fillStyle = hex(t.color); mg.strokeStyle = t.bot ? '#fff' : '#ffd166'; mg.lineWidth = t.bot ? 1.5 : 2.5;
    mg.beginPath(); mg.arc(X(t.pos.x), X(t.pos.z), 4, 0, 7); mg.fill(); mg.stroke();
  }
  const p = player, px = X(p.pos.x), pz = X(p.pos.z);
  mg.strokeStyle = 'rgba(255,255,255,.7)'; mg.lineWidth = 1.5;
  mg.beginPath(); mg.moveTo(px, pz); mg.lineTo(px + Math.sin(p.tYaw) * 22, pz + Math.cos(p.tYaw) * 22); mg.stroke();
  mg.save(); mg.translate(px, pz); mg.rotate(-p.yaw);
  mg.fillStyle = p.alive ? '#ffd166' : '#777';
  mg.beginPath(); mg.moveTo(0, 8); mg.lineTo(-5, -5); mg.lineTo(5, -5); mg.closePath(); mg.fill();
  mg.restore();
}
function updateHUD(dt) {
  const p = player, hp = Math.max(0, Math.round(p.hp)), f = hp / p.maxHp;
  $('hpFill').style.width = (100 * f) + '%';
  $('hpFill').style.background = f > .5 ? '#4cd964' : f > .25 ? '#ffcc00' : '#ff3b30';
  $('hpText').textContent = hp;
  const charging = p.charge >= 0;
  $('reloadFill').style.width = (100 * (charging ? 1 - p.charge / p.ws.charge : clamp(1 - p.reload / p.ws.reload, 0, 1))) + '%';
  $('reloadFill').style.background = charging ? '#b070ff' : '#ffd166';
  $('wName').textContent = `${p.ws.name} ${MK_NAMES[p.ws.mk]}`;
  $('score').textContent = `Kills ${p.kills} · Deaths ${p.deaths} · First to ${MATCH.limit}`;
  dmgA *= Math.exp(-dt * 2.5); hitA *= Math.exp(-dt * 6);
  $('dmg').style.opacity = dmgA; $('hitmark').style.opacity = hitA;
  $('scope').style.opacity = zoom && view === 'fp' ? 1 : 0;
  $('deathMsg').textContent = p.alive || state !== 'playing' ? '' : `Destroyed by ${p.killer ? p.killer.name : '?'}${isAuth() ? ` — respawning in ${Math.ceil(Math.max(0, p.respawnT))}` : ' — respawning…'}`;
  const humans = tanks.filter(t => !t.bot).length;
  $('room').classList.toggle('hidden', ROLE === 'solo');
  if (ROLE !== 'solo') $('room').textContent = `Room ${Net.code} · ${humans} player${humans === 1 ? '' : 's'}`;
  const showBoard = key('Tab') && state === 'playing';
  $('board').classList.toggle('hidden', !showBoard);
  if (showBoard) $('board').innerHTML = boardHTML();
  drawMinimap();
}
function boardHTML() {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = [...tanks].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths).map(t =>
    `<tr class="${t === player ? 'me' : ''}"><td><b style="color:${hex(t.color)}">■</b> ${esc(t.name)}${t.bot ? ' <span class="tag">BOT</span>' : ''}</td>` +
    `<td>${WEAPONS[t.weapon].name}</td><td class="n">${t.kills}</td><td class="n">${t.deaths}</td></tr>`).join('');
  return `<table><tr><th>Tank</th><th>Weapon</th><th class="n">Kills</th><th class="n">Deaths</th></tr>${rows}</table>` +
    `<div class="sub">${MAPS[MATCH.map].name} · first to ${MATCH.limit} kills</div>`;
}

// ---------------- main loop ----------------
let lastFrame = performance.now();
function step(now, render) {
  const dt = Math.min(.05, (now - lastFrame) / 1000); lastFrame = now;
  if (state === 'playing' || (state === 'over' && ROLE !== 'solo')) update(dt);
  updateParticles(dt);
  if (ROLE !== 'solo' && state !== 'menu') Net.tick(dt);
  if (!render) return;
  updateCamera(dt);
  if (player && state !== 'menu') updateHUD(dt);
  renderer.render(scene, camera);
}
function loop(now) { requestAnimationFrame(loop); step(now, true); }
requestAnimationFrame(loop);
// Browsers stop requestAnimationFrame in background or covered windows (not always flagging
// document.hidden); a worker keeps online matches simulating and networking when frames stop.
try {
  const ticker = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 50)'], { type: 'text/javascript' })));
  ticker.onmessage = () => { if (ROLE !== 'solo' && state !== 'menu' && performance.now() - lastFrame > 120) step(performance.now(), false); };
} catch (e) {}
