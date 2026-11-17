import { drawArenaAtmosphere } from './pixelArenas';
import { actionToPose, getFighterSprite } from './pixelSprites';
import { getDomainVisualSpec } from './rules';
import {
  Afterimage,
  ArenaId,
  DomainTheme,
  FighterId,
  FighterState,
  FloatingCallout,
  GROUND_Y,
  GroundHazard,
  Particle,
  Projectile,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './types';

export interface RenderFrameState {
  arenaId: ArenaId;
  timeSec: number;
  cameraZoom: number;
  cameraX: number;
  cameraY: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
  screenFlashAlpha: number;
  screenFlashColor: string;
  domainActive: DomainTheme;
  domainCinematicProgress: number; // 0 = inactive, >0..1 = cut-in sequence
  domainCasterId: FighterId | null;
  domainTitle: string;
  player: FighterState;
  enemy: FighterState;
  projectiles: Projectile[];
  hazards: GroundHazard[];
  particles: Particle[];
  afterimages: Afterimage[];
  callouts: FloatingCallout[];
}

function drawShadow(ctx: CanvasRenderingContext2D, f: FighterState): void {
  const heightRatio = Math.max(0.35, 1 - (GROUND_Y - f.y) / 140);
  const w = Math.round(28 * heightRatio);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.fillRect(Math.round(f.x - w / 2), GROUND_Y - 1, w, 4);
}

function drawFighter(
  ctx: CanvasRenderingContext2D,
  f: FighterState,
  timeSec: number
): void {
  const pose = actionToPose(f.action, f.walkDist, timeSec);
  const sprite = getFighterSprite(f.id, pose, f.flashTimer > 0);

  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y));
  ctx.scale(f.facing * f.scaleX, f.scaleY);

  // Boss / Buff aura
  if ((f.id === 'sukuna' && f.bossPhase >= 2 && f.action !== 'ko') || f.buffTimer > 0) {
    ctx.fillStyle =
      f.id === 'panda'
        ? 'rgba(245, 158, 11, 0.22)'
        : f.bossPhase === 3
        ? `rgba(220, 38, 38, ${0.28 + Math.sin(timeSec * 12) * 0.1})`
        : 'rgba(239, 68, 68, 0.18)';
    ctx.fillRect(-16, -56, 32, 56);
  }

  // Diegetic pixel glint flash before big enemy attacks
  if (
    !f.isPlayer &&
    (f.action === 'heavy' ||
      f.action === 'enemy_special_1' ||
      f.action === 'enemy_special_2' ||
      f.action === 'enemy_ultimate') &&
    f.actionTimer < 0.28
  ) {
    const gx = 12;
    const gy = -34;
    const glintColor = f.action === 'enemy_ultimate' ? '#ef4444' : '#fde047';
    ctx.fillStyle = glintColor;
    ctx.fillRect(gx - 5, gy, 11, 1);
    ctx.fillRect(gx, gy - 5, 1, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 1, gy - 1, 3, 3);
  }

  // Draw 56x64 sprite anchored bottom-center (feet at y=59)
  ctx.drawImage(sprite, -25, -59);
  ctx.restore();

  // Gojo Infinity protective geometric distortion barrier
  if (f.id === 'gojo' && f.infinityTimer > 0) {
    ctx.save();
    const cx = Math.round(f.x);
    const cy = Math.round(f.y - 28);
    const pulse = 25 + Math.sin(timeSec * 10) * 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = timeSec * 1.4 + (i * Math.PI) / 3;
      const px = cx + Math.cos(a) * pulse;
      const py = cy + Math.sin(a) * pulse;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.restore();
  }

  // Active Parry stance shield arc
  if (f.action === 'parry' && f.parryWindowTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      Math.round(f.x + f.facing * 8),
      Math.round(f.y - 28),
      19,
      f.facing === 1 ? -Math.PI * 0.45 : Math.PI * 0.55,
      f.facing === 1 ? Math.PI * 0.45 : Math.PI * 1.45
    );
    ctx.stroke();
    ctx.restore();
  }

  // Just-Parry success ring
  if (f.parryFlashTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const r = Math.round((0.28 - f.parryFlashTimer) * 95 + 10);
    ctx.beginPath();
    ctx.arc(Math.round(f.x), Math.round(f.y - 28), r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (f.stunLockedTimer > 0) {
    ctx.fillStyle = Math.floor(timeSec * 16) % 2 === 0 ? '#7dd3fc' : '#ffffff';
    ctx.fillRect(Math.round(f.x - 12), Math.round(f.y - 58), 3, 3);
    ctx.fillRect(Math.round(f.x + 10), Math.round(f.y - 54), 3, 3);
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[], timeSec: number): void {
  for (const p of projectiles) {
    if (!p.active) continue;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const r = Math.round(p.radius);

    if (p.kind === 'blue') {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, Math.floor(r * 0.45)), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'red') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef2f2';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, Math.floor(r * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'purple' || p.kind === 'pure_love') {
      const outer = p.kind === 'pure_love' ? '#ec4899' : '#7e22ce';
      const inner = p.kind === 'pure_love' ? '#fce7f3' : '#f3e8ff';
      ctx.fillStyle = p.kind === 'pure_love' ? 'rgba(236, 72, 153, 0.35)' : 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(6, Math.floor(r * 0.55)), 0, Math.PI * 2);
      ctx.fill();
      const a = timeSec * 18;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(Math.round(x + Math.cos(a) * (r + 4)), Math.round(y + Math.sin(a) * (r + 4)), 3, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(Math.round(x - Math.cos(a) * (r + 4)), Math.round(y - Math.sin(a) * (r + 4)), 3, 3);
    } else if (p.kind === 'rika_claw') {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 14);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x - 10, y + 14);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 8, 4, 16);
    } else if (p.kind === 'cursed_speech') {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#faf5ff';
      ctx.fillRect(x - 6, y - 2, 12, 4);
    } else if (p.kind === 'divine_dog') {
      // Twin shadow hound lunge
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x - 14, y - 7, 28, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 10, y - 4, 14, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + (p.vx >= 0 ? 8 : -10), y - 5, 3, 3);
    } else if (p.kind === 'nue_bolt' || p.kind === 'kashimo_bolt') {
      ctx.strokeStyle = p.kind === 'nue_bolt' ? '#facc15' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 6);
      ctx.lineTo(x - 2, y + 4);
      ctx.lineTo(x + 6, y - 5);
      ctx.lineTo(x + 14, y + 2);
      ctx.stroke();
    } else if (p.kind === 'elephant_wave') {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x - 18, y - 12, 36, 24);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(x - 12, y - 6, 24, 12);
    } else if (p.kind === 'uraume_ice') {
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 6);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x - 12, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x - 6, y - 2, 14, 4);
    } else if (p.kind === 'geto_swarm' || p.kind === 'kenjaku_uzumaki') {
      ctx.fillStyle = p.kind === 'kenjaku_uzumaki' ? '#7e22ce' : '#4c1d95';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, r - 4), timeSec * 8, timeSec * 8 + Math.PI * 1.4);
      ctx.stroke();
    } else if (p.kind === 'jogo_fireball' || p.kind === 'sukuna_flame') {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, Math.floor(r * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'choso_piercing') {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x - 22, y - 3, 44, 6);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(x - 18, y - 1, 36, 2);
    } else if (p.kind === 'choso_orb') {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (p.kind === 'hanami_beam') {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x - 18, y - 7, 36, 14);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(x - 14, y - 3, 28, 6);
    } else if (p.kind === 'sukuna_dismantle') {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - r);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x - 8, y + r);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - r + 2);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x - 6, y + r - 2);
      ctx.stroke();
    }
  }
}

