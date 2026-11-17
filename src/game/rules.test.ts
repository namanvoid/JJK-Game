import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoundScore,
  canChainAttack,
  clampStageX,
  computeBluePullVelocity,
  computeComboMultiplier,
  computeDynamicCamera,
  computeDynamicHitstun,
  computeSukunaPhase,
  getDomainVisualSpec,
  getEnemyMoveSpec,
  getPlayerMoveSpec,
  resolveHit,
} from './rules';
import { CHARACTER_PROFILES, PLAYABLE_LIST, PLAYABLE_SKILLS, STORY_STAGES, VILLAIN_LIST } from './roster';

test('All 14 characters are playable with 5 unique skills & cinematic Domain Expansion', () => {
  assert.equal(PLAYABLE_LIST.length, 14);
  for (const fighter of PLAYABLE_LIST) {
    assert.equal(PLAYABLE_SKILLS[fighter].length, 5);
    for (const slot of PLAYABLE_SKILLS[fighter]) {
      const spec = getPlayerMoveSpec(fighter, slot.action);
      assert.ok(spec, `Missing MoveSpec for ${fighter}.${slot.action}`);
    }
    const domain = getPlayerMoveSpec(fighter, 'skill_5_domain');
    assert.ok(domain && domain.isUnblockable && domain.damage >= 114, `Invalid Domain for ${fighter}`);
    const visual = getDomainVisualSpec(CHARACTER_PROFILES[fighter].domainTheme);
    assert.ok(visual.primaryColor && visual.tintOverlay && visual.scanlineAlpha > 0);
  }
});

test('Combo counter multiplier and dynamic hitstun scale with consecutive hits', () => {
  assert.equal(computeComboMultiplier(1), 1.0);
  assert.ok(computeComboMultiplier(5) > computeComboMultiplier(2));
  assert.equal(computeComboMultiplier(20), 1.65);

  const baseHitstun = 0.25;
  assert.ok(computeDynamicHitstun(baseHitstun, 3) > baseHitstun);
  assert.ok(computeDynamicHitstun(baseHitstun, 10) < baseHitstun);
});

test('Dynamic camera zooms in on close-range clashes and pulls back at distance', () => {
  const closeCam = computeDynamicCamera(220, 260, 232, 232, { zoom: 1.0, x: 240, y: 135 }, 0.5);
  assert.ok(closeCam.zoom > 1.15, 'Camera should zoom in during close clash');

  const farCam = computeDynamicCamera(80, 400, 232, 232, { zoom: 1.25, x: 240, y: 135 }, 0.5);
  assert.ok(farCam.zoom < 1.1, 'Camera should pull back when fighters separate');
});

test('Dedicated Parry stance negates damage and awards +22 CE', () => {
  const move = getPlayerMoveSpec('gojo', 'heavy')!;
  const res = resolveHit(
    { id: 'gojo', facing: 1, comboCount: 0, buffTimer: 0 },
    {
      id: 'yuta',
      action: 'parry',
      facing: -1,
      invulnTimer: 0,
      blockWindowTimer: 0,
      parryWindowTimer: 0.2,
      infinityTimer: 0,
      buffTimer: 0,
      superArmorActive: false,
    },
    move
  );
  assert.equal(res.parried, true);
  assert.equal(res.damage, 0);
  assert.equal(res.ceGainDefender, 22);
});

test('Combo multiplier increases damage on consecutive hits', () => {
  const move = getPlayerMoveSpec('yuta', 'light1')!;
  const firstHit = resolveHit(
    { id: 'yuta', facing: 1, comboCount: 0, buffTimer: 0 },
    {
      id: 'geto',
      action: 'idle',
      facing: -1,
      invulnTimer: 0,
      blockWindowTimer: 0,
      parryWindowTimer: 0,
      infinityTimer: 0,
      buffTimer: 0,
      superArmorActive: false,
    },
    move
  );
  const fifthHit = resolveHit(
    { id: 'yuta', facing: 1, comboCount: 4, buffTimer: 0 },
    {
      id: 'geto',
      action: 'idle',
      facing: -1,
      invulnTimer: 0,
      blockWindowTimer: 0,
      parryWindowTimer: 0,
      infinityTimer: 0,
      buffTimer: 0,
      superArmorActive: false,
    },
    move
  );
  assert.ok(fifthHit.damage > firstHit.damage);
});

test('All 14 fighters work as AI opponents & 10-stage Story Ladder stays intact', () => {
  assert.equal(VILLAIN_LIST.length, 10);
  assert.equal(STORY_STAGES.length, 10);
  for (const f of PLAYABLE_LIST) {
    assert.ok(getEnemyMoveSpec(f, 'enemy_special_1').damage > 0);
    assert.ok(getEnemyMoveSpec(f, 'enemy_special_2').damage > 0);
    assert.ok(getEnemyMoveSpec(f, 'enemy_ultimate').damage >= 38);
  }
});

test('Core chains, Toji Infinity piercing, Sukuna 3 phases, and Blue pull work cleanly', () => {
  assert.equal(canChainAttack('gojo', 'light1', 'light2'), true);
  assert.equal(canChainAttack('yuta', 'heavy', 'skill_3'), true);
  assert.equal(computeSukunaPhase(460, 460), 1);
  assert.equal(computeSukunaPhase(290, 460), 2);
  assert.equal(computeSukunaPhase(140, 460), 3);

  const tojiSpear = getEnemyMoveSpec('toji', 'enemy_special_1');
  const pierced = resolveHit(
    { id: 'toji', facing: -1, comboCount: 0, buffTimer: 0 },
    {
      id: 'gojo',
      action: 'idle',
      facing: 1,
      invulnTimer: 0,
      blockWindowTimer: 0,
      parryWindowTimer: 0,
      infinityTimer: 2.0,
      buffTimer: 0,
      superArmorActive: false,
    },
    tojiSpear
  );
  assert.equal(pierced.infinityBlocked, false);
  assert.equal(pierced.damage, tojiSpear.damage);

  const pull = computeBluePullVelocity(200, 180, 260, 180);
  assert.ok(pull.vx < 0);
  assert.equal(clampStageX(-50), 24);
  assert.ok(calculateRoundScore({ remainingHp: 150, maxHp: 300, maxCombo: 5, timeRemaining: 40, stageNumber: 1 }) > 0);
});
