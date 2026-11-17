import { FighterAction, FighterId } from './types';

export type SpritePose =
  | 'idle0'
  | 'idle1'
  | 'walk0'
  | 'walk1'
  | 'walk2'
  | 'walk3'
  | 'jump'
  | 'dash'
  | 'sidestep'
  | 'block'
  | 'parry'
  | 'light1'
  | 'light2'
  | 'light3'
  | 'heavy'
  | 'special'
  | 'ultimate'
  | 'hitstun'
  | 'ko';

const SPRITE_W = 56;
const SPRITE_H = 64;

interface Palette {
  outline: string;
  skin: string;
  skinShadow: string;
  hair: string;
  hairHighlight: string;
  outfitMain: string;
  outfitShadow: string;
  outfitTrim: string;
  pants: string;
  pantsShadow: string;
  boots: string;
  accent: string;
  eye: string;
}

const PALETTES: Record<FighterId, Palette> = {
  gojo: {
    outline: '#090812',
    skin: '#f6d5c3',
    skinShadow: '#d9a892',
    hair: '#f1f5f9',
    hairHighlight: '#ffffff',
    outfitMain: '#181e38',
    outfitShadow: '#0d1021',
    outfitTrim: '#38bdf8',
    pants: '#12162b',
    pantsShadow: '#090b16',
    boots: '#1e293b',
    accent: '#38bdf8',
    eye: '#06b6d4',
  },
  yuta: {
    outline: '#0a0814',
    skin: '#f5d2c1',
    skinShadow: '#d4a18c',
    hair: '#171923',
    hairHighlight: '#2d3748',
    outfitMain: '#f1f5f9', // signature loose white uniform jacket
    outfitShadow: '#cbd5e1',
    outfitTrim: '#ec4899',
    pants: '#121420',
    pantsShadow: '#080910',
    boots: '#1e293b',
    accent: '#ec4899',
    eye: '#334155',
  },
  megumi: {
    outline: '#080914',
    skin: '#f3d0be',
    skinShadow: '#cf9e89',
    hair: '#161f38', // spiky dark indigo hair
    hairHighlight: '#2c3d66',
    outfitMain: '#1b2036',
    outfitShadow: '#0f1222',
    outfitTrim: '#818cf8',
    pants: '#15192b',
    pantsShadow: '#0a0c17',
    boots: '#1e2436',
    accent: '#6366f1',
    eye: '#38bdf8',
  },
  panda: {
    outline: '#0b0908',
    skin: '#f8fafc', // white panda fur
    skinShadow: '#cbd5e1',
    hair: '#18181b', // black panda fur ears/shoulders
    hairHighlight: '#3f3f46',
    outfitMain: '#f8fafc',
    outfitShadow: '#cbd5e1',
    outfitTrim: '#f59e0b',
    pants: '#18181b',
    pantsShadow: '#09090b',
    boots: '#27272a',
    accent: '#f59e0b',
    eye: '#18181b',
  },
  jogo: {
    outline: '#120806',
    skin: '#8a8296',
    skinShadow: '#5e576b',
    hair: '#4a4147',
    hairHighlight: '#fb923c',
    outfitMain: '#3b332f',
    outfitShadow: '#231d1a',
    outfitTrim: '#f97316',
    pants: '#282220',
    pantsShadow: '#181412',
    boots: '#1c1917',
    accent: '#f97316',
    eye: '#fde047',
  },
  mahito: {
    outline: '#0c0814',
    skin: '#c4c9de',
    skinShadow: '#939ab8',
    hair: '#8fa4c9',
    hairHighlight: '#cbd5e1',
    outfitMain: '#231c35',
    outfitShadow: '#151022',
    outfitTrim: '#a855f7',
    pants: '#1a1528',
    pantsShadow: '#0f0c18',
    boots: '#1e1b2e',
    accent: '#a855f7',
    eye: '#93c5fd',
  },
  hanami: {
    outline: '#07110b',
    skin: '#6b656e',
    skinShadow: '#4a454d',
    hair: '#e5e2dc',
    hairHighlight: '#ffffff',
    outfitMain: '#2a332b',
    outfitShadow: '#1a201b',
    outfitTrim: '#22c55e',
    pants: '#232b24',
    pantsShadow: '#141915',
    boots: '#2d241e',
    accent: '#22c55e',
    eye: '#dc2626',
  },
  choso: {
    outline: '#120709',
    skin: '#edd0c4',
    skinShadow: '#c7a294',
    hair: '#1e1a24',
    hairHighlight: '#3b3347',
    outfitMain: '#52404d',
    outfitShadow: '#33252f',
    outfitTrim: '#dc2626',
    pants: '#3a2b35',
    pantsShadow: '#241a20',
    boots: '#231f20',
    accent: '#ef4444',
    eye: '#ef4444',
  },
  geto: {
    outline: '#0c0816',
    skin: '#f2cfc0',
    skinShadow: '#caa08e',
    hair: '#181822',
    hairHighlight: '#3b3b52',
    outfitMain: '#272038', // monk kimono
    outfitShadow: '#161124',
    outfitTrim: '#eab308', // golden kesa robe sash
    pants: '#1b1628',
    pantsShadow: '#0f0c18',
    boots: '#f8fafc',
    accent: '#8b5cf6',
    eye: '#334155',
  },
  kenjaku: {
    outline: '#0d0714',
    skin: '#f1cebe',
    skinShadow: '#c89e8c',
    hair: '#161620',
    hairHighlight: '#37374d',
    outfitMain: '#1f192e',
    outfitShadow: '#120e1c',
    outfitTrim: '#c084fc',
    pants: '#161121',
    pantsShadow: '#0b0812',
    boots: '#e2e8f0',
    accent: '#c084fc',
    eye: '#7e22ce',
  },
  uraume: {
    outline: '#09111a',
    skin: '#f8e2da',
    skinShadow: '#d8b4a8',
    hair: '#f1f5f9', // white bob with crimson streak
    hairHighlight: '#f43f5e',
    outfitMain: '#e2e8f0', // icy white monk kimono
    outfitShadow: '#94a3b8',
    outfitTrim: '#38bdf8',
    pants: '#9f1239', // crimson hakama
    pantsShadow: '#6b0b25',
    boots: '#f8fafc',
    accent: '#67e8f9',
    eye: '#ef4444',
  },
  kashimo: {
    outline: '#06111a',
    skin: '#f0ccb8',
    skinShadow: '#c99f89',
    hair: '#67e8f9', // cyan twin buns
    hairHighlight: '#cffafe',
    outfitMain: '#f8fafc', // pale martial haori
    outfitShadow: '#cbd5e1',
    outfitTrim: '#06b6d4',
    pants: '#1e293b',
    pantsShadow: '#0f172a',
    boots: '#0f172a',
    accent: '#38bdf8',
    eye: '#22d3ee',
  },
  toji: {
    outline: '#090b10',
    skin: '#e5bfa8',
    skinShadow: '#bc9178',
    hair: '#18181f',
    hairHighlight: '#3f3f4e',
    outfitMain: '#1f242d',
    outfitShadow: '#12151c',
    outfitTrim: '#cbd5e1',
    pants: '#e2e8f0',
    pantsShadow: '#94a3b8',
    boots: '#18181b',
    accent: '#94a3b8',
    eye: '#64748b',
  },
  sukuna: {
    outline: '#120406',
    skin: '#f2cbbd',
    skinShadow: '#c99b8d',
    hair: '#f48fb1',
    hairHighlight: '#f8bbd0',
    outfitMain: '#ebe3d5',
    outfitShadow: '#bfb39f',
    outfitTrim: '#dc2626',
    pants: '#1a1721',
    pantsShadow: '#0d0b12',
    boots: '#2a1f1d',
    accent: '#dc2626',
    eye: '#ef4444',
  },
};

