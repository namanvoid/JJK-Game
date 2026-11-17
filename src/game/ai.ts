import { Difficulty, FighterAction, FighterState } from './types';
import { getEnemyMoveSpec } from './rules';

export interface AiDecision {
  moveDir: -1 | 0 | 1;
  wantsBlock: boolean;
  wantsParry: boolean;
  wantsJump: boolean;
  wantsDash: boolean;
  wantsSidestep: boolean;
  triggerAction: FighterAction | null;
}

export function decideVillainAi(
  enemy: FighterState,
  player: FighterState,
  dt: number,
  difficulty: Difficulty,
  activeThreatClose: boolean
): AiDecision {
  const out: AiDecision = {
    moveDir: 0,
    wantsBlock: false,
    wantsParry: false,
    wantsJump: false,
    wantsDash: false,
    wantsSidestep: false,
    triggerAction: null,
  };

  if (
    enemy.stunLockedTimer > 0 ||
    enemy.hitstunTimer > 0 ||
    enemy.action === 'ko' ||
    enemy.action === 'knockdown'
  ) {
    return out;
  }

  const dx = player.x - enemy.x;
  const absDx = Math.abs(dx);
  const toward: -1 | 1 = dx >= 0 ? 1 : -1;
  const away: -1 | 1 = dx >= 0 ? -1 : 1;

  enemy.aiCooldown = Math.max(0, enemy.aiCooldown - dt);
  enemy.aiStateTimer = Math.max(0, enemy.aiStateTimer - dt);

  const reactionRate =
    difficulty === 'king' ? 0.9 : difficulty === 'special' ? 0.65 : 0.4;

  const isIdleOrWalk = enemy.action === 'idle' || enemy.action === 'walk' || enemy.action === 'block';

  // Reactive defense (Block, Sidestep, or occasional Parry on King/Special)
  if (
    isIdleOrWalk &&
    (activeThreatClose ||
      ((player.action.startsWith('light') ||
        player.action === 'heavy' ||
        player.action.startsWith('skill_')) &&
        absDx < 105))
  ) {
    if (enemy.aiStateTimer <= 0) {
      const roll = Math.random();
      if ((enemy.id === 'toji' || enemy.id === 'kashimo') && roll < reactionRate * 0.5) {
        out.wantsSidestep = true;
        enemy.aiStateTimer = 0.55;
        return out;
      }
      if ((enemy.id === 'sukuna' || enemy.id === 'kenjaku' || enemy.id === 'toji') && roll < reactionRate * 0.22) {
        out.wantsParry = true;
        enemy.aiStateTimer = 0.7;
        return out;
      }
      if (roll < reactionRate * 0.6) {
        enemy.aiIntent = 'guard';
        enemy.aiStateTimer = 0.36;
      } else if (enemy.id === 'hanami' && roll < 0.85) {
        out.triggerAction = 'heavy';
        enemy.aiCooldown = 0.68;
        return out;
      }
    }
  }

  if (enemy.aiIntent === 'guard' && enemy.aiStateTimer > 0) {
    out.wantsBlock = true;
    return out;
  }

  if (!isIdleOrWalk) {
    return out;
  }

  const aggressionMul =
    difficulty === 'king' ? 0.74 : difficulty === 'special' ? 1.0 : 1.35;

  const sp1 = getEnemyMoveSpec(enemy.id, 'enemy_special_1');
  const sp2 = getEnemyMoveSpec(enemy.id, 'enemy_special_2');
  const ult = getEnemyMoveSpec(enemy.id, 'enemy_ultimate');

  // Villains can unleash their Domain Expansion when below 65% HP and >= 65 CE!
  if (
    enemy.id !== 'sukuna' &&
    enemy.hp < enemy.maxHp * 0.65 &&
    enemy.ce >= ult.ceCost &&
    enemy.aiCooldown <= 0 &&
    Math.random() < 0.25
  ) {
    out.triggerAction = 'enemy_ultimate';
    enemy.aiCooldown = 2.0 * aggressionMul;
    return out;
  }

  // 1. JOGO: Zoner / Kiter
  if (enemy.id === 'jogo') {
    if (absDx < 75) {
      if (enemy.aiCooldown <= 0 && Math.random() < 0.42) {
        out.triggerAction = 'light1';
        enemy.aiCooldown = 0.55 * aggressionMul;
      } else {
        out.moveDir = away;
        if (Math.random() < 0.03) out.wantsDash = true;
      }
      return out;
    }
    if (enemy.aiCooldown <= 0) {
      if (enemy.ce >= sp2.ceCost && Math.random() < 0.42) {
        out.triggerAction = 'enemy_special_2';
        enemy.aiCooldown = 1.35 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost) {
        out.triggerAction = 'enemy_special_1';
        enemy.aiCooldown = 1.15 * aggressionMul;
        return out;
      }
    }
    out.moveDir = absDx > 195 ? toward : 0;
    return out;
  }

  // 2. MAHITO: Erratic close/mid rushdown
  if (enemy.id === 'mahito') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 54) {
        const r = Math.random();
        out.triggerAction = r < 0.55 ? 'light1' : r < 0.85 ? 'heavy' : 'enemy_special_1';
        enemy.aiCooldown = 0.48 * aggressionMul;
        return out;
      }
      if (absDx <= 115 && enemy.ce >= sp1.ceCost && Math.random() < 0.6) {
        out.triggerAction = 'enemy_special_1';
        enemy.aiCooldown = 0.82 * aggressionMul;
        return out;
      }
      if (absDx <= 150 && enemy.ce >= sp2.ceCost && Math.random() < 0.4) {
        out.triggerAction = 'enemy_special_2';
        enemy.aiCooldown = 1.05 * aggressionMul;
        return out;
      }
    }
    if (absDx > 48) {
      out.moveDir = toward;
      if (absDx > 110 && Math.random() < 0.045) out.wantsDash = true;
      if (Math.random() < 0.015) out.wantsJump = true;
    }
    return out;
  }

  // 3. HANAMI: Heavy armored tank
  if (enemy.id === 'hanami') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 56) {
        out.triggerAction = Math.random() < 0.55 ? 'heavy' : 'light1';
        enemy.aiCooldown = 0.7 * aggressionMul;
        return out;
      }
      if (absDx > 80 && enemy.ce >= sp2.ceCost && Math.random() < 0.38) {
        out.triggerAction = 'enemy_special_2';
        enemy.aiCooldown = 1.2 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost && absDx < 200 && Math.random() < 0.5) {
        out.triggerAction = 'enemy_special_1';
        enemy.aiCooldown = 1.0 * aggressionMul;
        return out;
      }
    }
    out.moveDir = absDx > 50 ? toward : 0;
    return out;
  }

  // 4. CHOSO: Piercing Blood marksman
  if (enemy.id === 'choso') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 48) {
        out.triggerAction = Math.random() < 0.6 ? 'light1' : 'heavy';
        enemy.aiCooldown = 0.52 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp2.ceCost && absDx < 210 && Math.random() < 0.45) {
        out.triggerAction = 'enemy_special_2';
        enemy.aiCooldown = 0.96 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost && absDx > 70) {
        out.triggerAction = 'enemy_special_1';
        enemy.aiCooldown = 0.9 * aggressionMul;
        return out;
      }
    }
    if (absDx < 70) out.moveDir = away;
    else if (absDx > 165) out.moveDir = toward;
    return out;
  }

  // 5. GETO: Curse swarm zoner + Playful Cloud mid-range bursts
  if (enemy.id === 'geto') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 72 && enemy.ce >= sp2.ceCost && Math.random() < 0.48) {
        out.triggerAction = 'enemy_special_2'; // Playful Cloud combo
        enemy.aiCooldown = 0.78 * aggressionMul;
        return out;
      }
      if (absDx <= 50) {
        out.triggerAction = Math.random() < 0.6 ? 'light1' : 'heavy';
        enemy.aiCooldown = 0.5 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost && absDx > 75) {
        out.triggerAction = 'enemy_special_1'; // Spirit swarm
        enemy.aiCooldown = 0.95 * aggressionMul;
        return out;
      }
    }
    out.moveDir = absDx > 140 ? toward : absDx < 45 ? away : 0;
    return out;
  }

  // 6. URAUME: Frost Calm ice waves + Icefall ground traps
  if (enemy.id === 'uraume') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 54) {
        out.triggerAction = Math.random() < 0.55 ? 'light1' : 'heavy';
        enemy.aiCooldown = 0.52 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp2.ceCost && Math.random() < 0.46) {
        out.triggerAction = 'enemy_special_2'; // Icefall pillars
        enemy.aiCooldown = 1.05 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost) {
        out.triggerAction = 'enemy_special_1'; // Frost Calm
        enemy.aiCooldown = 0.95 * aggressionMul;
        return out;
      }
    }
    out.moveDir = absDx < 80 ? away : absDx > 180 ? toward : 0;
    return out;
  }

  // 7. KASHIMO: Electrified hyper-rusher + lightning bolt
  if (enemy.id === 'kashimo') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 52) {
        const r = Math.random();
        out.triggerAction = r < 0.52 ? 'light1' : r < 0.85 ? 'heavy' : 'enemy_special_2';
        enemy.aiCooldown = 0.36 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost && absDx > 85 && Math.random() < 0.55) {
        out.triggerAction = 'enemy_special_1'; // Lightning discharge
        enemy.aiCooldown = 0.72 * aggressionMul;
        return out;
      }
    }
    if (absDx > 44) {
      out.moveDir = toward;
      if (absDx > 90 && Math.random() < 0.08) out.wantsDash = true;
    }
    return out;
  }

  // 8. TOJI FUSHIGURO: Hyper-aggressive assassin
  if (enemy.id === 'toji') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 50) {
        const r = Math.random();
        out.triggerAction = r < 0.5 ? 'light1' : r < 0.82 ? 'heavy' : 'enemy_special_2';
        enemy.aiCooldown = 0.36 * aggressionMul;
        return out;
      }
      if (absDx <= 115 && enemy.ce >= sp1.ceCost) {
        out.triggerAction = 'enemy_special_1';
        enemy.aiCooldown = 0.62 * aggressionMul;
        return out;
      }
    }
    if (absDx > 44) {
      out.moveDir = toward;
      if (absDx > 85 && Math.random() < 0.08) out.wantsDash = true;
    }
    return out;
  }

  // 9. KENJAKU: Anti-Gravity Crush + Mini-Uzumaki tactician
  if (enemy.id === 'kenjaku') {
    if (enemy.aiCooldown <= 0) {
      if (absDx <= 54) {
        out.triggerAction = Math.random() < 0.55 ? 'light1' : 'heavy';
        enemy.aiCooldown = 0.45 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp2.ceCost && absDx <= 165 && Math.random() < 0.5) {
        out.triggerAction = 'enemy_special_2'; // Anti-Gravity Crush
        enemy.aiCooldown = 0.9 * aggressionMul;
        return out;
      }
      if (enemy.ce >= sp1.ceCost) {
        out.triggerAction = 'enemy_special_1'; // Mini-Uzumaki
        enemy.aiCooldown = 0.82 * aggressionMul;
        return out;
      }
    }
    out.moveDir = absDx > 95 ? toward : 0;
    return out;
  }

  // 10. SORCERER OPPONENTS IN PRACTICE MODE (Gojo, Yuta, Megumi, Panda)
  if (
    enemy.id === 'gojo' ||
    enemy.id === 'yuta' ||
    enemy.id === 'megumi' ||
    enemy.id === 'panda'
  ) {
    const s1 = getEnemyMoveSpec(enemy.id, 'skill_1');
    const s2 = getEnemyMoveSpec(enemy.id, 'skill_2');
    const s3 = getEnemyMoveSpec(enemy.id, 'skill_3');
    const s5 = getEnemyMoveSpec(enemy.id, 'skill_5_domain');
    if (enemy.aiCooldown <= 0) {
      if (enemy.hp < enemy.maxHp * 0.65 && enemy.ce >= s5.ceCost && Math.random() < 0.35) {
        out.triggerAction = 'skill_5_domain';
        enemy.aiCooldown = 2.0 * aggressionMul;
        return out;
      }
      if (absDx <= 54) {
        const r = Math.random();
        out.triggerAction =
          enemy.id === 'panda' && enemy.ce >= s1.ceCost && r < 0.35
            ? 'skill_1'
            : r < 0.6
            ? 'light1'
            : 'heavy';
        enemy.aiCooldown = 0.48 * aggressionMul;
        return out;
      }
      if (enemy.ce >= s3.ceCost && absDx > 90 && Math.random() < 0.4) {
        out.triggerAction = 'skill_3';
        enemy.aiCooldown = 1.15 * aggressionMul;
        return out;
      }
      if (enemy.ce >= s2.ceCost && Math.random() < 0.45) {
        out.triggerAction = 'skill_2';
        enemy.aiCooldown = 0.9 * aggressionMul;
        return out;
      }
      if (enemy.ce >= s1.ceCost && Math.random() < 0.55) {
        out.triggerAction = 'skill_1';
        enemy.aiCooldown = 0.85 * aggressionMul;
        return out;
      }
    }
    if (absDx > 48) {
      out.moveDir = toward;
      if (absDx > 105 && Math.random() < 0.05) out.wantsDash = true;
    }
    return out;
  }

  // 11. RYOMEN SUKUNA: 3-Phase Boss
  const phase = enemy.bossPhase;
  const phaseCooldownScale = phase === 3 ? 0.56 : phase === 2 ? 0.74 : 0.92;

  if (enemy.aiCooldown <= 0) {
    if (phase === 3 && enemy.ce >= ult.ceCost && Math.random() < 0.42) {
      out.triggerAction = 'enemy_ultimate';
      enemy.aiCooldown = 1.25 * aggressionMul * phaseCooldownScale;
      return out;
    }

    if (absDx <= 54) {
      const r = Math.random();
      if (phase >= 2 && enemy.ce >= sp2.ceCost && r < 0.35) {
        out.triggerAction = 'enemy_special_2';
      } else {
        out.triggerAction = r < 0.58 ? 'light1' : 'heavy';
      }
      enemy.aiCooldown = 0.44 * aggressionMul * phaseCooldownScale;
      return out;
    }

    if (phase >= 2 && enemy.ce >= sp2.ceCost && absDx <= 155 && Math.random() < 0.45) {
      out.triggerAction = 'enemy_special_2';
      enemy.aiCooldown = 0.88 * aggressionMul * phaseCooldownScale;
      return out;
    }

    if (enemy.ce >= sp1.ceCost && Math.random() < 0.65) {
      out.triggerAction = 'enemy_special_1';
      enemy.aiCooldown = 0.76 * aggressionMul * phaseCooldownScale;
      return out;
    }
  }

  if (absDx > 46) {
    out.moveDir = toward;
    if (absDx > 95 && Math.random() < (phase >= 2 ? 0.075 : 0.04)) {
      out.wantsDash = true;
    }
  }
  return out;
}
