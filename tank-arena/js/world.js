// Map building (terrain, buildings, cover, scenery) and the collision queries everything else uses.

let MAP = MAPS.downtown, THEME = THEMES.grass, HALF = MAP.half;
const solids = []; // axis-aligned boxes: {minX,maxX,minY,maxY,minZ,maxZ}
let worldGroup = null, mapSpawns = [], mapCrateSpots = [];

function rng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function groundH(x, z) {
  const k = MAP.hills;
  let h = (Math.sin(x * .055) * Math.cos(z * .047) * 1.8 + Math.sin(x * .14 + z * .09) * .5 + Math.cos(z * .12 - x * .05) * .4) * k;
  if (k > 1.3) h += Math.sin(x * .021 + 1.3) * Math.cos(z * .025) * 2.2 * (k - 1); // big rolling dunes
  const e = Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - HALF - 8);
  h += e * e * .012 + e * .1 * (1 + Math.sin(x * .07) * Math.cos(z * .06));
  return h;
}

function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); }
  });
}

// ---------------- textures ----------------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function noise(g, w, h, n, a) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
}
function texFactory(draw, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size, size);
  return (rx, ry) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
  };
}
const concreteF = texFactory((g, w, h) => {
  g.fillStyle = '#a3a39c'; g.fillRect(0, 0, w, h); noise(g, w, h, 300, .12);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
});
const ribF = texFactory((g, w, h) => {
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 5, 0, 2, h); }
  noise(g, w, h, 150, .1);
});
function tiledMats(factory, w, d, H, unit, color = 0xffffff) {
  const m = (rx, ry) => new THREE.MeshLambertMaterial({ map: factory(Math.max(1, Math.round(rx)), Math.max(.5, ry)), color });
  const sx = m(d / unit, H / unit), sz = m(w / unit, H / unit), top = m(w / unit, d / unit);
  return [sx, sx, top, top, sz, sz];
}
function facadeTex(base, cols, rows) {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H); noise(g, W, H, 500, .08);
    const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, r * rh, W, 3);
      for (let c = 0; c < cols; c++) {
        g.fillStyle = Math.random() < .2 ? '#ffe7a0' : (Math.random() < .5 ? '#2c3e50' : '#3b5268');
        g.fillRect(c * cw + cw * .22, r * rh + rh * .3, cw * .56, rh * .45);
        g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(c * cw + cw * .22, r * rh + rh * .3, cw * .56, 2);
      }
    }
  });
}

// ---------------- blocks ----------------
function addBlock(x, z, w, d, h, matsFn) {
  const n = Math.max(4, Math.ceil(Math.max(w, d) / 4));
  let lo = 1e9, hi = -1e9;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const g = groundH(x - w / 2 + w * i / n, z - d / 2 + d * j / n); lo = Math.min(lo, g); hi = Math.max(hi, g);
  }
  const bottom = lo - 1, top = hi + h, H = top - bottom;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), matsFn(H));
  m.position.set(x, (top + bottom) / 2, z);
  m.castShadow = m.receiveShadow = true;
  worldGroup.add(m);
  solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, minY: bottom, maxY: top });
  return top;
}
const roofMat = new THREE.MeshLambertMaterial({ color: 0x585e63 });
const acMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });
function building(x, z, w, d, h, base) {
  const top = addBlock(x, z, w, d, h, H => {
    const rows = Math.max(1, Math.round(H / 3.2));
    const mx = new THREE.MeshLambertMaterial({ map: facadeTex(base, Math.max(1, Math.round(d / 3)), rows) });
    const mz = new THREE.MeshLambertMaterial({ map: facadeTex(base, Math.max(1, Math.round(w / 3)), rows) });
    return [mx, mx, roofMat.clone(), roofMat.clone(), mz, mz];
  });
  const par = new THREE.Mesh(new THREE.BoxGeometry(w + .4, .6, d + .4), roofMat.clone());
  par.position.set(x, top + .1, z); worldGroup.add(par);
  for (let i = 0; i < 2 + (w * d > 120 ? 2 : 0); i++) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.2 + Math.random(), .8 + Math.random() * .6, 1.2 + Math.random()), acMat.clone());
    ac.position.set(x + (Math.random() - .5) * w * .6, top + .9, z + (Math.random() - .5) * d * .6); ac.castShadow = true;
    worldGroup.add(ac);
  }
}
const cover = (x, z, w, d, h = 2.6) => addBlock(x, z, w, d, h, H => tiledMats(concreteF, w, d, H, 2.5));
const container = (x, z, w, d, color) => addBlock(x, z, w, d, 2.9, H => tiledMats(ribF, w, d, H, 2.6, color));
const CONTAINER_COLORS = [0xc0392b, 0x2980b9, 0x27ae60, 0xe67e22, 0x8e44ad, 0x16a085, 0xd35400, 0x2c3e50];