class PixelGrid {
  public data: (string | null)[];
  constructor(public w: number, public h: number) {
    this.data = new Array(w * h).fill(null);
  }
  public set(x: number, y: number, color: string | null): void {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h) return;
    this.data[iy * this.w + ix] = color;
  }
  public get(x: number, y: number): string | null {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return null;
    return this.data[y * this.w + x];
  }
  public rect(x: number, y: number, w: number, h: number, color: string): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x0 + dx, y0 + dy, color);
      }
    }
  }
  public line(x0: number, y0: number, x1: number, y1: number, color: string, thickness = 1): void {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      if (thickness > 1) {
        this.rect(
          ix0 - Math.floor(thickness / 2),
          iy0 - Math.floor(thickness / 2),
          thickness,
          thickness,
          color
        );
      } else {
        this.set(ix0, iy0, color);
      }
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  public applyOutline(outlineColor: string): void {
    const copy = [...this.data];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (copy[y * this.w + x] !== null) continue;
        const hasNeighbor =
          (x > 0 && copy[y * this.w + (x - 1)] !== null) ||
          (x < this.w - 1 && copy[y * this.w + (x + 1)] !== null) ||
          (y > 0 && copy[(y - 1) * this.w + x] !== null) ||
          (y < this.h - 1 && copy[(y + 1) * this.w + x] !== null);
        if (hasNeighbor) {
          this.data[y * this.w + x] = outlineColor;
        }
      }
    }
  }
}

