import { ArenaId, DomainTheme, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from './types';

const arenaLayerCache = new Map<ArenaId, HTMLCanvasElement>();

function ditherRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c1: string,
  c2: string
): void {
  ctx.fillStyle = c1;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c2;
  for (let py = y; py < y + h; py += 2) {
    for (let px = x + (py % 4 === 0 ? 0 : 1); px < x + w; px += 2) {
      ctx.fillRect(px, py, 1, 1);
    }
  }
}

function drawTorii(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  dark: string
): void {
  const w = Math.round(44 * scale);
  const h = Math.round(52 * scale);
  ctx.fillStyle = dark;
  ctx.fillRect(x - Math.floor(w * 0.34), y - h, Math.max(2, Math.round(4 * scale)), h);
  ctx.fillRect(x + Math.floor(w * 0.24), y - h, Math.max(2, Math.round(4 * scale)), h);
  ctx.fillStyle = color;
  ctx.fillRect(x - Math.floor(w * 0.52), y - h - 4, w + 4, Math.max(3, Math.round(5 * scale)));
  ctx.fillRect(x - Math.floor(w * 0.44), y - h + 6, Math.round(w * 0.88), Math.max(2, Math.round(3 * scale)));
}

function bakeArena(arenaId: ArenaId): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (arenaId === 'jujutsu_high') {
    // Dusk violet-amber sky
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#13162b');
    grad.addColorStop(0.55, '#3b2848');
    grad.addColorStop(1, '#7a404c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    // Distant twilight sun / moon halo + pixel clouds
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(348, 42, 28, 28);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(352, 46, 20, 20);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.fillRect(342, 36, 40, 40);

    ctx.fillStyle = '#2d2142';
    ctx.fillRect(46, 48, 68, 8);
    ctx.fillRect(62, 42, 36, 6);
    ctx.fillRect(212, 32, 74, 7);
    ctx.fillRect(228, 27, 42, 5);

    // Distant mountain ridge
    ctx.fillStyle = '#221a35';
    for (let x = 0; x < WORLD_WIDTH; x += 4) {
      const mh = 18 + Math.round(Math.sin(x * 0.025) * 14 + Math.cos(x * 0.06) * 6);
      ctx.fillRect(x, GROUND_Y - 58 - mh, 4, mh + 60);
    }

    // Pine / Cherry tree silhouettes flanking courtyard
    for (const tx of [12, 186, 274, 450]) {
      ctx.fillStyle = '#181326';
      ctx.fillRect(tx, GROUND_Y - 62, 6, 62);
      ctx.fillStyle = '#251a36';
      ctx.fillRect(tx - 12, GROUND_Y - 82, 30, 24);
      ctx.fillRect(tx - 8, GROUND_Y - 94, 22, 14);
    }

    // Traditional Jujutsu High temple buildings & tiled curved eaves
    ctx.fillStyle = '#161224';
    ctx.fillRect(42, 134, 128, 98);
    ctx.fillRect(310, 140, 126, 92);
    // Wooden structural pillars & roof beams
    ctx.fillStyle = '#2e1d26';
    for (const px of [44, 84, 124, 162, 314, 354, 394, 428]) {
      ctx.fillRect(px, 134, 4, 98);
    }
    // Tiered sloped Japanese tile roofs
    for (let step = 0; step < 5; step++) {
      ctx.fillStyle = step % 2 === 0 ? '#0d0b18' : '#1b172e';
      ctx.fillRect(24 + step * 8, 128 - step * 5, 164 - step * 16, 6);
      ctx.fillRect(296 + step * 8, 134 - step * 5, 154 - step * 16, 6);
    }
    // Roof ridge ornaments
    ctx.fillStyle = '#b45309';
    ctx.fillRect(62, 102, 88, 3);
    ctx.fillRect(332, 108, 82, 3);

    // Warm paper shoji lit windows
    ctx.fillStyle = '#fbbf24';
    for (let wx = 54; wx < 154; wx += 22) {
      ctx.fillRect(wx, 152, 12, 22);
      ctx.fillStyle = '#141122';
      ctx.fillRect(wx + 5, 152, 2, 22);
      ctx.fillRect(wx, 162, 12, 2);
      ctx.fillStyle = '#fbbf24';
    }
    for (let wx = 324; wx < 420; wx += 22) {
      ctx.fillRect(wx, 158, 12, 20);
      ctx.fillStyle = '#141122';
      ctx.fillRect(wx + 5, 158, 2, 20);
      ctx.fillRect(wx, 167, 12, 2);
      ctx.fillStyle = '#fbbf24';
    }

    // Center-back Torii gate
    drawTorii(ctx, 240, GROUND_Y - 12, 1.35, '#991b1b', '#450a0a');

    // Stone courtyard floor with perspective grid
    ctx.fillStyle = '#2c2738';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#403952';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 3);
    for (let y = GROUND_Y + 6; y < WORLD_HEIGHT; y += 8) {
      ctx.fillStyle = '#211c2b';
      ctx.fillRect(0, y, WORLD_WIDTH, 1);
    }
    for (let x = -40; x < WORLD_WIDTH + 60; x += 36) {
      ctx.fillStyle = '#211c2b';
      ctx.fillRect(x, GROUND_Y + 3, 2, WORLD_HEIGHT - GROUND_Y);
    }
    // Stone lanterns
    for (const lx of [178, 302]) {
      ctx.fillStyle = '#3f3b4d';
      ctx.fillRect(lx - 4, GROUND_Y - 28, 8, 28);
      ctx.fillRect(lx - 7, GROUND_Y - 30, 14, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(lx - 2, GROUND_Y - 24, 4, 6);
    }
  } else if (arenaId === 'abandoned_school') {
    // Eerie blue-violet moonlit corridor ruins
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(1, '#182133');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    // Cracked plaster wall panels
    ditherRect(ctx, 0, 120, WORLD_WIDTH, GROUND_Y - 120, '#181e2c', '#131724');
    ctx.fillStyle = '#0d111b';
    ctx.fillRect(0, 118, WORLD_WIDTH, 4);

    // Tall broken classroom windows showing moonlight
    for (const wx of [44, 146, 268, 370]) {
      ctx.fillStyle = '#2a3754';
      ctx.fillRect(wx, 42, 64, 92);
      ctx.fillStyle = '#0f1626';
      ctx.fillRect(wx + 4, 46, 56, 84);
      // Moonlight diagonal shafts
      ctx.fillStyle = 'rgba(147, 197, 253, 0.08)';
      ctx.fillRect(wx + 8, 48, 22, 180);
      // Window bars
      ctx.fillStyle = '#1a2234';
      ctx.fillRect(wx + 31, 46, 2, 84);
      ctx.fillRect(wx + 4, 86, 56, 2);
    }

    // Moon visible through middle-left window
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(162, 56, 16, 16);

    // Cursed talisman seals & cracks on pillars
    for (const px of [120, 240, 352]) {
      ctx.fillStyle = '#111622';
      ctx.fillRect(px - 8, 32, 16, GROUND_Y - 32);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(px - 2, 145, 4, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px - 1, 147, 2, 10);
    }

    // Ruined overturned school desks & floor tiles
    ctx.fillStyle = '#1c2331';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#2d374c';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    for (let x = 0; x < WORLD_WIDTH; x += 24) {
      ctx.fillStyle = '#121722';
      ctx.fillRect(x, GROUND_Y + 2, 1, WORLD_HEIGHT - GROUND_Y);
    }
    ctx.fillStyle = '#3b2d26';
    ctx.fillRect(36, GROUND_Y - 14, 24, 14);
    ctx.fillRect(412, GROUND_Y - 12, 28, 12);
  } else if (arenaId === 'cursed_forest') {
    // Deep emerald & indigo mystical forest
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#06110e');
    grad.addColorStop(0.65, '#0e241d');
    grad.addColorStop(1, '#1a3a2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    // Foggy light shafts
    ctx.fillStyle = 'rgba(74, 222, 128, 0.06)';
    for (const sx of [68, 198, 328]) {
      ctx.fillRect(sx, 0, 32, GROUND_Y);
    }

    // Distant silhouette trees
    ctx.fillStyle = '#091813';
    for (let tx = 14; tx < WORLD_WIDTH; tx += 38) {
      ctx.fillRect(tx, 20, 14, GROUND_Y - 20);
      ctx.fillRect(tx - 10, 12, 34, 42);
    }

    // Thick gnarled foreground-midground trunks
    for (const tx of [22, 134, 290, 424]) {
      ctx.fillStyle = '#1b1615';
      ctx.fillRect(tx, 0, 26, GROUND_Y);
      ctx.fillStyle = '#2c2422';
      ctx.fillRect(tx + 4, 0, 8, GROUND_Y);
      // Glowing moss patches
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(tx + 2, GROUND_Y - 38, 6, 12);
      ctx.fillRect(tx + 16, GROUND_Y - 64, 4, 10);
    }

    // Canopy leaves
    ctx.fillStyle = '#0d261c';
    ctx.fillRect(0, 0, WORLD_WIDTH, 34);
    ctx.fillStyle = '#153d2c';
    for (let lx = 0; lx < WORLD_WIDTH; lx += 16) {
      ctx.fillRect(lx, 24 + (lx % 12), 18, 14);
    }

    // Mossy forest floor
    ditherRect(ctx, 0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y, '#172e22', '#102118');
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
  } else if (arenaId === 'shibuya') {
    // October 31 Midnight Shibuya Crossing
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#05060f');
    grad.addColorStop(0.7, '#14172b');
    grad.addColorStop(1, '#231934');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    // Skyscraper skyline
    const buildings = [
      { x: 0, w: 68, h: 175, c: '#0d101f' },
      { x: 64, w: 72, h: 198, c: '#111528' },
      { x: 140, w: 84, h: 156, c: '#0b0e1a' },
      { x: 230, w: 66, h: 205, c: '#13172b' },
      { x: 300, w: 88, h: 170, c: '#0d101f' },
      { x: 392, w: 88, h: 190, c: '#111528' },
    ];
    for (const b of buildings) {
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
      // Lit office windows
      for (let wy = GROUND_Y - b.h + 12; wy < GROUND_Y - 40; wy += 12) {
        for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 10) {
          if ((wx + wy) % 3 !== 0) {
            ctx.fillStyle = (wx * wy) % 5 === 0 ? '#38bdf8' : '#fef08a';
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }

    // Shibuya 109 / Crossing Neon Billboards
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(74, 86, 52, 26);
    ctx.fillStyle = '#090912';
    ctx.fillRect(77, 89, 46, 20);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(82, 94, 36, 4);
    ctx.fillRect(86, 102, 28, 3);

    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(314, 98, 60, 24);
    ctx.fillStyle = '#090912';
    ctx.fillRect(317, 101, 54, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(322, 106, 44, 4);

    // Ruined concrete highway debris & streetlights
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(0, GROUND_Y - 14, WORLD_WIDTH, 14);
    ctx.fillStyle = '#0f1320';
    ctx.fillRect(190, GROUND_Y - 26, 36, 26);
    ctx.fillRect(256, GROUND_Y - 20, 28, 20);

    // Wet asphalt crossing with white zebra stripes
    ctx.fillStyle = '#141722';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    for (let sx = 24; sx < WORLD_WIDTH; sx += 56) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx, GROUND_Y + 8, 26, 14);
    }
  } else {
    // MALEVOLENT SHRINE: Crimson & Obsidian Boss Arena
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#090204');
    grad.addColorStop(0.55, '#2b050a');
    grad.addColorStop(1, '#580a13');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    // Blood moon behind shrine
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(196, 18, 88, 88);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(204, 26, 72, 72);

    // Massive Malevolent Shrine structure in center-back
    ctx.fillStyle = '#120608';
    // Base altar & stairs
    ctx.fillRect(156, GROUND_Y - 38, 168, 38);
    ctx.fillRect(174, GROUND_Y - 52, 132, 14);
    // Shrine pillars
    ctx.fillRect(184, GROUND_Y - 122, 14, 70);
    ctx.fillRect(282, GROUND_Y - 122, 14, 70);
    // Ornate curved pagoda roofs
    ctx.fillStyle = '#1c080c';
    ctx.fillRect(142, GROUND_Y - 134, 196, 14);
    ctx.fillRect(160, GROUND_Y - 150, 160, 16);
    ctx.fillRect(186, GROUND_Y - 166, 108, 16);
    ctx.fillRect(228, GROUND_Y - 184, 24, 18);
    // Horned skull ornaments
    ctx.fillStyle = '#d6cfc7';
    ctx.fillRect(232, GROUND_Y - 142, 16, 14);
    ctx.fillStyle = '#090204';
    ctx.fillRect(235, GROUND_Y - 137, 3, 3);
    ctx.fillRect(242, GROUND_Y - 137, 3, 3);
    // Glowing inner shrine maw
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(216, GROUND_Y - 112, 48, 60);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(226, GROUND_Y - 98, 28, 46);

    // Bone pillars flanking stage
    for (const bx of [44, 420]) {
      ctx.fillStyle = '#1a0a0d';
      ctx.fillRect(bx, GROUND_Y - 110, 18, 110);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bx + 3, GROUND_Y - 102, 12, 10);
    }

    // Shallow crimson reflective water floor
    ditherRect(ctx, 0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y, '#26060b', '#170307');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
  }

  return canvas;
}

export function getArenaBackdrop(arenaId: ArenaId): HTMLCanvasElement {
  let cached = arenaLayerCache.get(arenaId);
  if (cached) return cached;
  cached = bakeArena(arenaId);
  arenaLayerCache.set(arenaId, cached);
  return cached;
}

export function drawArenaAtmosphere(
  ctx: CanvasRenderingContext2D,
  arenaId: ArenaId,
  timeSec: number,
  domainActive: DomainTheme
): void {
  if (domainActive === 'unlimited_void') {
    // Gojo: Cosmic Infinite Void Domain Override
    ctx.fillStyle = '#040512';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

    ctx.save();
    for (let i = 0; i < 6; i++) {
      const r = ((timeSec * 55 + i * 42) % 240) + 12;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.42)' : 'rgba(248, 250, 252, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(240, 118, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let s = 0; s < 52; s++) {
      const sx = (s * 73 + Math.floor(timeSec * (12 + (s % 5) * 4))) % WORLD_WIDTH;
      const sy = (s * 41) % (GROUND_Y - 8);
      ctx.fillStyle = s % 3 === 0 ? '#7dd3fc' : '#ffffff';
      ctx.fillRect(sx, sy, s % 4 === 0 ? 2 : 1, s % 4 === 0 ? 2 : 1);
    }
    ctx.restore();

    ctx.fillStyle = '#090d24';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'mutual_love') {
    // Yuta: Authentic Mutual Love — sunset sky, giant Rika knots & field of planted katanas
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#1e0b2e');
    g.addColorStop(0.6, '#581c59');
    g.addColorStop(1, '#9d174d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    // Giant spirit knots / halo rings
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(240, 96, 56 + Math.sin(timeSec * 4) * 4, 0, Math.PI * 2);
    ctx.stroke();
    // Planted cursed katanas across horizon
    for (let kx = 20; kx < WORLD_WIDTH; kx += 28) {
      const h = 24 + ((kx * 7) % 22);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(kx, GROUND_Y - h, 2, h);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(kx - 3, GROUND_Y - h + 6, 8, 2);
    }
    ctx.fillStyle = '#2a0920';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'chimera_shadow') {
    // Megumi / Toji: Chimera Shadow Garden — liquid shadow ocean & bone arches
    ctx.fillStyle = '#06070f';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.fillStyle = '#18182b';
    for (let i = 0; i < 12; i++) {
      const sx = (i * 44 + Math.sin(timeSec * 2 + i) * 6);
      ctx.fillRect(Math.round(sx), GROUND_Y - 70 - (i % 3) * 28, 12, 70 + (i % 3) * 28);
    }
    // Floating shadow orbs
    for (let s = 0; s < 24; s++) {
      const sx = (s * 43 + Math.floor(timeSec * 18)) % WORLD_WIDTH;
      const sy = GROUND_Y - ((s * 29 + Math.floor(timeSec * 26)) % 180);
      ctx.fillStyle = s % 2 === 0 ? '#6366f1' : '#818cf8';
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'beast_sanctuary') {
    // Panda / Hanami: Primal Sanctuary of Glowing Spirit Pillars
    ctx.fillStyle = '#121808';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    for (let px = 32; px < WORLD_WIDTH; px += 64) {
      ctx.fillStyle = '#272b12';
      ctx.fillRect(px, 24, 18, GROUND_Y - 24);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.fillRect(px + 6, 32, 6, GROUND_Y - 36);
    }
    ctx.fillStyle = '#1e240c';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'iron_mountain') {
    // Jogo: Coffin of the Iron Mountain — molten volcanic cavern
    ctx.fillStyle = '#1c0904';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.fillStyle = '#7c2d12';
    for (let mx = 0; mx < WORLD_WIDTH; mx += 48) {
      ctx.fillRect(mx, GROUND_Y - 90 - (mx % 40), 38, 90 + (mx % 40));
      ctx.fillStyle = '#f97316';
      ctx.fillRect(mx + 14, GROUND_Y - 75, 4, 75);
      ctx.fillStyle = '#7c2d12';
    }
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'perfection') {
    // Mahito: Self-Embodiment of Perfection — ghostly purple void & clasped silhouettes
    ctx.fillStyle = '#120724';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 2;
    for (let r = 24; r < 140; r += 36) {
      ctx.beginPath();
      ctx.arc(240, 120, r + Math.sin(timeSec * 5) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#1e0b36';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'blood_eclipse') {
    // Choso: Blood Eclipse — crimson moon & suspended blood vortex
    ctx.fillStyle = '#160408';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(240, 95, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#29050b';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'womb_profusion') {
    // Kenjaku / Geto: Womb Profusion — towering cursed spirit spire
    ctx.fillStyle = '#11071c';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(198, 22, 84, GROUND_Y - 22);
    ctx.fillStyle = '#a855f7';
    for (let y = 34; y < GROUND_Y - 20; y += 20) {
      ctx.fillRect(208 + Math.round(Math.sin(timeSec * 4 + y) * 6), y, 64, 4);
    }
    ctx.fillStyle = '#1c0b2e';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'absolute_zero') {
    // Uraume: Absolute Zero — frozen sapphire crystal cathedral
    ctx.fillStyle = '#041729';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    for (let ix = 16; ix < WORLD_WIDTH; ix += 40) {
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(ix, GROUND_Y - 64 - (ix % 36), 14, 64 + (ix % 36));
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(ix + 4, GROUND_Y - 58 - (ix % 36), 4, 58 + (ix % 36));
    }
    ctx.fillStyle = '#082f49';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'thunderclap') {
    // Kashimo: Thunderclap Arena — crackling storm sky & electric arc grid
    ctx.fillStyle = '#050f24';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.strokeStyle = Math.floor(timeSec * 16) % 2 === 0 ? '#22d3ee' : '#38bdf8';
    ctx.lineWidth = 1.5;
    for (let bx = 48; bx < WORLD_WIDTH; bx += 96) {
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + Math.sin(timeSec * 20 + bx) * 10, 90);
      ctx.lineTo(bx - 6, GROUND_Y);
      ctx.stroke();
    }
    ctx.fillStyle = '#0b1936';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'forest_branches') {
    // Hanami: Shining Sea of Branches — bioluminescent cursed canopy & giant blossoms
    ctx.fillStyle = '#041a0d';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    for (let tx = 18; tx < WORLD_WIDTH; tx += 52) {
      ctx.fillStyle = '#14532d';
      ctx.fillRect(tx, 18, 12, GROUND_Y - 18);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(tx - 6, 36 + (tx % 28), 24, 6);
    }
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  if (domainActive === 'heavenly_zero') {
    // Toji: Heavenly Restriction Zero — monochrome void & high-speed slash lines
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    for (let sx = 12; sx < WORLD_WIDTH; sx += 38) {
      ctx.fillRect(sx, 0, 1, GROUND_Y);
    }
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
    return;
  }

  // Draw pre-baked layered pixel arena
  ctx.drawImage(getArenaBackdrop(arenaId), 0, 0);

  if (domainActive === 'malevolent_shrine') {
    // Crimson Malevolent Shrine pulse overlay
    ctx.fillStyle = `rgba(185, 28, 28, ${0.22 + Math.sin(timeSec * 6) * 0.08})`;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // Live animated environmental pixel details per arena
  if (arenaId === 'jujutsu_high') {
    // Drifting sakura / autumn petals
    ctx.fillStyle = '#fda4af';
    for (let i = 0; i < 14; i++) {
      const px = (i * 47 + Math.floor(timeSec * 22)) % WORLD_WIDTH;
      const py = (i * 29 + Math.floor(timeSec * 14 + Math.sin(timeSec + i) * 8)) % (GROUND_Y - 6);
      ctx.fillRect(px, py, 2, 2);
    }
    // Flickering stone lantern glow
    const flicker = Math.sin(timeSec * 14) > 0 ? 0.25 : 0.14;
    ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`;
    ctx.fillRect(172, GROUND_Y - 30, 12, 14);
    ctx.fillRect(296, GROUND_Y - 30, 12, 14);
  } else if (arenaId === 'abandoned_school') {
    // Floating ghostly cursed wisps
    for (let i = 0; i < 10; i++) {
      const wx = (i * 53 + Math.sin(timeSec * 1.4 + i) * 18 + WORLD_WIDTH) % WORLD_WIDTH;
      const wy = 90 + (i * 19) % 120 + Math.cos(timeSec * 2 + i) * 6;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(168, 85, 247, 0.55)' : 'rgba(52, 211, 153, 0.45)';
      ctx.fillRect(Math.round(wx), Math.round(wy), 3, 3);
    }
  } else if (arenaId === 'cursed_forest') {
    // Bioluminescent spores rising
    for (let i = 0; i < 16; i++) {
      const sx = (i * 37 + Math.sin(timeSec + i) * 10 + WORLD_WIDTH) % WORLD_WIDTH;
      const sy = GROUND_Y - ((i * 23 + Math.floor(timeSec * 12)) % 170);
      ctx.fillStyle = i % 3 === 0 ? '#86efac' : '#4ade80';
      ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
  } else if (arenaId === 'shibuya') {
    // Rain streaks at night
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    for (let i = 0; i < 28; i++) {
      const rx = (i * 23 + Math.floor(timeSec * 45)) % WORLD_WIDTH;
      const ry = (i * 31 + Math.floor(timeSec * 240)) % GROUND_Y;
      ctx.fillRect(rx, ry, 1, 6);
    }
    // Neon billboard reflection shimmer on wet asphalt
    ctx.fillStyle = Math.sin(timeSec * 7) > 0 ? 'rgba(236, 72, 153, 0.16)' : 'rgba(56, 189, 248, 0.16)';
    ctx.fillRect(70, GROUND_Y + 4, 80, 12);
    ctx.fillRect(310, GROUND_Y + 4, 80, 12);
  } else if (arenaId === 'malevolent_shrine') {
    // Rising embers & blood water ripples
    for (let i = 0; i < 20; i++) {
      const ex = (i * 29 + Math.sin(timeSec * 2 + i) * 14 + WORLD_WIDTH) % WORLD_WIDTH;
      const ey = GROUND_Y - ((i * 17 + Math.floor(timeSec * 28)) % 210);
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fca5a5';
      ctx.fillRect(Math.round(ex), Math.round(ey), 2, 2);
    }
    ctx.fillStyle = 'rgba(248, 113, 113, 0.25)';
    for (let r = 0; r < 6; r++) {
      const rx = ((r * 85 + Math.floor(timeSec * 16)) % (WORLD_WIDTH - 40)) + 10;
      ctx.fillRect(rx, GROUND_Y + 6 + (r % 3) * 8, 22, 1);
    }
  }
}