// ---------------- layouts ----------------
const B = (x, z, w, d, h, c) => ({ t: 'bld', x, z, w, d, h, c });
const C = (x, z, w, d, h) => ({ t: 'cover', x, z, w, d, h });
const K = (x, z, w, d, c) => ({ t: 'cont', x, z, w, d, c });

const GENERATORS = {
  outpost: () => [
    B(0, 0, 10, 8, 7), B(-28, -28, 8, 8, 5), B(28, 28, 8, 8, 5),
    C(-14, 0, 1.4, 8), C(14, 0, 1.4, 8), C(0, -14, 8, 1.4), C(0, 14, 8, 1.4),
    K(-30, 18, 2.6, 6.5), K(30, -18, 2.6, 6.5), K(18, 30, 6.5, 2.6), K(-18, -30, 6.5, 2.6),
  ],
  downtown: () => [
    B(0, 0, 12, 12, 17, '#b9a58a'),
    B(-35, -35, 14, 10, 10, '#8f9aa3'), B(35, 35, 14, 10, 10, '#a3786a'),
    B(35, -35, 10, 14, 13, '#c9b98f'), B(-35, 35, 10, 14, 13, '#8a9a86'),
    B(0, -44, 22, 6, 6, '#9a8f84'), B(0, 44, 22, 6, 6, '#8f8f9a'), B(-44, 0, 6, 22, 6, '#a39a8a'), B(44, 0, 6, 22, 6, '#8a8a7f'),
    C(-18, -16, 9, 1.4), C(18, 16, 9, 1.4), C(18, -18, 1.4, 9), C(-18, 18, 1.4, 9),
    C(0, -24, 1.4, 7), C(0, 24, 1.4, 7), C(-24, 0, 7, 1.4), C(24, 0, 7, 1.4),
    K(-55, 22, 2.6, 6.5), K(-51.6, 22, 2.6, 6.5), K(55, -22, 6.5, 2.6), K(55, -25.4, 6.5, 2.6),
    K(22, -55, 6.5, 2.6), K(-22, 55, 2.6, 6.5), K(48, 48, 2.6, 6.5), K(-48, -48, 6.5, 2.6),
  ],
  // Grid of plots, each randomly a building, an L of cover walls, a container pair, a ruin, or open ground.
  proc: R => {
    const items = [B(0, 0, 14, 14, 20)], step = 24, lim = HALF - 24;
    const sgn = () => (R() < .5 ? -1 : 1);
    for (let gx = -lim; gx <= lim + .1; gx += step) for (let gz = -lim; gz <= lim + .1; gz += step) {
      if (Math.abs(gx) < 12 && Math.abs(gz) < 12) continue;
      const x = gx + (R() - .5) * 6, z = gz + (R() - .5) * 6, roll = R();
      if (roll < .42) items.push(B(x, z, 7 + R() * 8, 7 + R() * 8, 4 + R() * 12));
      else if (roll < .62) { const s = sgn(); items.push(C(x, z, 8, 1.4), C(x + 3.3 * s, z + 3.3, 1.4, 6)); }
      else if (roll < .8) {
        if (R() < .5) items.push(K(x, z, 2.6, 6.5), K(x + 3.4, z, 2.6, 6.5));
        else items.push(K(x, z, 6.5, 2.6), K(x, z + 3.4, 6.5, 2.6));
      } else if (roll < .9) for (let i = 0; i < 3; i++) items.push(C(x + (R() - .5) * 8, z + (R() - .5) * 8, 1.2 + R() * 4, 1.2 + R() * 3, 1.5 + R() * 2.5));
    }
    return items;
  },
};