interface PoseOffsets {
  bodyDx: number;
  bodyDy: number;
  headDx: number;
  headDy: number;
  legFrontDx: number;
  legFrontDy: number;
  legBackDx: number;
  legBackDy: number;
  armFrontX: number;
  armFrontY: number;
  armBackX: number;
  armBackY: number;
  kickOut?: boolean;
  punchOut?: boolean;
  weaponSlash?: boolean;
  domainSeal?: boolean;
  knockedDown?: boolean;
  guarding?: boolean;
  parrying?: boolean;
}

function getPoseOffsets(pose: SpritePose): PoseOffsets {
  switch (pose) {
    case 'idle0':
      return {
        bodyDx: 0, bodyDy: 0, headDx: 0, headDy: 0,
        legFrontDx: 5, legFrontDy: 0, legBackDx: -5, legBackDy: 0,
        armFrontX: 7, armFrontY: 28, armBackX: -6, armBackY: 29,
      };
    case 'idle1':
      return {
        bodyDx: 0, bodyDy: 1, headDx: 0, headDy: 1,
        legFrontDx: 5, legFrontDy: 0, legBackDx: -5, legBackDy: 0,
        armFrontX: 8, armFrontY: 29, armBackX: -5, armBackY: 30,
      };
    case 'walk0':
      return {
        bodyDx: 1, bodyDy: 0, headDx: 2, headDy: 0,
        legFrontDx: 8, legFrontDy: -1, legBackDx: -6, legBackDy: 0,
        armFrontX: 9, armFrontY: 27, armBackX: -7, armBackY: 29,
      };
    case 'walk1':
      return {
        bodyDx: 1, bodyDy: 1, headDx: 2, headDy: 1,
        legFrontDx: 3, legFrontDy: 0, legBackDx: -2, legBackDy: -1,
        armFrontX: 5, armFrontY: 29, armBackX: -5, armBackY: 28,
      };
    case 'walk2':
      return {
        bodyDx: 1, bodyDy: 0, headDx: 2, headDy: 0,
        legFrontDx: -5, legFrontDy: 0, legBackDx: 8, legBackDy: -1,
        armFrontX: -5, armFrontY: 29, armBackX: 9, armBackY: 27,
      };
    case 'walk3':
      return {
        bodyDx: 1, bodyDy: 1, headDx: 2, headDy: 1,
        legFrontDx: -2, legFrontDy: -1, legBackDx: 3, legBackDy: 0,
        armFrontX: 4, armFrontY: 28, armBackX: -4, armBackY: 29,
      };
    case 'jump':
      return {
        bodyDx: 0, bodyDy: -4, headDx: 1, headDy: -4,
        legFrontDx: 6, legFrontDy: -6, legBackDx: -5, legBackDy: -4,
        armFrontX: 8, armFrontY: 20, armBackX: -7, armBackY: 21,
      };
    case 'dash':
      return {
        bodyDx: 4, bodyDy: 2, headDx: 6, headDy: 2,
        legFrontDx: 9, legFrontDy: 0, legBackDx: -9, legBackDy: -2,
        armFrontX: 10, armFrontY: 27, armBackX: -10, armBackY: 26,
      };
    case 'sidestep':
      return {
        bodyDx: -2, bodyDy: 1, headDx: -2, headDy: 1,
        legFrontDx: 3, legFrontDy: -2, legBackDx: -3, legBackDy: 0,
        armFrontX: 5, armFrontY: 24, armBackX: -5, armBackY: 26,
      };
    case 'block':
      return {
        bodyDx: -1, bodyDy: 2, headDx: -1, headDy: 2,
        legFrontDx: 5, legFrontDy: 0, legBackDx: -6, legBackDy: 0,
        armFrontX: 7, armFrontY: 21, armBackX: 4, armBackY: 25,
        guarding: true,
      };
    case 'parry':
      return {
        bodyDx: 1, bodyDy: 1, headDx: 1, headDy: 1,
        legFrontDx: 6, legFrontDy: 0, legBackDx: -5, legBackDy: 0,
        armFrontX: 10, armFrontY: 21, armBackX: 6, armBackY: 26,
        parrying: true,
      };
    case 'light1':
      return {
        bodyDx: 2, bodyDy: 0, headDx: 3, headDy: 0,
        legFrontDx: 6, legFrontDy: 0, legBackDx: -6, legBackDy: 0,
        armFrontX: 17, armFrontY: 23, armBackX: -4, armBackY: 27,
        punchOut: true,
      };
    case 'light2':
      return {
        bodyDx: 4, bodyDy: 1, headDx: 4, headDy: 1,
        legFrontDx: 7, legFrontDy: 0, legBackDx: -6, legBackDy: 0,
        armFrontX: 18, armFrontY: 21, armBackX: -2, armBackY: 28,
        punchOut: true,
      };
    case 'light3':
      return {
        bodyDx: 5, bodyDy: 1, headDx: 5, headDy: 1,
        legFrontDx: 8, legFrontDy: 0, legBackDx: -7, legBackDy: 0,
        armFrontX: 20, armFrontY: 22, armBackX: 13, armBackY: 25,
        punchOut: true,
      };
    case 'heavy':
      return {
        bodyDx: 2, bodyDy: -1, headDx: 1, headDy: -1,
        legFrontDx: 18, legFrontDy: -13, legBackDx: -5, legBackDy: 0,
        armFrontX: 9, armFrontY: 22, armBackX: -7, armBackY: 24,
        kickOut: true,
      };
    case 'special':
      return {
        bodyDx: 3, bodyDy: 1, headDx: 3, headDy: 1,
        legFrontDx: 7, legFrontDy: 0, legBackDx: -6, legBackDy: 0,
        armFrontX: 18, armFrontY: 23, armBackX: -5, armBackY: 26,
        weaponSlash: true,
      };
    case 'ultimate':
      return {
        bodyDx: 0, bodyDy: -2, headDx: 0, headDy: -2,
        legFrontDx: 4, legFrontDy: -1, legBackDx: -4, legBackDy: -1,
        armFrontX: 6, armFrontY: 18, armBackX: -5, armBackY: 20,
        domainSeal: true,
      };
    case 'hitstun':
      return {
        bodyDx: -4, bodyDy: 1, headDx: -5, headDy: 1,
        legFrontDx: 4, legFrontDy: 0, legBackDx: -6, legBackDy: 0,
        armFrontX: 4, armFrontY: 30, armBackX: -7, armBackY: 28,
      };
    case 'ko':
      return {
        bodyDx: 0, bodyDy: 18, headDx: -12, headDy: 26,
        legFrontDx: 12, legFrontDy: 0, legBackDx: 7, legBackDy: 0,
        armFrontX: 6, armFrontY: 52, armBackX: -6, armBackY: 54,
        knockedDown: true,
      };
  }
}