function drawHazards(ctx: CanvasRenderingContext2D, hazards: GroundHazard[], timeSec: number): void {
  for (const h of hazards) {
    if (!h.active) continue;
    const x = Math.round(h.x);
    const halfW = Math.round(h.width / 2);

    if (h.telegraphTimer > 0) {
      const blink = Math.floor(timeSec * 18) % 2 === 0;
      ctx.fillStyle = blink ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.45)';
      ctx.fillRect(x - halfW, GROUND_Y - 3, h.width, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1, GROUND_Y - 14, 2, 10);
      continue;
    }

    if (h.kind === 'jogo_geyser') {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x - halfW, GROUND_Y - 62, h.width, 62);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - Math.floor(halfW * 0.5), GROUND_Y - 58, Math.max(4, Math.floor(h.width * 0.5)), 58);
    } else if (h.kind === 'hanami_roots') {
      ctx.fillStyle = '#3f2e21';
      ctx.fillRect(x - halfW, GROUND_Y - 46, h.width, 46);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x - 3, GROUND_Y - 54, 6, 12);
    } else if (h.kind === 'mahito_spike') {
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x - halfW, GROUND_Y - 50, h.width, 50);
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(x - 2, GROUND_Y - 56, 4, 16);
    } else if (h.kind === 'katana_rain') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 2, GROUND_Y - 72, 4, 68);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(x - 6, GROUND_Y - 56, 12, 3);
    } else if (h.kind === 'shadow_spire') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x - halfW, GROUND_Y - 62, h.width, 62);
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(x - 3, GROUND_Y - 68, 6, 18);
    } else if (h.kind === 'beast_pillar') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - halfW, GROUND_Y - 62, h.width, 62);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - 4, GROUND_Y - 66, 8, 66);
    } else if (h.kind === 'ice_pillar') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x - halfW, GROUND_Y - 58, h.width, 58);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x - 3, GROUND_Y - 66, 6, 60);
    } else if (h.kind === 'gravity_crush') {
      ctx.fillStyle = 'rgba(147, 51, 234, 0.55)';
      ctx.fillRect(x - halfW, GROUND_Y - 54, h.width, 54);
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(x - halfW, GROUND_Y - 5, h.width, 5);
    } else if (h.kind === 'lightning_strike') {
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(x - 4, 24, 8, GROUND_Y - 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, 24, 4, GROUND_Y - 24);
    } else if (h.kind === 'shrine_slash') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - halfW, GROUND_Y - 64);
      ctx.lineTo(x + halfW, GROUND_Y - 4);
      ctx.moveTo(x + halfW, GROUND_Y - 64);
      ctx.lineTo(x - halfW, GROUND_Y - 4);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - halfW + 2, GROUND_Y - 60);
      ctx.lineTo(x + halfW - 2, GROUND_Y - 6);
      ctx.stroke();
    }
  }
}