// ---------------- build ----------------
function buildGround() {
  const T = THEME, size = 2 * (HALF + 260), seg = Math.min(320, Math.round(size / 2.6));
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, cols = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, groundH(x, z));
    const n = Math.sin(x * .21) * Math.cos(z * .17) + Math.sin(x * .05 + z * .08) * .8;
    const k = Math.min(1, Math.max(0, (n - .6) / .6));
    let c = T.ground.map((g, j) => g * (1 - k) + T.dirt[j] * k);
    if (MAP.roads && (Math.abs(x) < 4 || Math.abs(z) < 4) && Math.abs(x) < HALF && Math.abs(z) < HALF) c = T.road;
    const v = (Math.random() - .5) * .05;
    cols.push(c[0] + v, c[1] + v, c[2] + v);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const grain = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); noise(g, w, h, 900, .18); });
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(size / 4, size / 4);
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: grain }));
  ground.receiveShadow = true;
  worldGroup.add(ground);

  const fogHex = '#' + T.fog.toString(16).padStart(6, '0');
  const skyTex = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, T.skyTop); gr.addColorStop(.42, '#a8cbe6'); gr.addColorStop(.5, fogHex); gr.addColorStop(1, fogHex);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  worldGroup.add(new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })));
}

function buildScenery(R) {
  const T = THEME, reach = HALF + 110, count = Math.round(140 * (HALF + 100) / 170);
  const rockG = new THREE.DodecahedronGeometry(1.5, 0), rockM = new THREE.MeshLambertMaterial({ color: T.rock });
  const trunkG = new THREE.CylinderGeometry(.3, .4, 2.5, 6), trunkM = new THREE.MeshLambertMaterial({ color: 0x5a3e28 });
  const coneG = new THREE.ConeGeometry(2.2, 5, 7), capG = new THREE.ConeGeometry(1.3, 2.4, 7);
  const leafMs = [0x2f5d2a, 0x3b6b2f, 0x2a5233].map(c => new THREE.MeshLambertMaterial({ color: c }));
  const snowM = new THREE.MeshLambertMaterial({ color: 0xf4f8fb });
  const cactG = new THREE.CylinderGeometry(.45, .5, 4, 8), armG = new THREE.CylinderGeometry(.3, .3, 1.6, 8), cactM = new THREE.MeshLambertMaterial({ color: 0x5f8a3a });
  const put = (geo, mat, x, y, z, s, shadow) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.setScalar(s); m.castShadow = !!shadow; worldGroup.add(m); return m; };
  for (let i = 0; i < count; i++) {
    const x = (R() * 2 - 1) * reach, z = (R() * 2 - 1) * reach;
    if (Math.max(Math.abs(x), Math.abs(z)) < HALF + 9) continue;
    const y = groundH(x, z), s = .8 + R(), roll = R();
    if (roll < .25 || (T.deco === 'cactus' && roll < .55)) {
      const r = put(rockG, rockM, x, y + .4, z, s); r.scale.set(s * 1.4, s, s * 1.2); r.rotation.y = R() * 6;
    } else if (T.deco === 'cactus') {
      put(cactG, cactM, x, y + 2 * s, z, s, true);
      const a = put(armG, cactM, x + .7 * s, y + 2.6 * s, z, s, true); a.rotation.z = -.5;
      if (R() < .6) { const b = put(armG, cactM, x - .7 * s, y + 2.1 * s, z, s, true); b.rotation.z = .5; }
    } else {
      put(trunkG, trunkM, x, y + 1.2 * s, z, s);
      put(coneG, leafMs[i % 3], x, y + 4.5 * s, z, s, true);
      if (T.deco === 'snowpine') put(capG, snowM, x, y + 6.3 * s, z, s);
    }
  }
}