function paintFighterGrid(id: FighterId, pose: SpritePose): PixelGrid {
  const p = PALETTES[id];
  const g = new PixelGrid(SPRITE_W, SPRITE_H);
  const o = getPoseOffsets(pose);
  const cx = 25;

  if (o.knockedDown) {
    g.rect(cx - 15, 50, 28, 7, p.outfitMain);
    g.rect(cx - 12, 53, 20, 4, p.outfitShadow);
    g.rect(cx + 6, 51, 12, 5, p.pants);
    g.rect(cx + 17, 51, 4, 5, p.boots);
    g.rect(cx - 21, 47, 9, 9, p.skin);
    g.rect(cx - 22, 44, 10, 5, p.hair);
    if (id === 'gojo') g.rect(cx - 21, 49, 8, 3, '#0b0c15');
    g.applyOutline(p.outline);
    return g;
  }

  const bulk = id === 'hanami' || id === 'panda' ? 3 : id === 'sukuna' ? 1 : 0;
  const hipY = 38 + o.bodyDy;
  const torsoY = 23 + o.bodyDy;
  const headY = 9 + o.headDy;
  const hx = cx + o.headDx;
  const bx = cx + o.bodyDx;

  // Back leg (thigh + knee + calf + boot)
  const blx = cx + o.legBackDx;
  const bly = 56 + o.legBackDy;
  g.line(bx - 3, hipY + 2, blx, bly - 5, p.pantsShadow, 5);
  g.rect(blx - 3, bly - 3, 6, 4, p.boots);

  // Back arm
  g.line(bx - 5 - bulk, torsoY + 3, cx + o.armBackX, o.armBackY, p.outfitShadow, 4);
  g.rect(cx + o.armBackX - 2, o.armBackY - 1, 4, 4, id === 'panda' ? '#18181b' : p.skinShadow);

  // Torso (anatomical chest/waist)
  const torsoW = 12 + bulk * 2;
  const leftTorso = bx - Math.floor(torsoW / 2);
  g.rect(leftTorso, torsoY, torsoW, 16, p.outfitMain);
  g.rect(leftTorso, torsoY + 2, 4, 14, p.outfitShadow);
  g.rect(leftTorso + torsoW - 3, torsoY + 1, 2, 13, p.outfitMain);

  // Neck
  g.rect(bx - 2, torsoY - 2, 4, 3, p.skinShadow);

  // Character-specific Torso / Outfit Details
  if (id === 'gojo') {
    g.rect(bx - 6, torsoY - 3, 12, 4, p.outfitMain);
    g.set(bx + 2, torsoY + 4, '#fbbf24');
    g.set(bx + 2, torsoY + 9, '#fbbf24');
    g.rect(leftTorso, torsoY + 13, torsoW, 2, '#090b16');
  } else if (id === 'yuta') {
    // High collar + open white uniform lapel + katana scabbard on hip!
    g.rect(bx - 6, torsoY - 2, 12, 3, p.outfitShadow);
    g.rect(bx - 1, torsoY + 2, 3, 12, '#0f172a');
    g.line(bx - 10, hipY + 4, bx + 4, torsoY + 11, '#1e293b', 2); // scabbard
    g.set(bx - 10, hipY + 4, '#ec4899');
  } else if (id === 'megumi') {
    // Jujutsu high jacket with indigo lining
    g.rect(bx - 6, torsoY - 2, 12, 3, p.outfitMain);
    g.set(bx + 2, torsoY + 4, '#94a3b8');
    g.set(bx + 2, torsoY + 9, '#94a3b8');
  } else if (id === 'panda') {
    // Black panda chest band across white fur torso!
    g.rect(leftTorso, torsoY, torsoW, 5, '#18181b');
    g.rect(leftTorso - 1, torsoY + 1, torsoW + 2, 3, '#18181b');
    g.rect(bx - 3, torsoY + 6, 7, 7, '#ffffff');
  } else if (id === 'geto' || id === 'kenjaku') {
    // Golden Buddhist kesa sash across monk robes
    g.line(leftTorso, torsoY + 1, leftTorso + torsoW - 1, torsoY + 12, '#eab308', 3);
    g.rect(leftTorso, torsoY + 13, torsoW, 3, p.outfitShadow);
  } else if (id === 'uraume') {
    // Crimson/white scarf & belted hakama waist
    g.rect(bx - 6, torsoY - 1, 12, 4, '#9f1239');
    g.rect(leftTorso, torsoY + 12, torsoW, 3, '#9f1239');
  } else if (id === 'kashimo') {
    // Haori coat with cyan lightning waist sash
    g.rect(bx - 3, torsoY + 2, 6, 10, '#1e293b');
    g.rect(leftTorso, torsoY + 12, torsoW, 2, '#06b6d4');
  } else if (id === 'sukuna') {
    g.rect(bx - 3, torsoY + 1, 7, 8, p.skin);
    g.set(bx - 2, torsoY + 3, '#111827');
    g.set(bx + 2, torsoY + 4, '#111827');
    g.rect(leftTorso, torsoY + 11, torsoW, 3, '#18181b');
    g.rect(leftTorso, torsoY + 14, torsoW, 2, p.outfitTrim);
  } else if (id === 'toji') {
    // Muscular shading + coiled Inventory Curse worm
    g.rect(bx - 6, torsoY + 1, 12, 3, '#9d8ca1');
    g.rect(bx - 4, torsoY + 4, 5, 3, '#7d6c82');
    g.set(bx - 5, torsoY + 1, '#f43f5e');
  } else if (id === 'mahito') {
    g.rect(bx - 5, torsoY, 10, 3, '#4c1d95');
    g.set(bx, torsoY + 5, '#64748b');
    g.set(bx, torsoY + 9, '#64748b');
  } else if (id === 'hanami') {
    g.rect(leftTorso - 2, torsoY - 1, 6, 6, p.hair);
    g.rect(bx + 4, torsoY - 1, 5, 6, p.hair);
    g.rect(bx - 3, torsoY + 3, 6, 9, p.skin);
  } else if (id === 'choso') {
    g.rect(bx - 6, torsoY - 1, 12, 3, '#b8a99a');
    g.rect(bx - 1, torsoY + 3, 3, 11, p.outfitTrim);
  } else if (id === 'jogo') {
    g.rect(bx - 6, torsoY, 12, 5, '#4c3f37');
    g.rect(bx - 4, torsoY + 5, 8, 7, p.skin);
  }

  // Front leg / Roundhouse kick
  if (o.kickOut) {
    g.line(bx + 3, hipY + 1, cx + o.legFrontDx, hipY - 9, p.pants, 5);
    g.rect(cx + o.legFrontDx - 1, hipY - 11, 6, 5, p.boots);
    g.rect(cx + o.legFrontDx + 3, hipY - 12, 5, 4, p.accent);
  } else {
    const flx = cx + o.legFrontDx;
    const fly = 56 + o.legFrontDy;
    g.line(bx + 3, hipY + 1, flx, fly - 5, p.pants, 5);
    g.rect(flx - 2, fly - 3, 6, 4, p.boots);
  }

  // Head base
  const headW = id === 'hanami' || id === 'panda' ? 13 : 11;
  const headH = id === 'jogo' ? 13 : 12;
  g.rect(hx - 5, headY, headW, headH, p.skin);
  g.rect(hx - 5, headY + 7, 3, 5, p.skinShadow);

  // Character-specific Heads, Hair & Faces
  if (id === 'gojo') {
    g.rect(hx - 5, headY + 4, 12, 4, '#09090f'); // blindfold
    g.rect(hx - 4, headY + 5, 10, 1, '#1e293b');
    if (pose === 'special' || pose === 'ultimate' || pose === 'parry') {
      g.rect(hx + 2, headY + 5, 3, 2, '#38bdf8');
      g.set(hx + 3, headY + 5, '#ffffff');
    }
    g.rect(hx - 6, headY - 4, 13, 6, p.hair);
    g.set(hx - 5, headY - 6, p.hairHighlight);
    g.set(hx - 1, headY - 7, p.hairHighlight);
    g.set(hx + 3, headY - 6, p.hairHighlight);
    g.set(hx + 6, headY - 5, p.hair);
  } else if (id === 'yuta') {
    // Tousled dark hair + tired sharp eyes
    g.rect(hx - 6, headY - 3, 13, 6, p.hair);
    g.rect(hx + 2, headY + 2, 4, 3, p.hair);
    g.set(hx + 2, headY + 5, '#1e293b');
    g.set(hx + 4, headY + 5, '#1e293b');
    g.set(hx - 2, headY - 5, p.hairHighlight);
  } else if (id === 'megumi') {
    // Signature sea-urchin spiky navy hair
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.line(hx - 6, headY - 3, hx - 9, headY - 7, p.hair, 2);
    g.line(hx, headY - 3, hx, headY - 8, p.hairHighlight, 2);
    g.line(hx + 5, headY - 3, hx + 8, headY - 7, p.hair, 2);
    g.set(hx + 2, headY + 5, p.eye);
    g.set(hx + 4, headY + 5, p.eye);
  } else if (id === 'panda') {
    // Round black panda ears & eye patches!
    g.rect(hx - 6, headY - 3, 4, 4, '#18181b');
    g.rect(hx + 4, headY - 3, 4, 4, '#18181b');
    g.rect(hx - 1, headY + 3, 3, 3, '#18181b');
    g.rect(hx + 3, headY + 3, 3, 3, '#18181b');
    g.set(hx + 1, headY + 4, '#ffffff');
    g.set(hx + 4, headY + 4, '#ffffff');
    g.rect(hx + 1, headY + 7, 3, 2, '#18181b'); // snout
  } else if (id === 'geto' || id === 'kenjaku') {
    // Long black hair with front bang & back bun
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.rect(hx - 8, headY - 1, 3, 7, p.hair);
    g.rect(hx + 4, headY + 1, 2, 5, p.hair);
    g.set(hx + 2, headY + 5, p.eye);
    if (id === 'kenjaku') {
      // Iconic forehead horizontal stitch scar!
      g.rect(hx - 4, headY + 2, 10, 1, '#334155');
      g.set(hx - 2, headY + 1, '#1e293b');
      g.set(hx + 1, headY + 3, '#1e293b');
      g.set(hx + 4, headY + 1, '#1e293b');
    }
  } else if (id === 'uraume') {
    // White bob hair with red underside streak
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.rect(hx - 6, headY + 1, 3, 8, p.hair);
    g.rect(hx - 6, headY + 5, 3, 3, p.hairHighlight); // crimson streak
    g.set(hx + 2, headY + 5, p.eye);
  } else if (id === 'kashimo') {
    // Cyan spiky twin-bun hair
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.rect(hx - 7, headY - 6, 4, 4, p.hairHighlight);
    g.rect(hx + 4, headY - 6, 4, 4, p.hairHighlight);
    g.set(hx + 2, headY + 5, p.eye);
    g.set(hx + 4, headY + 5, p.eye);
  } else if (id === 'jogo') {
    g.rect(hx - 6, headY - 5, 13, 7, p.hair);
    g.rect(hx - 2, headY - 7, 6, 3, '#574c52');
    g.rect(hx - 1, headY - 7, 4, 2, '#fb923c');
    g.set(hx + 1, headY - 8, '#fde047');
    g.rect(hx - 1, headY + 3, 6, 5, '#ffffff');
    g.rect(hx + 1, headY + 5, 2, 2, '#09090b');
    g.rect(hx - 2, headY + 9, 7, 2, '#1c1917');
    g.set(hx - 1, headY + 9, '#e7e5e4');
    g.set(hx + 3, headY + 9, '#e7e5e4');
  } else if (id === 'mahito') {
    g.rect(hx - 7, headY - 3, 14, 6, p.hair);
    g.rect(hx - 7, headY + 2, 3, 10, p.hair);
    g.set(hx + 3, headY + 5, p.eye);
    g.rect(hx - 2, headY + 7, 6, 1, '#334155');
    g.set(hx - 1, headY + 6, '#1e293b');
    g.set(hx + 2, headY + 8, '#1e293b');
  } else if (id === 'hanami') {
    g.rect(hx - 5, headY, 12, 7, p.hair);
    g.rect(hx - 1, headY + 3, 4, 3, p.eye);
    g.rect(hx + 3, headY + 4, 3, 2, p.eye);
    g.line(hx - 4, headY, hx - 9, headY - 8, '#3f2e21', 2);
    g.line(hx + 5, headY, hx + 10, headY - 8, '#3f2e21', 2);
  } else if (id === 'choso') {
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.rect(hx - 8, headY - 2, 3, 5, p.hair);
    g.rect(hx + 6, headY - 2, 3, 5, p.hair);
    g.rect(hx, headY + 6, 6, 2, '#991b1b');
    g.set(hx + 3, headY + 4, '#1e293b');
  } else if (id === 'toji') {
    g.rect(hx - 6, headY - 3, 13, 5, p.hair);
    g.set(hx + 5, headY + 2, p.hair);
    g.set(hx + 3, headY + 4, '#0f172a');
    g.set(hx + 4, headY + 8, '#9f1239');
  } else if (id === 'sukuna') {
    g.rect(hx - 6, headY - 4, 13, 6, p.hair);
    g.set(hx - 5, headY - 6, p.hairHighlight);
    g.set(hx, headY - 7, p.hairHighlight);
    g.set(hx + 5, headY - 6, p.hair);
    g.set(hx + 1, headY + 3, '#dc2626');
    g.set(hx + 4, headY + 3, '#dc2626');
    g.set(hx + 1, headY + 5, '#ef4444');
    g.set(hx + 4, headY + 5, '#ef4444');
    g.rect(hx - 2, headY + 1, 3, 1, '#18181b');
    g.rect(hx - 4, headY + 7, 4, 2, '#18181b');
  }

  // Front arm & weapons / attack trails
  const armBaseX = bx + 4;
  const armBaseY = torsoY + 3;
  const fax = cx + o.armFrontX;
  const fay = o.armFrontY;

  if (o.domainSeal) {
    g.line(armBaseX, armBaseY, fax, fay, p.outfitMain, 4);
    g.rect(fax - 1, fay - 5, 4, 6, id === 'panda' ? '#18181b' : p.skin);
    g.rect(fax - 3, fay - 8, 7, 4, p.accent);
  } else if (o.parrying) {
    g.line(armBaseX, armBaseY, fax, fay, p.outfitMain, 4);
    g.rect(fax - 1, fay - 2, 4, 4, id === 'panda' ? '#18181b' : p.skin);
    // Glowing Parry deflection arc
    g.line(fax + 3, fay - 9, fax + 6, fay + 7, '#fde047', 2);
    g.line(fax + 4, fay - 7, fax + 7, fay + 5, '#ffffff', 1);
  } else if (o.punchOut) {
    g.line(armBaseX, armBaseY, fax, fay, p.outfitMain, 4);
    g.rect(fax - 1, fay - 2, 6, 5, id === 'panda' ? '#18181b' : p.skin);
    if (id === 'yuta') {
      // Cursed katana slash forward!
      g.line(fax + 2, fay, fax + 14, fay - 5, '#e2e8f0', 2);
      g.line(fax + 4, fay + 1, fax + 15, fay - 4, p.accent, 1);
    } else {
      g.rect(fax + 4, fay - 2, 4, 5, p.accent);
    }
  } else if (o.weaponSlash) {
    g.line(armBaseX, armBaseY, fax, fay, p.outfitMain, 4);
    if (id === 'toji') {
      g.line(fax, fay, fax + 14, fay - 7, '#e2e8f0', 2);
      g.rect(fax + 11, fay - 9, 5, 5, '#38bdf8');
    } else if (id === 'yuta') {
      g.line(fax, fay, fax + 16, fay - 6, '#f8fafc', 2);
      g.line(fax + 2, fay + 1, fax + 17, fay - 5, '#ec4899', 1);
    } else if (id === 'kashimo') {
      g.line(fax - 4, fay + 4, fax + 15, fay - 8, '#cbd5e1', 2);
      g.rect(fax + 13, fay - 10, 4, 4, '#22d3ee');
    } else if (id === 'geto') {
      // Playful Cloud 3-section staff!
      g.line(fax, fay, fax + 12, fay - 6, '#dc2626', 2);
      g.line(fax + 12, fay - 6, fax + 16, fay + 4, '#dc2626', 2);
    } else if (id === 'mahito') {
      g.line(fax, fay, fax + 16, fay - 1, '#4c1d95', 5);
      g.line(fax + 10, fay - 4, fax + 18, fay, '#c084fc', 2);
    } else if (id === 'sukuna') {
      g.rect(fax - 1, fay - 2, 5, 5, p.skin);
      g.line(fax + 3, fay - 7, fax + 14, fay + 5, '#ef4444', 2);
    } else {
      g.rect(fax - 1, fay - 2, 5, 5, id === 'panda' ? '#18181b' : p.skin);
      g.rect(fax + 4, fay - 3, 5, 6, p.accent);
    }
  } else {
    g.line(armBaseX, armBaseY, fax, fay, p.outfitMain, 4);
    g.rect(fax - 1, fay - 1, 4, 4, id === 'panda' ? '#18181b' : p.skin);
    if (id === 'toji') {
      g.line(fax, fay, fax - 6, fay - 11, '#cbd5e1', 1);
      g.set(fax - 7, fay - 12, '#38bdf8');
    } else if (id === 'kashimo') {
      g.line(fax, fay + 8, fax + 2, fay - 14, '#cbd5e1', 1);
      g.set(fax + 2, fay - 15, '#22d3ee');
    } else if (id === 'yuta') {
      g.line(fax, fay, fax + 6, fay - 9, '#f8fafc', 1);
    }
  }

  if (o.guarding) {
    g.rect(bx + 5, torsoY - 4, 3, 18, p.accent);
  }

  g.applyOutline(p.outline);
  return g;
}

