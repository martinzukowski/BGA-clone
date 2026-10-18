// The animated pixel ocean behind Deep Cut. Everything is drawn on a small canvas
// (one "art pixel" = PX screen pixels) and scaled up with image-rendering: pixelated.
// The camera follows a diver: Scene.sinkTo(metres) eases the camera down, the sea
// darkens through the ocean zones, and the wildlife changes with depth.
const Scene = (() => {
  const PX = 4;                 // screen pixels per art pixel
  const M2PX = 0.4;             // art pixels per metre of depth
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let depth = 0, target = 0, last = performance.now(), t = 0;
  let showDiver = false, frameHook = null;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Palette & sprites ----------
  const PAL = {
    y: '#ffd23f', Y: '#e0a91a', c: '#5ce1ff', w: '#ffffff', o: '#ff7a3d', O: '#d9531e', t: '#9aa6bd', p: '#ff4fa3',
    k: '#1b2233', r: '#e5484d', R: '#a8262c', b: '#ffffff', g: '#c8d3e6', f: '#ffd23f', m: '#6b4a2b',
  };
  // Side-on diver swimming right: pink fins, orange suit, grey tank, yellow helmet, cyan visor.
  const DIVER = [
    '...........YYY..',
    '..ttt.....YyyyY.',
    '.tttt....YyccwyY',
    'pp.OooooooYyccyY',
    'ppOoooooooooYyY.',
    'pp.Oo.oo..o..oo.',
    '...........o..o.',
  ];
  const BOAT = [
    '.........f..........',
    '.........ff.........',
    '.........fff........',
    '.........m..........',
    '......gggmggg.......',
    '......gkkgkkg.......',
    '...wwwwwwwwwwwwwww..',
    'rrrrrrrrrrrrrrrrrrrr',
    '.RrrrrrrrrrrrrrrrrR.',
    '..RRRRRRRRRRRRRRRR..',
  ];
  const FISH = [
    'a...aaa..',
    'aa.aaaaa.',
    'aaaaaaaWa',
    'aa.aaaaaa',
    'a...aaa..',
  ];
  const JELLY = [
    '..aaaaa..',
    '.aaaaaaa.',
    'aaWaaaWaa',
    'aaaaaaaaa',
    '.a.a.a.a.',
    '.a..a..a.',
    'a..a..a..',
    '.a..a..a.',
  ];
  const ANGLER = [
    '......L....',
    '.....l.....',
    '....l......',
    '..dddddd...',
    '.dddddddd.d',
    'dWddddddddd',
    'dttdddddd.d',
    '.ddddddd...',
  ];
  const FISH_COLOURS = ['#ff4fa3', '#ffd23f', '#5cff9d', '#ff7a3d', '#4fe3ff', '#c77dff'];
  const GLOW_COLOURS = ['#4fe3ff', '#ff4fa3', '#c77dff', '#5cff9d'];

  function sprite(rows, x, y, pal, flip = false) {
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) for (let i = 0; i < w; i++) {
      const ch = rows[r][flip ? w - 1 - i : i];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = pal[ch] || PAL[ch] || ch;
      ctx.fillRect(Math.round(x + i), Math.round(y + r), 1, 1);
    }
  }

  // ---------- Water colour by depth ----------
  const STOPS = [[0, [46, 150, 205]], [120, [24, 98, 168]], [300, [14, 60, 122]], [1000, [9, 32, 80]],
    [3000, [6, 18, 50]], [6000, [3, 9, 28]], [11000, [1, 3, 10]]];
  function waterAt(m) {
    if (m <= 0) return STOPS[0][1];
    for (let i = 1; i < STOPS.length; i++) {
      if (m <= STOPS[i][0]) {
        const [m0, a] = STOPS[i - 1], [m1, b] = STOPS[i];
        const k = (m - m0) / (m1 - m0);
        return a.map((v, j) => Math.round(v + (b[j] - v) * k));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ---------- Things in the water ----------
  // Positions are in art pixels on screen; when the camera sinks, everything shifts up.
  let bubbles = [], snow = [], critters = [], clouds = [];
  function critterFor(m, y) {
    const r = Math.random();
    if (m < 700 && r < 0.85) return { kind: 'fish', x: Math.random() * W, y, dir: Math.random() < .5 ? -1 : 1, v: 6 + Math.random() * 10, col: FISH_COLOURS[Math.floor(Math.random() * FISH_COLOURS.length)], ph: Math.random() * 6 };
    if (m < 5000 && m > 500 && r < 0.75) return { kind: 'jelly', x: Math.random() * W, y, col: GLOW_COLOURS[Math.floor(Math.random() * GLOW_COLOURS.length)], ph: Math.random() * 6 };
    if (m > 2500) return { kind: 'angler', x: Math.random() * W, y, dir: Math.random() < .5 ? -1 : 1, v: 3 + Math.random() * 4, ph: Math.random() * 6 };
    return { kind: 'spark', x: Math.random() * W, y, col: GLOW_COLOURS[Math.floor(Math.random() * GLOW_COLOURS.length)], ph: Math.random() * 6 };
  }
  function resize() {
    W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX);
    canvas.width = W; canvas.height = H;
    bubbles = Array.from({ length: Math.round(W * H / 900) }, () => newBubble(Math.random() * H));
    snow = Array.from({ length: Math.round(W * H / 500) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 1 + Math.random() * 2 }));
    critters = Array.from({ length: Math.max(5, Math.round(W / 22)) }, () => critterFor(depth + 200, Math.random() * H));
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: (i / 5) * W + Math.random() * 30, y: 6 + Math.random() * 26, w: 14 + Math.random() * 22, v: 1 + Math.random() * 2 }));
  }
  const newBubble = y => ({ x: Math.random() * W, y, v: 6 + Math.random() * 14, s: Math.random() < .25 ? 2 : 1, ph: Math.random() * 6 });

  // ---------- Frame ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    const prev = depth;
    depth += (target - depth) * Math.min(1, dt * (reduceMotion ? 20 : 1.9));
    if (Math.abs(target - depth) < 0.05) depth = target;
    const shift = (depth - prev) * M2PX;    // how far the world moved up this frame
    const surfaceY = Math.round(H * 0.56 - depth * M2PX);

    // Water, in 2-pixel bands for a stepped retro gradient.
    for (let y = Math.max(0, surfaceY); y < H; y += 2) {
      const m = depth + (y - H * 0.56) / M2PX;
      ctx.fillStyle = rgb(waterAt(Math.max(0, m)));
      ctx.fillRect(0, y, W, 2);
    }

    // Sky, sun, clouds, waves and the boat while the surface is on screen.
    if (surfaceY > 0) {
      const sky = ctx.createLinearGradient(0, 0, 0, surfaceY);
      sky.addColorStop(0, '#1c1446'); sky.addColorStop(0.45, '#6a2c84'); sky.addColorStop(0.8, '#ff6f91'); sky.addColorStop(1, '#ffb36b');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, surfaceY);
      const sx = Math.round(W * 0.78), sy = surfaceY - 12, sr = 9;
      for (let dy = -sr; dy <= sr; dy++) {
        const half = Math.floor(Math.sqrt(sr * sr - dy * dy));
        ctx.fillStyle = dy % 3 === 0 && dy > 0 ? '#ff8f5c' : '#ffd23f';
        if (sy + dy < surfaceY) ctx.fillRect(sx - half, sy + dy, half * 2, 1);
      }
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (const c of clouds) {
        c.x += c.v * dt; if (c.x > W + 30) c.x = -40;
        const cy = c.y - (H * 0.56 - surfaceY);
        if (cy < surfaceY - 6) { ctx.fillRect(Math.round(c.x), Math.round(cy), Math.round(c.w), 2); ctx.fillRect(Math.round(c.x + 4), Math.round(cy - 2), Math.round(c.w * 0.5), 2); }
      }
      ctx.fillStyle = 'rgba(255,214,140,.35)';   // sun's reflection
      for (let k = 0; k < 5; k++) ctx.fillRect(sx - 6 + ((k * 7 + Math.floor(t * 3)) % 5), surfaceY + 2 + k * 2, 12 - k * 2, 1);
      for (let x = 0; x < W; x++) {               // waves
        const wy = surfaceY + Math.round(Math.sin(x / 6 + t * 2) * 1.2);
        ctx.fillStyle = '#bdf4ff'; ctx.fillRect(x, wy, 1, 1);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; if ((x + Math.floor(t * 8)) % 9 === 0) ctx.fillRect(x, wy - 1, 2, 1);
      }
      const bx = Math.round(W * 0.5 - 10 + Math.sin(t * 0.4) * 6), by = surfaceY - 9 + Math.round(Math.sin(t * 1.6) * 0.8);
      sprite(BOAT, bx, by, {});
      ctx.fillStyle = 'rgba(10,20,40,.35)';       // the boat's line going down
      for (let y = surfaceY + 2; y < Math.min(H, surfaceY + 40); y += 2) ctx.fillRect(bx + 15, y, 1, 1);
    }

    // Sun rays fade out by 400 m.
    const rayA = Math.max(0, 1 - depth / 400) * 0.11;
    if (rayA > 0.005) {
      ctx.fillStyle = `rgba(190,240,255,${rayA})`;
      for (let k = 0; k < 6; k++) {
        const x0 = ((k * W) / 5 + Math.sin(t * 0.3 + k) * 8) | 0;
        for (let y = Math.max(0, surfaceY); y < H; y += 1) ctx.fillRect(x0 + Math.round((y - surfaceY) * 0.35), y, 3 + k % 3, 1);
      }
    }

    // Marine snow drifts down.
    ctx.fillStyle = depth > 800 ? 'rgba(170,220,255,.5)' : 'rgba(220,245,255,.35)';
    for (const s of snow) {
      s.y += s.v * dt - shift; s.x += Math.sin(t + s.y) * 0.05;
      if (s.y > H) s.y -= H; if (s.y < 0) s.y += H;
      if (s.y > surfaceY) ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }

    // Critters.
    for (const c of critters) {
      c.y -= shift;
      // Respawn off the far edge at a random distance, so fast sinking doesn't line them up.
      if (c.y < -20) Object.assign(c, critterFor(depth + H / M2PX, H + 10 + Math.random() * H * 0.9));
      else if (c.y > H * 2) Object.assign(c, critterFor(depth, -10 - Math.random() * H * 0.5));
      if (c.y < surfaceY + 6) continue;
      if (c.kind === 'fish') {
        c.x += c.dir * c.v * dt; if (c.x > W + 12) c.x = -12; if (c.x < -12) c.x = W + 12;
        sprite(FISH, c.x, c.y + Math.sin(t * 2 + c.ph) * 1.5, { a: c.col, W: '#10162a' }, c.dir < 0);
      } else if (c.kind === 'jelly') {
        const pulse = (Math.sin(t * 2 + c.ph) + 1) / 2;
        c.y -= (0.6 + pulse * 1.5) * dt * 4;
        glow(c.x + 4, c.y + 3, 9 + pulse * 3, c.col, 0.18 + pulse * 0.1);
        sprite(JELLY, c.x, c.y, { a: c.col, W: '#ffffff' });
      } else if (c.kind === 'angler') {
        c.x += c.dir * c.v * dt; if (c.x > W + 14) c.x = -14; if (c.x < -14) c.x = W + 14;
        const lx = c.dir > 0 ? c.x + 6 : c.x + 4;
        glow(lx, c.y, 7 + Math.sin(t * 3 + c.ph) * 2, '#fff2a8', 0.35);
        sprite(ANGLER, c.x, c.y, { d: '#1b2a3f', W: '#c8f7ff', t: '#e9edf5', l: '#5b6b80', L: '#fff2a8' }, c.dir < 0);
      } else {
        const a = (Math.sin(t * 1.5 + c.ph) + 1) / 2;
        c.y -= dt * 2;
        glow(c.x, c.y, 3, c.col, 0.25 * a);
        ctx.fillStyle = c.col; if (a > .4) ctx.fillRect(Math.round(c.x), Math.round(c.y), 1, 1);
      }
    }

    // Bubbles rise; when sinking fast they streak past.
    const speed = Math.abs(shift) / Math.max(dt, 1e-3);
    for (const b of bubbles) {
      b.y -= b.v * dt + shift; b.x += Math.sin(t * 3 + b.ph) * 0.06;
      if (b.y < Math.max(surfaceY, 0) - 2) {
        if (b.temp) { b.dead = true; continue; }
        Object.assign(b, newBubble(H + Math.random() * 10));
      }
      if (b.y > H + 12) b.y -= H;
      if (b.y < surfaceY) continue;
      const streak = Math.min(4, speed / 40) | 0;
      ctx.fillStyle = streak ? 'rgba(200,245,255,.45)' : 'rgba(200,245,255,.7)';
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s + streak);
    }

    // The diver, bobbing, with a trail of bubbles.
    if (showDiver) {
      const dx = Math.round(W * 0.5 - 8), dy = Math.round(H * 0.77 + Math.sin(t * 1.8) * 1.5);
      sprite(DIVER, dx, dy, {});
      if (Math.random() < dt * (3 + speed / 15)) bubbles.push({ x: dx + 14, y: dy - 1, v: 12 + Math.random() * 10, s: 1, ph: 0, temp: true });
    }
    if (bubbles.some(b => b.dead)) bubbles = bubbles.filter(b => !b.dead);

    // Dim vignette at the edges.
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,10,${0.25 + Math.min(0.35, depth / 20000)})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    if (frameHook) frameHook(depth);
    requestAnimationFrame(frame);
  }
  function glow(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  return {
    sinkTo(m, instant = false) { target = Math.max(0, m); if (instant) depth = target; },
    get depth() { return depth; },
    set diver(v) { showDiver = v; },
    onFrame(fn) { frameHook = fn; },
    burst(n = 24) {   // a cloud of bubbles from the diver
      const dx = W * 0.5, dy = H * 0.77;
      for (let i = 0; i < n; i++) bubbles.push({ x: dx - 6 + Math.random() * 16, y: dy + Math.random() * 6, v: 14 + Math.random() * 24, s: Math.random() < .4 ? 2 : 1, ph: Math.random() * 6, temp: true });
    },
  };
})();