export function renderGameFrame(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Dynamic Camera Zoom & Tracking!
  const zoom = state.cameraZoom;
  ctx.translate(WORLD_WIDTH * 0.5 + state.shakeOffsetX, WORLD_HEIGHT * 0.5 + state.shakeOffsetY);
  ctx.scale(zoom, zoom);
  ctx.translate(-Math.round(state.cameraX), -Math.round(state.cameraY));

  drawArenaAtmosphere(ctx, state.arenaId, state.timeSec, state.domainActive);

  drawShadow(ctx, state.player);
  drawShadow(ctx, state.enemy);

  for (const ai of state.afterimages) {
    if (!ai.active) continue;
    const pose = actionToPose(ai.action, 0, state.timeSec);
    const sprite = getFighterSprite(ai.fighterId, pose, false);
    ctx.save();
    ctx.globalAlpha = ai.alpha;
    ctx.translate(Math.round(ai.x), Math.round(ai.y));
    ctx.scale(ai.facing, 1);
    ctx.drawImage(sprite, -25, -59);
    ctx.restore();
  }

  drawFighter(ctx, state.enemy, state.timeSec);
  drawFighter(ctx, state.player, state.timeSec);

  drawHazards(ctx, state.hazards, state.timeSec);
  drawProjectiles(ctx, state.projectiles, state.timeSec);

  for (const pt of state.particles) {
    if (!pt.active) continue;
    ctx.fillStyle = pt.color;
    const s = Math.max(1, Math.round(pt.size));
    ctx.fillRect(Math.round(pt.x - s / 2), Math.round(pt.y - s / 2), s, s);
  }

  ctx.font = 'bold 8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const c of state.callouts) {
    if (!c.active) continue;
    ctx.fillStyle = '#05040a';
    ctx.fillText(c.text, Math.round(c.x) + 1, Math.round(c.y) + 1);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, Math.round(c.x), Math.round(c.y));
  }

  ctx.restore();

  // Full-Screen Domain Expansion Visual Override / Shader Overlay
  drawDomainCinematicOverlay(ctx, state);

  if (state.screenFlashAlpha > 0.01) {
    ctx.fillStyle = state.screenFlashColor;
    ctx.globalAlpha = Math.min(0.85, state.screenFlashAlpha);
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.globalAlpha = 1;
  }
}