const spriteCache = new Map<string, HTMLCanvasElement>();
const whiteFlashCache = new Map<string, HTMLCanvasElement>();
const portraitCache = new Map<FighterId, string>();

function renderGridToCanvas(grid: PixelGrid, solidWhite = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = grid.w;
  canvas.height = grid.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const c = grid.get(x, y);
      if (c) {
        ctx.fillStyle = solidWhite ? '#ffffff' : c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

export function getFighterSprite(
  id: FighterId,
  pose: SpritePose,
  whiteFlash = false
): HTMLCanvasElement {
  const key = `${id}:${pose}`;
  const cache = whiteFlash ? whiteFlashCache : spriteCache;
  const existing = cache.get(key);
  if (existing) return existing;

  const grid = paintFighterGrid(id, pose);
  const normal = renderGridToCanvas(grid, false);
  const flash = renderGridToCanvas(grid, true);
  spriteCache.set(key, normal);
  whiteFlashCache.set(key, flash);
  return whiteFlash ? flash : normal;
}

export function actionToPose(action: FighterAction, walkDist: number, timeSec: number): SpritePose {
  switch (action) {
    case 'idle':
      return Math.floor(timeSec * 3.2) % 2 === 0 ? 'idle0' : 'idle1';
    case 'walk': {
      const idx = Math.floor(walkDist / 7) % 4;
      return `walk${idx}` as SpritePose;
    }
    case 'jump':
      return 'jump';
    case 'dash':
      return 'dash';
    case 'sidestep':
      return 'sidestep';
    case 'block':
      return 'block';
    case 'parry':
      return 'parry';
    case 'light1':
      return 'light1';
    case 'light2':
      return 'light2';
    case 'light3':
      return 'light3';
    case 'heavy':
      return 'heavy';
    case 'skill_1':
    case 'skill_2':
    case 'skill_3':
    case 'enemy_special_1':
    case 'enemy_special_2':
    case 'enemy_special_3':
      return 'special';
    case 'skill_4':
    case 'skill_5_domain':
    case 'enemy_ultimate':
    case 'victory':
      return 'ultimate';
    case 'hitstun':
      return 'hitstun';
    case 'knockdown':
    case 'ko':
      return 'ko';
  }
}

export function getCharacterPortraitDataUrl(id: FighterId): string {
  if (typeof document === 'undefined') return '';
  const cached = portraitCache.get(id);
  if (cached) return cached;

  const sprite = getFighterSprite(id, 'idle0', false);
  const out = document.createElement('canvas');
  out.width = 48;
  out.height = 48;
  const ctx = out.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    const p = PALETTES[id];
    ctx.fillStyle = '#0d0c18';
    ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(2, 2, 44, 44);
    ctx.globalAlpha = 1;
    ctx.drawImage(sprite, 10, 1, 32, 32, 2, 2, 44, 44);
  }
  const url = out.toDataURL();
  portraitCache.set(id, url);
  return url;
}