function buildWorld(mapId) {
  if (worldGroup) { scene.remove(worldGroup); disposeTree(worldGroup); }
  worldGroup = new THREE.Group(); scene.add(worldGroup);
  MAP = MAPS[mapId] || MAPS.downtown; THEME = THEMES[MAP.theme]; HALF = MAP.half; solids.length = 0;
  scene.background.setHex(THEME.fog); scene.fog.color.setHex(THEME.fog);

  buildGround();
  for (const [x, z, w, d] of [[0, HALF + 1, 2 * HALF + 4, 2], [0, -HALF - 1, 2 * HALF + 4, 2], [HALF + 1, 0, 2, 2 * HALF], [-HALF - 1, 0, 2, 2 * HALF]])
    addBlock(x, z, w, d, 5, H => tiledMats(concreteF, w, d, H, 4, THEME.wall));

  const R = rng(MAP.seed || 1);
  GENERATORS[MAP.gen](R).forEach((it, i) => {
    if (it.t === 'bld') building(it.x, it.z, it.w, it.d, it.h, it.c || THEME.facades[Math.floor(R() * THEME.facades.length)]);
    else if (it.t === 'cover') cover(it.x, it.z, it.w, it.d, it.h);
    else container(it.x, it.z, it.w, it.d, it.c || CONTAINER_COLORS[i % CONTAINER_COLORS.length]);
  });
  buildScenery(rng((MAP.seed || 1) + 99));

  mapSpawns = [];
  const r = HALF - 9;
  for (let side = 0; side < 4; side++) for (let i = 0; i < 5; i++) {
    const f = -r + 2 * r * (i + .5) / 5;
    const [x, z] = [[f, -r], [r, f], [-f, r], [-r, -f]][side];
    if (!blockedAt(x, z, 4.5)) mapSpawns.push([x, z]);
  }
  mapCrateSpots = [];
  const n = HALF > 90 ? 6 : 4;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + .4;
    for (let rr = .42; rr < .85; rr += .06) {
      const x = Math.cos(a) * HALF * rr, z = Math.sin(a) * HALF * rr;
      if (!blockedAt(x, z, 3)) { mapCrateSpots.push([x, z]); break; }
    }
  }
}

// ---------------- collision queries ----------------
function blockedAt(x, z, m) {
  if (Math.abs(x) > HALF - m || Math.abs(z) > HALF - m) return true;
  for (const b of solids) if (x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m) return true;
  return false;
}
function resolveSolids(p, r) {
  let hit = false;
  const lim = HALF - r;
  if (Math.abs(p.x) > lim) { p.x = Math.sign(p.x) * lim; hit = true; }
  if (Math.abs(p.z) > lim) { p.z = Math.sign(p.z) * lim; hit = true; }
  for (const b of solids) {
    const cx = Math.max(b.minX, Math.min(b.maxX, p.x)), cz = Math.max(b.minZ, Math.min(b.maxZ, p.z));
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    hit = true;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
    else {
      const o = [[p.x - b.minX + r, -1, 0], [b.maxX - p.x + r, 1, 0], [p.z - b.minZ + r, 0, -1], [b.maxZ - p.z + r, 0, 1]].sort((a, c) => a[0] - c[0])[0];
      p.x += o[1] * o[0]; p.z += o[2] * o[0];
    }
  }
  return hit;
}
function rayBox(o, d, b) {
  let tmin = 0, tmax = Infinity;
  const ax = [[o.x, d.x, b.minX, b.maxX], [o.y, d.y, b.minY, b.maxY], [o.z, d.z, b.minZ, b.maxZ]];
  for (const [oa, da, mn, mx] of ax) {
    if (Math.abs(da) < 1e-9) { if (oa < mn || oa > mx) return Infinity; }
    else {
      let t1 = (mn - oa) / da, t2 = (mx - oa) / da;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return Infinity;
    }
  }
  return tmin;
}
function raySphere(o, d, c, r) {
  const mx = o.x - c.x, my = o.y - c.y, mz = o.z - c.z;
  const b = mx * d.x + my * d.y + mz * d.z, cc = mx * mx + my * my + mz * mz - r * r;
  if (cc > 0 && b > 0) return Infinity;
  const disc = b * b - cc;
  if (disc < 0) return Infinity;
  return Math.max(0, -b - Math.sqrt(disc));
}
// Distance along a ray to the first building/wall or the ground (tanks excluded).
function rayWorld(o, d, max) {
  let best = max;
  for (const b of solids) { const t = rayBox(o, d, b); if (t < best) best = t; }
  for (let s = 1; s < best; s += 1.5) if (o.y + d.y * s < groundH(o.x + d.x * s, o.z + d.z * s)) { best = s; break; }
  return best;
}