function drawDomainCinematicOverlay(
  ctx: CanvasRenderingContext2D,
  state: RenderFrameState
): void {
  if (state.domainActive === 'none' && state.domainCinematicProgress <= 0) return;

  const spec = getDomainVisualSpec(state.domainActive);
  const t = state.timeSec;

  // 1. Active Full-Screen Domain Shader Effect (Scanlines, Chromatic Tint & Motif)
  if (state.domainActive !== 'none') {
    ctx.save();

    // Radial edge vignette across full viewport
    const rad = ctx.createRadialGradient(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      70,
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      WORLD_WIDTH * 0.65
    );
    rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rad.addColorStop(1, spec.tintOverlay);
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Subtle crisp CRT / cursed resonance horizontal scanlines
    ctx.fillStyle = `rgba(255, 255, 255, ${spec.scanlineAlpha * 0.35})`;
    for (let y = (Math.floor(t * 24) % 4); y < WORLD_HEIGHT; y += 4) {
      ctx.fillRect(0, y, WORLD_WIDTH, 1);
    }

    // Character-Specific Full-Screen Domain Shader Motifs
    if (state.domainActive === 'unlimited_void') {
      // Gojo: Six-Eyes cosmic data pulse rings & white chromatic borders
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.28)';
      ctx.lineWidth = 1.5;
      const r = ((t * 140) % 260) + 20;
      ctx.beginPath();
      ctx.arc(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(0, 0, 6, WORLD_HEIGHT);
      ctx.fillRect(WORLD_WIDTH - 6, 0, 6, WORLD_HEIGHT);
    } else if (state.domainActive === 'mutual_love') {
      // Yuta: Full-screen diagonal katana slash flares
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const sx = ((i * 130 + Math.floor(t * 90)) % (WORLD_WIDTH + 80)) - 40;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx - 60, WORLD_HEIGHT);
        ctx.stroke();
      }
    } else if (state.domainActive === 'chimera_shadow') {
      // Megumi: Creeping pitch-black shadow tendrils along screen edges & indigo veins
      ctx.fillStyle = 'rgba(5, 5, 16, 0.45)';
      for (let x = 0; x < WORLD_WIDTH; x += 24) {
        const h = 14 + Math.round(Math.sin(t * 5 + x) * 6);
        ctx.fillRect(x, 0, 14, h);
        ctx.fillRect(x + 6, WORLD_HEIGHT - h, 14, h);
      }
    } else if (state.domainActive === 'beast_sanctuary') {
      // Panda: 3-Core golden seismic shockwave rings & edge tremor bars
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
      ctx.lineWidth = 2;
      for (let c = 0; c < 3; c++) {
        const a = t * 2.4 + (c * Math.PI * 2) / 3;
        const ox = WORLD_WIDTH * 0.5 + Math.cos(a) * 150;
        const oy = WORLD_HEIGHT * 0.5 + Math.sin(a) * 85;
        ctx.beginPath();
        ctx.arc(ox, oy, 14 + Math.sin(t * 8 + c) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (state.domainActive === 'iron_mountain') {
      // Jogo: Rising molten heat waves & volcanic ember columns
      ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
      for (let i = 0; i < 6; i++) {
        const hx = ((i * 88 + Math.floor(t * 16)) % (WORLD_WIDTH - 20)) + 10;
        const hh = 24 + Math.round(Math.sin(t * 7 + i) * 10);
        ctx.fillRect(hx, WORLD_HEIGHT - hh, 12, hh);
      }
    } else if (state.domainActive === 'perfection') {
      // Mahito: Concentric soul-sigil violet rings & floating hand silhouettes
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.32)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const r = ((t * 95 + i * 75) % 230) + 18;
        ctx.beginPath();
        ctx.arc(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (state.domainActive === 'forest_branches') {
      // Hanami: Bioluminescent green border vines & floating spores
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      for (let x = 0; x < WORLD_WIDTH; x += 28) {
        const h = 10 + Math.round(Math.cos(t * 4 + x) * 5);
        ctx.fillRect(x, 0, 12, h);
      }
    } else if (state.domainActive === 'blood_eclipse') {
      // Choso: Crimson eclipse corona & blood streaks
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.38)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(WORLD_WIDTH * 0.5, 92, 54 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state.domainActive === 'womb_profusion') {
      // Geto / Kenjaku: Swirling dark-violet Uzumaki vortex arcs
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.34)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 70 + i * 36, a, a + Math.PI * 0.9);
        ctx.stroke();
      }
    } else if (state.domainActive === 'absolute_zero') {
      // Uraume: Crystalline sapphire frost corners & ice shard glint
      ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.fillRect(0, 0, 8, WORLD_HEIGHT);
      ctx.fillRect(WORLD_WIDTH - 8, 0, 8, WORLD_HEIGHT);
      ctx.fillRect(0, 0, WORLD_WIDTH, 5);
    } else if (state.domainActive === 'thunderclap') {
      // Kashimo: Crackling cyan-gold border arcs
      ctx.strokeStyle = Math.floor(t * 18) % 2 === 0 ? 'rgba(34, 211, 238, 0.42)' : 'rgba(250, 204, 21, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 8, WORLD_WIDTH - 16, WORLD_HEIGHT - 16);
    } else if (state.domainActive === 'heavenly_zero') {
      // Toji: High-speed silver slash streaks across edges
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const sx = ((i * 125 + Math.floor(t * 240)) % (WORLD_WIDTH + 60)) - 30;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx - 45, WORLD_HEIGHT);
        ctx.stroke();
      }
    } else if (state.domainActive === 'malevolent_shrine') {
      // Sukuna: Cross-cutting crimson Dismantle/Cleave slashes across viewport
      ctx.strokeStyle = Math.floor(t * 16) % 2 === 0 ? 'rgba(239, 68, 68, 0.42)' : 'rgba(254, 202, 202, 0.32)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const rx = ((i * 117 + Math.floor(t * 60)) % (WORLD_WIDTH - 40)) + 20;
        const ry = ((i * 73 + Math.floor(t * 35)) % (WORLD_HEIGHT - 40)) + 20;
        ctx.beginPath();
        ctx.moveTo(rx - 22, ry - 18);
        ctx.lineTo(rx + 22, ry + 18);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 2. Dramatic Full-Screen Activation Cut-In Sequence (0..1 progress)
  const p = state.domainCinematicProgress;
  if (p > 0) {
    ctx.save();

    // Expanding circular barrier dome closing/opening across screen
    const domeRadius = Math.max(12, Math.min(340, p * 380));
    ctx.fillStyle = 'rgba(4, 3, 10, 0.52)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.strokeStyle = spec.primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, domeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = spec.secondaryColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, Math.max(4, domeRadius - 12), 0, Math.PI * 2);
    ctx.stroke();

    // Top & bottom cinematic letterbox bars
    const barH = Math.round(Math.min(1, p * 4) * 26);
    ctx.fillStyle = '#040308';
    ctx.fillRect(0, 0, WORLD_WIDTH, barH);
    ctx.fillRect(0, WORLD_HEIGHT - barH, WORLD_WIDTH, barH);

    // Mid-screen dynamic cut-in strip with caster pixel portrait & domain title
    const stripY = 92;
    const stripH = 82;
    ctx.fillStyle = 'rgba(8, 7, 18, 0.92)';
    ctx.fillRect(0, stripY, WORLD_WIDTH, stripH);

    ctx.fillStyle = spec.primaryColor;
    ctx.fillRect(0, stripY, WORLD_WIDTH, 2);
    ctx.fillRect(0, stripY + stripH - 2, WORLD_WIDTH, 2);

    // High-speed horizontal slash streaks inside cut-in strip
    ctx.fillStyle = spec.secondaryColor;
    for (let i = 0; i < 8; i++) {
      const lx = ((i * 89 + Math.floor(t * 480)) % (WORLD_WIDTH + 90)) - 45;
      const ly = stripY + 8 + ((i * 19) % (stripH - 16));
      ctx.globalAlpha = 0.28;
      ctx.fillRect(lx, ly, 46, 2);
    }
    ctx.globalAlpha = 1;

    // Caster 56x64 ultimate sprite scaled up inside cut-in left frame
    if (state.domainCasterId) {
      const casterSprite = getFighterSprite(state.domainCasterId, 'ultimate', false);
      ctx.drawImage(casterSprite, 24, stripY + 2, 70, 80);
    }

    // Bold Domain Expansion Typography
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.fillStyle = spec.secondaryColor;
    ctx.fillText('DOMAIN EXPANSION', WORLD_WIDTH * 0.58, stripY + 28);

    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#040308';
    ctx.fillText(state.domainTitle, WORLD_WIDTH * 0.58 + 2, stripY + 54);
    ctx.fillStyle = spec.primaryColor;
    ctx.fillText(state.domainTitle, WORLD_WIDTH * 0.58, stripY + 52);

    ctx.restore();
  }
}
