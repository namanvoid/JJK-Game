import { decideVillainAi } from './ai';
import { audioEngine } from './audio';
import { RenderFrameState } from './canvasRenderer';
import { ARENA_PROFILES, CHARACTER_PROFILES, PLAYABLE_SKILLS, STORY_STAGES } from './roster';
import {
  CameraState,
  calculateRoundScore,
  canChainAttack,
  clampStageX,
  computeBluePullVelocity,
  computeComboMultiplier,
  computeDynamicCamera,
  computeSukunaPhase,
  getDifficultyDamageMultiplier,
  getEnemyMoveSpec,
  getPlayerMoveSpec,
  resolveHit,
} from './rules';
import {
  Afterimage,
  ArenaId,
  DomainTheme,
  FighterAction,
  FighterId,
  FighterState,
  FloatingCallout,
  GROUND_Y,
  GameMode,
  GameScreenState,
  GameSettings,
  GroundHazard,
  HudSnapshot,
  InputState,
  MoveSpec,
  Particle,
  Projectile,
  RoundPhase,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './types';

const GRAVITY = 720;
const ROUND_DURATION = 99;

function createFighter(id: FighterId, isPlayer: boolean, x: number): FighterState {
  const prof = CHARACTER_PROFILES[id];
  return {
    id,
    name: prof.name,
    title: prof.title,
    isPlayer,
    x,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: isPlayer ? 1 : -1,
    hp: prof.maxHp,
    maxHp: prof.maxHp,
    ghostHp: prof.maxHp,
    ce: isPlayer ? 50 : 40,
    maxCe: 100,
    action: 'idle',
    actionTimer: 0,
    actionHitApplied: false,
    hitstunTimer: 0,
    invulnTimer: 0,
    blockWindowTimer: 0,
    parryWindowTimer: 0,
    infinityTimer: 0,
    buffTimer: 0,
    flashTimer: 0,
    parryFlashTimer: 0,
    comboCount: 0,
    comboResetTimer: 0,
    bufferedAction: null,
    bufferTimer: 0,
    walkDist: 0,
    scaleX: 1,
    scaleY: 1,
    bossPhase: 1,
    superArmorActive: false,
    stunLockedTimer: 0,
    aiCooldown: 1.05,
    aiStateTimer: 0,
    aiIntent: 'approach',
  };
}

export class CursedClashEngine {
  public screenState: GameScreenState = 'title';
  public mode: GameMode = 'story';
  public stageIndex = 0;
  public arenaId: ArenaId = 'shibuya';
  public playerId: FighterId = 'gojo';
  public enemyId: FighterId = 'jogo';
  public settings: GameSettings = {
    difficulty: 'special',
    musicVolume: 0.45,
    sfxVolume: 0.7,
    screenShake: true,
    practiceAutoCe: false,
    practiceAiActive: true,
  };

  public roundNumber = 1;
  public roundPhase: RoundPhase = 'intro';
  public phaseTimer = 1.6;
  public roundTimer = ROUND_DURATION;
  public playerRounds = 0;
  public enemyRounds = 0;
  public score = 0;
  public maxCombo = 0;
  public damageDealt = 0;
  public matchTime = 0;
  public winner: 'player' | 'enemy' | null = null;
  public storyComplete = false;
  public bannerText = 'ROUND 1';
  public bannerSubtext = 'CURSED CLASH';

  public domainActive: DomainTheme = 'none';
  public domainTimer = 0;
  public domainBanner = '';
  public domainCinematicTimer = 0;
  public domainCinematicMax = 0.95;
  public domainCasterId: FighterId | null = null;
  public domainTitle = '';
  public shrineSlashTimer = 0;

  public timeSec = 0;
  private hitstopTimer = 0;
  private trauma = 0;
  private screenFlashAlpha = 0;
  private screenFlashColor = '#ffffff';
  private afterimageSpawnTimer = 0;
  private camera: CameraState = { zoom: 1, x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 };

  public player: FighterState = createFighter('gojo', true, 140);
  public enemy: FighterState = createFighter('jogo', false, 340);

  // Zero-GC pooled buffers
  private projectiles: Projectile[] = Array.from({ length: 28 }, () => ({
    active: false,
    owner: 'player',
    kind: 'blue',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 8,
    damage: 0,
    chipDamage: 0,
    knockbackX: 0,
    knockbackY: 0,
    life: 0,
    maxLife: 1,
    hitTickTimer: 0,
    piercesInfinity: false,
    pullsEnemy: false,
    stunsTarget: false,
    unblockable: false,
    hitsRemaining: 1,
  }));
  private projIdx = 0;

  private hazards: GroundHazard[] = Array.from({ length: 20 }, () => ({
    active: false,
    owner: 'enemy',
    kind: 'jogo_geyser',
    x: 0,
    y: GROUND_Y,
    width: 28,
    telegraphTimer: 0,
    activeTimer: 0,
    damage: 0,
    knockbackX: 0,
    knockbackY: 0,
    hitApplied: false,
  }));
  private hazIdx = 0;

  private particles: Particle[] = Array.from({ length: 256 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 2,
    color: '#ffffff',
    life: 0,
    maxLife: 0.4,
    gravity: 0,
    glow: false,
  }));
  private partIdx = 0;

  private afterimages: Afterimage[] = Array.from({ length: 24 }, () => ({
    active: false,
    fighterId: 'gojo',
    action: 'dash',
    x: 0,
    y: GROUND_Y,
    facing: 1,
    alpha: 0,
    tint: '#38bdf8',
  }));
  private aiIdx = 0;

  private callouts: FloatingCallout[] = Array.from({ length: 16 }, () => ({
    active: false,
    text: '',
    x: 0,
    y: 0,
    vy: -20,
    color: '#ffffff',
    life: 0,
    maxLife: 0.8,
  }));
  private callIdx = 0;

  public startTitleBackdrop(heroId?: FighterId): void {
    if (heroId) this.playerId = heroId;
    this.screenState = 'title';
    this.arenaId = 'shibuya';
    this.player = createFighter(this.playerId, true, 165);
    const backdropEnemy: FighterId = this.playerId === 'sukuna' ? 'gojo' : 'sukuna';
    this.enemy = createFighter(backdropEnemy, false, 315);
    this.domainActive = 'none';
    this.camera = { zoom: 1, x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 };
    this.clearPools();
    document.body.dataset.state = 'title';
  }

  public setTitleHero(heroId: FighterId): void {
    this.playerId = heroId;
    if (this.screenState === 'title') {
      this.player = createFighter(heroId, true, 165);
      const backdropEnemy: FighterId = heroId === 'sukuna' ? 'gojo' : 'sukuna';
      this.enemy = createFighter(backdropEnemy, false, 315);
    }
  }

  public startStoryMode(stageIdx = 0, heroId?: FighterId): void {
    if (heroId) this.playerId = heroId;
    this.mode = 'story';
    this.stageIndex = Math.max(0, Math.min(STORY_STAGES.length - 1, stageIdx));
    if (stageIdx === 0) {
      this.score = 0;
      this.maxCombo = 0;
      this.damageDealt = 0;
      this.matchTime = 0;
    }
    const stage = STORY_STAGES[this.stageIndex];
    this.storyComplete = false;
    this.initMatch(stage.opponentId, stage.arenaId, stage.preFightLine);
  }

  public startPracticeMode(
    heroId: FighterId,
    opponentId: FighterId,
    arenaId: ArenaId
  ): void {
    this.playerId = heroId;
    this.mode = 'practice';
    this.score = 0;
    this.maxCombo = 0;
    this.damageDealt = 0;
    this.matchTime = 0;
    this.storyComplete = false;
    const heroName = CHARACTER_PROFILES[heroId].name;
    this.initMatch(opponentId, arenaId, `Practice Arena — Master ${heroName}`);
  }

  private initMatch(opponentId: FighterId, arenaId: ArenaId, subtitle: string): void {
    this.enemyId = opponentId;
    this.arenaId = arenaId;
    this.roundNumber = 1;
    this.playerRounds = 0;
    this.enemyRounds = 0;
    this.winner = null;
    this.screenState = 'playing';
    document.body.dataset.state = 'playing';
    this.resetRound(subtitle);
    audioEngine.startMusic(ARENA_PROFILES[arenaId].musicTheme);
  }

  private resetRound(subtitle?: string): void {
    this.clearPools();
    this.player = createFighter(this.playerId, true, 130);
    this.enemy = createFighter(this.enemyId, false, 350);
    this.roundPhase = 'intro';
    this.phaseTimer = 1.65;
    this.roundTimer = ROUND_DURATION;
    this.domainActive = 'none';
    this.domainTimer = 0;
    this.domainBanner = '';
    this.domainCinematicTimer = 0;
    this.domainCasterId = null;
    this.domainTitle = '';
    this.hitstopTimer = 0;
    this.trauma = 0;
    this.screenFlashAlpha = 0;
    this.camera = { zoom: 1, x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 };
    this.bannerText = this.mode === 'practice' ? 'PRACTICE' : `ROUND ${this.roundNumber}`;
    this.bannerSubtext = subtitle || `${this.player.name} VS ${this.enemy.name}`;
    audioEngine.playSfx('round_start');
  }

  private clearPools(): void {
    for (const p of this.projectiles) p.active = false;
    for (const h of this.hazards) h.active = false;
    for (const pt of this.particles) pt.active = false;
    for (const a of this.afterimages) a.active = false;
    for (const c of this.callouts) c.active = false;
  }

  public setPaused(paused: boolean): void {
    if (this.screenState !== 'playing' && this.screenState !== 'paused') return;
    this.screenState = paused ? 'paused' : 'playing';
    document.body.dataset.state = this.screenState;
    if (paused) {
      audioEngine.stopMusic();
    } else {
      audioEngine.startMusic(ARENA_PROFILES[this.arenaId].musicTheme);
    }
  }

  public step(rawDt: number, input: InputState): void {
    const dt = Math.min(rawDt, 0.05);
    this.timeSec += dt;

    // Decay trauma & flash in real time
    this.trauma = Math.max(0, this.trauma - dt * 2.2);
    this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 2.8);

    if (this.screenState === 'title') {
      this.player.y = GROUND_Y;
      this.enemy.y = GROUND_Y;
      this.spawnAmbientTitleSparks(dt);
      this.updateParticles(dt);
      return;
    }

    if (this.screenState !== 'playing') {
      return;
    }

    // Dynamic Camera smoothly tracks distance between fighters
    this.camera = computeDynamicCamera(
      this.player.x,
      this.enemy.x,
      this.player.y,
      this.enemy.y,
      this.camera,
      dt
    );

    // Dramatic Domain Expansion Cut-In Sequence!
    if (this.domainCinematicTimer > 0) {
      this.domainCinematicTimer = Math.max(0, this.domainCinematicTimer - dt);
      const caster = this.domainCasterId === this.enemy.id ? this.enemy : this.player;
      this.camera.zoom += (1.28 - this.camera.zoom) * Math.min(1, dt * 8);
      this.camera.x += (caster.x - this.camera.x) * Math.min(1, dt * 8);
      this.updateParticles(dt);
      return;
    }

    // Hitstop freeze frames (world pauses while shake/flashes continue!)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.player.flashTimer = Math.max(0, this.player.flashTimer - dt);
      this.enemy.flashTimer = Math.max(0, this.enemy.flashTimer - dt);
      return;
    }

    // Round phases
    if (this.roundPhase === 'intro') {
      this.phaseTimer -= dt;
      if (this.phaseTimer < 0.55) {
        this.bannerText = 'FIGHT!';
        this.bannerSubtext = '';
      }
      if (this.phaseTimer <= 0) {
        this.roundPhase = 'fight';
        this.bannerText = '';
        this.bannerSubtext = '';
      }
      this.updateParticles(dt);
      return;
    }

    if (this.roundPhase === 'phase_transition') {
      this.phaseTimer -= dt;
      this.updateParticles(dt);
      if (this.phaseTimer <= 0) {
        this.roundPhase = 'fight';
        this.bannerText = '';
        this.bannerSubtext = '';
      }
      return;
    }

    if (this.roundPhase === 'round_end') {
      this.phaseTimer -= dt;
      this.updatePhysicsOnly(this.player, dt);
      this.updatePhysicsOnly(this.enemy, dt);
      this.updateParticles(dt);
      this.updateCallouts(dt);
      if (this.phaseTimer <= 0) {
        this.advanceAfterRound();
      }
      return;
    }

    if (this.roundPhase === 'match_end') {
      this.updateParticles(dt);
      return;
    }

    // Active Fight!
    this.matchTime += dt;
    if (this.mode !== 'practice') {
      this.roundTimer = Math.max(0, this.roundTimer - dt);
    }

    // Passive Cursed Energy regeneration
    const ceRegen = this.mode === 'practice' && this.settings.practiceAutoCe ? 28 : 4.2;
    this.player.ce = Math.min(this.player.maxCe, this.player.ce + ceRegen * dt);
    this.enemy.ce = Math.min(
      this.enemy.maxCe,
      this.enemy.ce + (this.enemy.id === 'sukuna' ? 7.5 : 5.2) * dt
    );

    // Domain timers
    if (this.domainTimer > 0) {
      this.domainTimer -= dt;
      if (this.domainTimer <= 0) {
        this.domainActive = 'none';
        this.domainBanner = '';
      }
    }

    // Sukuna Phase 3 Malevolent Shrine periodic slash hazards
    if (
      this.enemy.id === 'sukuna' &&
      this.enemy.bossPhase === 3 &&
      this.domainActive === 'malevolent_shrine'
    ) {
      this.shrineSlashTimer -= dt;
      if (this.shrineSlashTimer <= 0) {
        this.shrineSlashTimer = 1.65;
        this.spawnHazard({
          owner: 'enemy',
          kind: 'shrine_slash',
          x: clampStageX(this.player.x + (Math.random() - 0.5) * 32),
          width: 34,
          telegraph: 0.52,
          active: 0.22,
          damage: Math.round(18 * getDifficultyDamageMultiplier(this.settings.difficulty)),
          knockbackX: 85,
          knockbackY: -95,
        });
      }
    }

    // Update facing when idle/walking
    this.updateFacing(this.player, this.enemy);
    this.updateFacing(this.enemy, this.player);

    // Handle Player Input
    this.handlePlayerInput(input, dt);

    // Handle Villain AI
    if (this.mode !== 'practice' || this.settings.practiceAiActive) {
      const threatClose = this.isThreatNearFighter(this.enemy, 'player');
      const ai = decideVillainAi(
        this.enemy,
        this.player,
        dt,
        this.settings.difficulty,
        threatClose
      );
      this.applyAiInput(this.enemy, ai);
    }

    // Update both fighters
    this.updateFighter(this.player, this.enemy, dt);
    this.updateFighter(this.enemy, this.player, dt);

    // Pushbox separation
    this.resolvePushbox();

    // Update projectiles & ground hazards
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateParticles(dt);
    this.updateAfterimages(dt);
    this.updateCallouts(dt);

    // Check Sukuna 3-phase transitions
    if (this.enemy.id === 'sukuna' && this.enemy.hp > 0) {
      const nextPhase = computeSukunaPhase(this.enemy.hp, this.enemy.maxHp);
      if (nextPhase > this.enemy.bossPhase) {
        this.triggerSukunaPhaseTransition(nextPhase);
      }
    }

    // Practice mode auto-revive fighters if KO'd
    if (this.mode === 'practice') {
      if (this.enemy.hp <= 0) {
        this.enemy.hp = this.enemy.maxHp;
        this.enemy.ghostHp = this.enemy.maxHp;
        this.spawnCallout('RESET HP', this.enemy.x, this.enemy.y - 54, '#38bdf8');
      }
      if (this.player.hp <= 0) {
        this.player.hp = this.player.maxHp;
        this.player.ghostHp = this.player.maxHp;
        this.spawnCallout('RESET HP', this.player.x, this.player.y - 54, '#38bdf8');
      }
    }

    // Check Round KO / Timeout
    if (this.mode !== 'practice') {
      if (this.enemy.hp <= 0 || this.player.hp <= 0 || this.roundTimer <= 0) {
        this.finishRound();
      }
    }
  }

  private updateFacing(f: FighterState, other: FighterState): void {
    if (f.action === 'idle' || f.action === 'walk' || f.action === 'block' || f.action === 'jump') {
      f.facing = other.x >= f.x ? 1 : -1;
    }
  }

  private handlePlayerInput(input: InputState, dt: number): void {
    const p = this.player;
    if (p.hitstunTimer > 0 || p.stunLockedTimer > 0 || p.action === 'ko') return;

    const prof = CHARACTER_PROFILES[p.id];
    const airborne = p.y < GROUND_Y - 1;
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    // Input buffer expiration
    if (p.bufferTimer > 0) {
      p.bufferTimer = Math.max(0, p.bufferTimer - dt);
      if (p.bufferTimer <= 0) p.bufferedAction = null;
    }

    // Dedicated Parry stance (Q or F)
    if (
      input.justParry &&
      (p.action === 'idle' || p.action === 'walk' || p.action === 'block' || p.action === 'jump')
    ) {
      p.action = 'parry';
      p.actionTimer = 0;
      p.parryWindowTimer = 0.24;
      if (!airborne) p.vx = 0;
      p.scaleX = 0.9;
      p.scaleY = 1.08;
      audioEngine.playSfx('block');
      return;
    }

    // Map pressed special/attack buttons
    const canCast = (act: FighterAction) => {
      const s = getPlayerMoveSpec(p.id, act);
      return !!s && p.ce >= s.ceCost;
    };

    let requested: FighterAction | null = null;
    if (input.justSkill5 && canCast('skill_5_domain')) {
      requested = 'skill_5_domain';
    } else if (input.justSkill3 && canCast('skill_3')) {
      requested = 'skill_3';
    } else if (input.justSkill2 && canCast('skill_2')) {
      requested = 'skill_2';
    } else if (input.justSkill1 && canCast('skill_1')) {
      requested = 'skill_1';
    } else if (
      input.justSkill4 &&
      canCast('skill_4') &&
      !(p.id === 'gojo' && p.infinityTimer > 0.2)
    ) {
      requested = 'skill_4';
    } else if (input.justHeavy) {
      requested = 'heavy';
    } else if (input.justLight) {
      if (p.action === 'light1') requested = 'light2';
      else if (p.action === 'light2') requested = 'light3';
      else requested = 'light1';
    }

    // Buffer attack or cancel chain mid-combo
    if (requested) {
      if (p.action === 'idle' || p.action === 'walk' || p.action === 'jump' || p.action === 'block') {
        this.startAction(p, requested);
        return;
      } else if (canChainAttack(p.id, p.action, requested)) {
        const spec = getPlayerMoveSpec(p.id, p.action);
        if (spec && p.actionTimer >= spec.startup + spec.active * 0.5) {
          this.startAction(p, requested);
          return;
        }
        p.bufferedAction = requested;
        p.bufferTimer = 0.14;
      } else {
        p.bufferedAction = requested;
        p.bufferTimer = 0.14;
      }
    }

    // Consume buffered action when returning to neutral
    if ((p.action === 'idle' || p.action === 'walk' || p.action === 'jump') && p.bufferedAction) {
      const act = p.bufferedAction;
      p.bufferedAction = null;
      p.bufferTimer = 0;
      this.startAction(p, act);
      return;
    }

    // Preserve horizontal air steering even during aerial attacks!
    if (airborne && p.action !== 'dash') {
      if (moveDir !== 0) {
        p.vx = moveDir * prof.speed * 0.96;
      } else {
        p.vx *= Math.pow(0.08, dt);
      }
    }

    const canMove = p.action === 'idle' || p.action === 'walk' || p.action === 'jump' || p.action === 'block';
    if (!canMove) return;

    // Sidestep / Dodge (Down / S)
    if (input.justDown && !airborne) {
      p.action = 'sidestep';
      p.actionTimer = 0;
      p.invulnTimer = 0.24;
      p.vx = 0;
      p.scaleX = 0.85;
      p.scaleY = 1.08;
      audioEngine.playSfx('dash');
      this.spawnAfterimage(p, prof.accentColor);
      return;
    }

    // Dash (Space)
    if (input.justDash) {
      const dir = input.left ? -1 : input.right ? 1 : p.facing;
      p.action = 'dash';
      p.actionTimer = 0;
      p.invulnTimer = 0.16;
      p.vx = dir * 290;
      p.scaleX = 1.18;
      p.scaleY = 0.88;
      audioEngine.playSfx('dash');
      this.spawnAfterimage(p, prof.accentColor);
      return;
    }

    // Block (L or Shift)
    if (input.block && !airborne) {
      if (p.action !== 'block') {
        p.action = 'block';
        p.blockWindowTimer = 0.16;
      }
      p.vx = 0;
      return;
    } else if (p.action === 'block') {
      p.action = 'idle';
    }

    // Jump (W / ArrowUp) — preserves/applies forward or backward air momentum!
    if (input.justUp && !airborne) {
      p.vy = prof.jumpForce;
      p.action = 'jump';
      p.vx = moveDir * prof.speed;
      p.scaleX = 0.84;
      p.scaleY = 1.18;
      audioEngine.playSfx('jump');
      return;
    }

    // Ground & Air horizontal movement
    if (airborne) {
      p.vx = moveDir !== 0 ? moveDir * prof.speed * 0.96 : 0;
    } else if (moveDir !== 0) {
      p.vx = moveDir * prof.speed;
      p.action = 'walk';
    } else {
      p.vx = 0;
      if (p.action === 'walk') p.action = 'idle';
    }
  }

  private applyAiInput(enemy: FighterState, ai: ReturnType<typeof decideVillainAi>): void {
    const prof = CHARACTER_PROFILES[enemy.id];
    const phaseSpeedMul = enemy.id === 'sukuna' && enemy.bossPhase >= 2 ? 1.18 : 1.0;

    if (ai.wantsParry && enemy.y >= GROUND_Y - 1) {
      enemy.action = 'parry';
      enemy.actionTimer = 0;
      enemy.parryWindowTimer = 0.22;
      enemy.vx = 0;
      return;
    }
    if (ai.triggerAction) {
      this.startAction(enemy, ai.triggerAction);
      return;
    }
    if (ai.wantsSidestep && enemy.y >= GROUND_Y - 1) {
      enemy.action = 'sidestep';
      enemy.actionTimer = 0;
      enemy.invulnTimer = 0.22;
      enemy.vx = 0;
      this.spawnAfterimage(enemy, prof.accentColor);
      return;
    }
    if (ai.wantsDash) {
      enemy.action = 'dash';
      enemy.actionTimer = 0;
      enemy.invulnTimer = 0.14;
      enemy.vx = enemy.facing * 255 * phaseSpeedMul;
      this.spawnAfterimage(enemy, prof.accentColor);
      return;
    }
    if (ai.wantsBlock && enemy.y >= GROUND_Y - 1) {
      if (enemy.action !== 'block') {
        enemy.action = 'block';
        enemy.blockWindowTimer = 0.1;
      }
      enemy.vx = 0;
      return;
    } else if (enemy.action === 'block') {
      enemy.action = 'idle';
    }

    if (ai.wantsJump && enemy.y >= GROUND_Y - 1) {
      enemy.vy = prof.jumpForce;
      enemy.action = 'jump';
    }

    if (enemy.action === 'idle' || enemy.action === 'walk' || enemy.action === 'jump') {
      enemy.vx = ai.moveDir * prof.speed * phaseSpeedMul;
      if (enemy.y >= GROUND_Y - 1) {
        enemy.action = ai.moveDir !== 0 ? 'walk' : 'idle';
      }
    }
  }

  private startAction(f: FighterState, action: FighterAction): void {
    const spec = f.isPlayer ? getPlayerMoveSpec(f.id, action) : getEnemyMoveSpec(f.id, action);
    if (!spec) return;
    if (f.ce < spec.ceCost) return;

    f.ce -= spec.ceCost;
    f.action = action;
    f.actionTimer = 0;
    f.actionHitApplied = false;
    f.superArmorActive = !!spec.superArmor;
    // Preserve airborne horizontal momentum while jumping!
    if (f.y >= GROUND_Y - 1) {
      f.vx = 0;
    }

    const prof = CHARACTER_PROFILES[f.id];
    const target = f.isPlayer ? this.enemy : this.player;

    // Signature 5-Skill Cast FX (works for both Player and Practice Sorcerer AI)
    if (action === 'skill_5_domain') {
      this.domainActive = prof.domainTheme;
      this.domainTimer = f.isPlayer ? 4.2 : 3.6;
      this.domainBanner = `DOMAIN EXPANSION: ${prof.domainName}`;
      this.domainCinematicMax = f.isPlayer ? 0.95 : 0.65;
      this.domainCinematicTimer = this.domainCinematicMax;
      this.domainCasterId = f.id;
      this.domainTitle = prof.domainName;
      this.screenFlashColor = prof.accentColor;
      this.screenFlashAlpha = f.isPlayer ? 0.65 : 0.55;
      this.trauma = f.isPlayer ? 0.85 : 0.72;
      audioEngine.playSfx(f.id === 'gojo' ? 'void' : f.id === 'sukuna' ? 'shrine' : 'domain');
      this.spawnBurst(f.x, f.y - 26, 32, prof.accentColor, 195);
      return;
    }

    if (
      action === 'skill_1' ||
      action === 'skill_2' ||
      action === 'skill_3' ||
      action === 'skill_4'
    ) {
      if (f.id === 'gojo') {
        if (action === 'skill_4') {
          f.infinityTimer = 3.6;
          audioEngine.playSfx('infinity');
          this.spawnBurst(f.x, f.y - 24, 14, '#38bdf8', 110);
          this.spawnCallout('INFINITY', f.x, f.y - 52, '#38bdf8');
        } else if (action === 'skill_3') {
          audioEngine.playSfx('purple');
          this.spawnBurst(f.x + f.facing * 14, f.y - 24, 18, '#c084fc', 90);
        } else if (action === 'skill_2') {
          audioEngine.playSfx('red');
        } else {
          audioEngine.playSfx('blue');
        }
      } else if (f.id === 'yuta') {
        if (action === 'skill_1') audioEngine.playSfx('katana');
        else if (action === 'skill_2') audioEngine.playSfx('void');
        else if (action === 'skill_3') audioEngine.playSfx('purple');
        else if (action === 'skill_4') {
          f.hp = Math.min(f.maxHp, f.hp + 48);
          audioEngine.playSfx('heal');
          this.spawnBurst(f.x, f.y - 26, 16, '#34d399', 100);
          this.spawnCallout('RCT +48 HP', f.x, f.y - 54, '#34d399');
        }
      } else if (f.id === 'megumi') {
        if (action === 'skill_1') audioEngine.playSfx('blade');
        else if (action === 'skill_2') audioEngine.playSfx('lightning');
        else if (action === 'skill_3') audioEngine.playSfx('heavy_hit');
        else if (action === 'skill_4') {
          f.invulnTimer = 0.45;
          f.vx = f.facing * 235;
          f.vy = -120;
          audioEngine.playSfx('dash');
          this.spawnBurst(f.x, f.y - 20, 14, '#e2e8f0', 115);
          this.spawnCallout('RABBIT ESCAPE', f.x, f.y - 52, '#e2e8f0');
        }
      } else if (f.id === 'panda') {
        if (action === 'skill_1' || action === 'skill_2') audioEngine.playSfx('drum');
        else if (action === 'skill_3') {
          f.vx = f.facing * 310;
          audioEngine.playSfx('heavy_hit');
          this.spawnAfterimage(f, '#fb923c');
        } else if (action === 'skill_4') {
          f.buffTimer = 5.5;
          audioEngine.playSfx('infinity');
          this.spawnBurst(f.x, f.y - 24, 16, '#a3e635', 110);
          this.spawnCallout('CORE GUARD', f.x, f.y - 54, '#a3e635');
        }
      } else if (f.id === 'jogo') {
        audioEngine.playSfx('fire');
        if (action === 'skill_4') {
          f.invulnTimer = 0.35;
          this.spawnBurst(f.x, f.y - 24, 18, '#f97316', 145);
          this.spawnCallout('MAGMA BURST', f.x, f.y - 52, '#fb923c');
        }
      } else if (f.id === 'mahito') {
        if (action === 'skill_4') {
          f.invulnTimer = 0.42;
          f.vx = f.facing * 245;
          audioEngine.playSfx('dash');
          this.spawnAfterimage(f, '#c084fc');
          this.spawnCallout('POLYMORPH', f.x, f.y - 52, '#e879f9');
        } else {
          audioEngine.playSfx('blade');
        }
      } else if (f.id === 'hanami') {
        audioEngine.playSfx('roots');
        if (action === 'skill_4') {
          f.buffTimer = 5.5;
          this.spawnBurst(f.x, f.y - 24, 16, '#4ade80', 110);
          this.spawnCallout('BARK ARMOR', f.x, f.y - 54, '#4ade80');
        }
      } else if (f.id === 'choso') {
        audioEngine.playSfx('blood');
        if (action === 'skill_4') {
          f.buffTimer = 5.5;
          this.spawnBurst(f.x, f.y - 24, 16, '#ef4444', 115);
          this.spawnCallout('RED SCALE', f.x, f.y - 54, '#fb7185');
        }
      } else if (f.id === 'geto') {
        audioEngine.playSfx(action === 'skill_2' ? 'heavy_hit' : 'slash');
        if (action === 'skill_4') {
          f.invulnTimer = 0.52;
          this.spawnBurst(f.x, f.y - 24, 16, '#a78bfa', 115);
          this.spawnCallout('SQUID BARRIER', f.x, f.y - 52, '#c4b5fd');
        }
      } else if (f.id === 'uraume') {
        audioEngine.playSfx('ice');
        if (action === 'skill_4') {
          f.invulnTimer = 0.48;
          this.spawnBurst(f.x, f.y - 24, 16, '#67e8f9', 115);
          this.spawnCallout('MIST GUARD', f.x, f.y - 52, '#a5f3fc');
        }
      } else if (f.id === 'kashimo') {
        audioEngine.playSfx('lightning');
        if (action === 'skill_2') {
          f.vx = f.facing * 245;
          this.spawnAfterimage(f, '#22d3ee');
        } else if (action === 'skill_4') {
          f.buffTimer = 5.5;
          this.spawnBurst(f.x, f.y - 24, 18, '#22d3ee', 135);
          this.spawnCallout('AMBER BEAST', f.x, f.y - 54, '#38bdf8');
        }
      } else if (f.id === 'toji') {
        if (action === 'skill_4') {
          f.invulnTimer = 0.42;
          this.spawnAfterimage(f, '#94a3b8');
          const offset = target.x >= f.x ? 34 : -34;
          f.x = clampStageX(target.x + offset);
          f.facing = target.x >= f.x ? 1 : -1;
          audioEngine.playSfx('dash');
          this.spawnBurst(f.x, f.y - 24, 14, '#e2e8f0', 120);
          this.spawnCallout('SHADOW STEP', f.x, f.y - 52, '#e2e8f0');
        } else {
          if (action === 'skill_1') f.vx = f.facing * 235;
          audioEngine.playSfx('blade');
        }
      } else if (f.id === 'kenjaku') {
        audioEngine.playSfx('slash');
        if (action === 'skill_4') {
          f.invulnTimer = 0.45;
          f.buffTimer = 4.5;
          this.spawnBurst(f.x, f.y - 24, 16, '#c084fc', 120);
          this.spawnCallout('OPEN BARRIER', f.x, f.y - 54, '#c084fc');
        }
      } else if (f.id === 'sukuna') {
        audioEngine.playSfx(action === 'skill_3' ? 'fire' : 'slash');
      }
      return;
    }

    // Villain AI Signature Cast FX (enemy_special_1 / 2 / enemy_ultimate)
    if (action === 'enemy_ultimate') {
      this.domainActive = prof.domainTheme;
      this.domainTimer = f.id === 'sukuna' ? 4.5 : 3.6;
      this.domainBanner = `DOMAIN EXPANSION: ${prof.domainName}`;
      this.domainCinematicMax = 0.65;
      this.domainCinematicTimer = 0.65;
      this.domainCasterId = f.id;
      this.domainTitle = prof.domainName;
      this.screenFlashColor = prof.accentColor;
      this.screenFlashAlpha = 0.55;
      this.trauma = 0.72;
      audioEngine.playSfx(f.id === 'sukuna' ? 'shrine' : 'domain');
      this.spawnBurst(f.x, f.y - 26, 26, prof.accentColor, 175);
    } else if (action === 'enemy_special_1' || action === 'enemy_special_2') {
      if (f.id === 'jogo') audioEngine.playSfx('fire');
      else if (f.id === 'choso') audioEngine.playSfx('blood');
      else if (f.id === 'hanami') audioEngine.playSfx('roots');
      else if (f.id === 'uraume') audioEngine.playSfx('ice');
      else if (f.id === 'kashimo') audioEngine.playSfx('lightning');
      else if (f.id === 'toji' || f.id === 'mahito') audioEngine.playSfx('blade');
      else audioEngine.playSfx('slash');
    }
  }

  private updateFighter(f: FighterState, other: FighterState, dt: number): void {
    f.flashTimer = Math.max(0, f.flashTimer - dt);
    f.parryFlashTimer = Math.max(0, f.parryFlashTimer - dt);
    f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    f.blockWindowTimer = Math.max(0, f.blockWindowTimer - dt);
    f.parryWindowTimer = Math.max(0, f.parryWindowTimer - dt);
    f.infinityTimer = Math.max(0, f.infinityTimer - dt);
    f.buffTimer = Math.max(0, f.buffTimer - dt);
    f.stunLockedTimer = Math.max(0, f.stunLockedTimer - dt);

    if (f.ghostHp > f.hp) {
      f.ghostHp = Math.max(f.hp, f.ghostHp - 65 * dt);
    }

    if (f.comboResetTimer > 0) {
      f.comboResetTimer -= dt;
      if (f.comboResetTimer <= 0) f.comboCount = 0;
    }

    f.scaleX += (1 - f.scaleX) * Math.min(1, dt * 14);
    f.scaleY += (1 - f.scaleY) * Math.min(1, dt * 14);

    if (f.stunLockedTimer > 0) {
      f.vx *= Math.pow(0.05, dt);
      this.updatePhysicsOnly(f, dt);
      return;
    }

    if (f.hitstunTimer > 0) {
      f.hitstunTimer -= dt;
      f.vx *= Math.pow(0.08, dt);
      this.updatePhysicsOnly(f, dt);
      if (f.hitstunTimer <= 0 && f.hp > 0) {
        f.action = f.y < GROUND_Y - 1 ? 'jump' : 'idle';
      }
      return;
    }

    if (f.action === 'dash') {
      f.actionTimer += dt;
      this.afterimageSpawnTimer += dt;
      if (this.afterimageSpawnTimer > 0.05) {
        this.afterimageSpawnTimer = 0;
        this.spawnAfterimage(f, CHARACTER_PROFILES[f.id].accentColor);
      }
      if (f.actionTimer >= 0.22) {
        f.vx = 0;
        f.action = f.y < GROUND_Y - 1 ? 'jump' : 'idle';
      }
    } else if (f.action === 'sidestep') {
      f.actionTimer += dt;
      if (f.actionTimer >= 0.28) {
        f.action = 'idle';
      }
    } else if (f.action === 'parry') {
      f.actionTimer += dt;
      if (f.actionTimer >= 0.3) {
        f.parryWindowTimer = 0;
        f.action = f.y < GROUND_Y - 1 ? 'jump' : 'idle';
      }
    } else if (
      f.action !== 'idle' &&
      f.action !== 'walk' &&
      f.action !== 'jump' &&
      f.action !== 'block' &&
      f.action !== 'ko' &&
      f.action !== 'victory'
    ) {
      const spec = f.isPlayer
        ? getPlayerMoveSpec(f.id, f.action)
        : getEnemyMoveSpec(f.id, f.action);
      if (spec) {
        f.actionTimer += dt;

        // Slight forward lunge on ground melee attacks
        if (
          !spec.isProjectile &&
          f.y >= GROUND_Y - 1 &&
          f.actionTimer >= spec.startup * 0.7 &&
          f.actionTimer <= spec.startup + spec.active
        ) {
          if (!f.actionHitApplied) {
            f.x = clampStageX(f.x + f.facing * (f.action === 'skill_3' && f.id === 'panda' ? 190 : 65) * dt);
          }
        }

        if (!f.actionHitApplied && f.actionTimer >= spec.startup) {
          f.actionHitApplied = true;
          this.executeMoveActiveFrame(f, other, spec);
        }

        if (f.actionTimer >= spec.startup + spec.active + spec.recovery) {
          f.superArmorActive = false;
          f.action = f.y < GROUND_Y - 1 ? 'jump' : 'idle';
        }
      } else {
        f.action = 'idle';
      }
    }

    this.updatePhysicsOnly(f, dt);
  }

  private executeMoveActiveFrame(f: FighterState, target: FighterState, spec: MoveSpec): void {
    const diffMul = f.isPlayer ? 1.0 : getDifficultyDamageMultiplier(this.settings.difficulty);
    const owner: 'player' | 'enemy' = f.isPlayer ? 'player' : 'enemy';

    // 1. ALL 14 FIGHTERS' TOP 5 SKILLS (usable by Player 1 & Practice Sorcerer AI)
    if (
      spec.id === 'skill_1' ||
      spec.id === 'skill_2' ||
      spec.id === 'skill_3' ||
      spec.id === 'skill_4' ||
      spec.id === 'skill_5_domain'
    ) {
      if (f.id === 'gojo') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'blue',
            x: f.x + f.facing * 26,
            y: f.y - 24,
            vx: f.facing * 140,
            vy: 0,
            radius: 13,
            damage: Math.round(14 * diffMul),
            chipDamage: Math.round(4 * diffMul),
            knockbackX: -85,
            knockbackY: -35,
            life: 1.35,
            piercesInfinity: false,
            pullsEnemy: true,
            hitsRemaining: 3,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnProjectile({
            owner,
            kind: 'red',
            x: f.x + f.facing * 24,
            y: f.y - 24,
            vx: f.facing * 285,
            vy: 0,
            radius: 11,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.15,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          this.trauma = Math.max(this.trauma, 0.35);
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'purple',
            x: f.x + f.facing * 32,
            y: f.y - 26,
            vx: f.facing * 255,
            vy: 0,
            radius: 24,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.5,
            piercesInfinity: true,
            pullsEnemy: false,
            hitsRemaining: 2,
          });
          this.trauma = Math.max(this.trauma, 0.72);
          this.screenFlashColor = '#c084fc';
          this.screenFlashAlpha = 0.38;
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.85;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          this.screenFlashColor = '#e0f2fe';
          this.screenFlashAlpha = 0.45;
          this.spawnBurst(target.x, target.y - 24, 34, '#e0f2fe', 215);
          this.spawnCallout('UNLIMITED VOID!', target.x, target.y - 58, '#7dd3fc');
          return;
        }
      } else if (f.id === 'yuta') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'rika_claw',
            x: f.x + f.facing * 26,
            y: f.y - 24,
            vx: f.facing * 240,
            vy: 0,
            radius: 14,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 0.45,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnProjectile({
            owner,
            kind: 'cursed_speech',
            x: f.x + f.facing * 24,
            y: f.y - 26,
            vx: f.facing * 260,
            vy: 0,
            radius: 13,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 0.75,
            piercesInfinity: false,
            pullsEnemy: false,
            stunsTarget: true,
            hitsRemaining: 1,
          });
          this.spawnCallout("DON'T MOVE!", f.x, f.y - 54, '#c084fc');
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'pure_love',
            x: f.x + f.facing * 32,
            y: f.y - 26,
            vx: f.facing * 270,
            vy: 0,
            radius: 22,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.4,
            piercesInfinity: true,
            pullsEnemy: false,
            hitsRemaining: 2,
          });
          this.trauma = Math.max(this.trauma, 0.65);
          this.screenFlashColor = '#f472b6';
          this.screenFlashAlpha = 0.35;
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.1;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.8);
          for (const [idx, offset] of [-42, -14, 14, 42].entries()) {
            this.spawnHazard({
              owner,
              kind: 'katana_rain',
              x: clampStageX(target.x + offset),
              width: 24,
              telegraph: 0.16 + idx * 0.08,
              active: 0.24,
              damage: Math.round(12 * diffMul),
              knockbackX: 80,
              knockbackY: -95,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 28, '#f472b6', 190);
          this.spawnCallout('MUTUAL LOVE!', target.x, target.y - 58, '#f472b6');
          return;
        }
      } else if (f.id === 'megumi') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'divine_dog',
            x: f.x + f.facing * 24,
            y: f.y - 20,
            vx: f.facing * 270,
            vy: 0,
            radius: 12,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 0.72,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnProjectile({
            owner,
            kind: 'nue_bolt',
            x: f.x + f.facing * 26,
            y: f.y - 30,
            vx: f.facing * 290,
            vy: 14,
            radius: 11,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 0.85,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'elephant_wave',
            x: f.x + f.facing * 28,
            y: f.y - 22,
            vx: f.facing * 235,
            vy: 0,
            radius: 18,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.2,
            piercesInfinity: false,
            pullsEnemy: false,
            unblockable: true,
            hitsRemaining: 1,
          });
          this.trauma = Math.max(this.trauma, 0.55);
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.1;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.8);
          for (const [idx, offset] of [-48, -16, 16, 48].entries()) {
            this.spawnHazard({
              owner,
              kind: 'shadow_spire',
              x: clampStageX(target.x + offset),
              width: 28,
              telegraph: 0.16 + idx * 0.08,
              active: 0.25,
              damage: Math.round(12 * diffMul),
              knockbackX: 85,
              knockbackY: -110,
            });
          }
          this.spawnBurst(target.x, target.y - 24, 28, '#818cf8', 190);
          this.spawnCallout('CHIMERA SHADOW!', target.x, target.y - 58, '#818cf8');
          return;
        }
      } else if (f.id === 'panda') {
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          f.buffTimer = 6.0;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-40, 0, 40].entries()) {
            this.spawnHazard({
              owner,
              kind: 'beast_pillar',
              x: clampStageX(target.x + offset),
              width: 30,
              telegraph: 0.16 + idx * 0.09,
              active: 0.25,
              damage: Math.round(14 * diffMul),
              knockbackX: 120,
              knockbackY: -120,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 30, '#fbbf24', 200);
          this.spawnCallout('THREE-CORE!', target.x, target.y - 58, '#fbbf24');
          return;
        }
      } else if (f.id === 'jogo') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'jogo_fireball',
            x: f.x + f.facing * 24,
            y: f.y - 24,
            vx: f.facing * 240,
            vy: 0,
            radius: 11,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.5,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnHazard({
            owner,
            kind: 'jogo_geyser',
            x: clampStageX(target.x),
            width: 34,
            telegraph: 0.24,
            active: 0.28,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          for (const vy of [-36, 0, 36]) {
            this.spawnProjectile({
              owner,
              kind: 'jogo_fireball',
              x: f.x + f.facing * 24,
              y: f.y - 26,
              vx: f.facing * 265,
              vy,
              radius: 10,
              damage: 24,
              chipDamage: 6,
              knockbackX: 135,
              knockbackY: -85,
              life: 1.35,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          return;
        }
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-44, 0, 44].entries()) {
            this.spawnHazard({
              owner,
              kind: 'jogo_geyser',
              x: clampStageX(target.x + offset),
              width: 34,
              telegraph: 0.16 + idx * 0.08,
              active: 0.26,
              damage: 14,
              knockbackX: 110,
              knockbackY: -120,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 32, '#f97316', 210);
          this.spawnCallout('IRON MOUNTAIN!', target.x, target.y - 58, '#fb923c');
          return;
        }
      } else if (f.id === 'mahito') {
        if (spec.id === 'skill_2') {
          this.spawnHazard({
            owner,
            kind: 'mahito_spike',
            x: clampStageX(target.x),
            width: 30,
            telegraph: 0.22,
            active: 0.26,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'kenjaku_uzumaki',
            x: f.x + f.facing * 28,
            y: f.y - 24,
            vx: f.facing * 260,
            vy: 0,
            radius: 18,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.35,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 2,
          });
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.4;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-44, 0, 44].entries()) {
            this.spawnHazard({
              owner,
              kind: 'mahito_spike',
              x: clampStageX(target.x + offset),
              width: 30,
              telegraph: 0.16 + idx * 0.08,
              active: 0.25,
              damage: 14,
              knockbackX: 95,
              knockbackY: -115,
            });
          }
          this.spawnBurst(target.x, target.y - 24, 30, '#c084fc', 200);
          this.spawnCallout('PERFECTION!', target.x, target.y - 58, '#d8b4fe');
          return;
        }
      } else if (f.id === 'hanami') {
        if (spec.id === 'skill_1') {
          this.spawnHazard({
            owner,
            kind: 'hanami_roots',
            x: clampStageX(target.x),
            width: 34,
            telegraph: 0.22,
            active: 0.28,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'hanami_beam',
            x: f.x + f.facing * 26,
            y: f.y - 24,
            vx: f.facing * 265,
            vy: 0,
            radius: 15,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.45,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 2,
          });
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-46, 0, 46].entries()) {
            this.spawnHazard({
              owner,
              kind: 'hanami_roots',
              x: clampStageX(target.x + offset),
              width: 34,
              telegraph: 0.16 + idx * 0.08,
              active: 0.26,
              damage: 14,
              knockbackX: 110,
              knockbackY: -120,
            });
          }
          this.spawnBurst(target.x, target.y - 24, 30, '#22c55e', 195);
          this.spawnCallout('SEA OF BRANCHES!', target.x, target.y - 58, '#4ade80');
          return;
        }
      } else if (f.id === 'choso') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'choso_piercing',
            x: f.x + f.facing * 28,
            y: f.y - 25,
            vx: f.facing * 340,
            vy: 0,
            radius: 10,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.25,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          for (const vy of [-30, 26]) {
            this.spawnProjectile({
              owner,
              kind: 'choso_orb',
              x: f.x + f.facing * 22,
              y: f.y - 26,
              vx: f.facing * 215,
              vy,
              radius: 9,
              damage: 22,
              chipDamage: 6,
              knockbackX: 105,
              knockbackY: -80,
              life: 1.35,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          return;
        }
        if (spec.id === 'skill_3') {
          for (const [idx, vy] of [-26, 0, 26].entries()) {
            this.spawnProjectile({
              owner,
              kind: 'choso_piercing',
              x: f.x + f.facing * (24 + idx * 8),
              y: f.y - 25,
              vx: f.facing * 320,
              vy,
              radius: 9,
              damage: 25,
              chipDamage: 7,
              knockbackX: 140,
              knockbackY: -80,
              life: 1.25,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.82);
          for (const vy of [-40, -14, 14, 40]) {
            this.spawnProjectile({
              owner,
              kind: 'choso_orb',
              x: f.x + f.facing * 24,
              y: f.y - 26,
              vx: f.facing * 255,
              vy,
              radius: 9,
              damage: 14,
              chipDamage: 5,
              knockbackX: 100,
              knockbackY: -80,
              life: 1.4,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 30, '#ef4444', 200);
          this.spawnCallout('BLOOD ECLIPSE!', target.x, target.y - 58, '#f87171');
          return;
        }
      } else if (f.id === 'geto') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'geto_swarm',
            x: f.x + f.facing * 24,
            y: f.y - 24,
            vx: f.facing * 245,
            vy: 0,
            radius: 13,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.4,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          for (const vy of [-24, 18]) {
            this.spawnProjectile({
              owner,
              kind: 'geto_swarm',
              x: f.x + f.facing * 26,
              y: f.y - 26,
              vx: f.facing * 260,
              vy,
              radius: 14,
              damage: 36,
              chipDamage: 10,
              knockbackX: 160,
              knockbackY: -90,
              life: 1.4,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          this.spawnProjectile({
            owner,
            kind: 'kenjaku_uzumaki',
            x: f.x + f.facing * 30,
            y: f.y - 26,
            vx: f.facing * 265,
            vy: 0,
            radius: 22,
            damage: 24,
            chipDamage: 10,
            knockbackX: 185,
            knockbackY: -120,
            life: 1.45,
            piercesInfinity: true,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          this.spawnBurst(target.x, target.y - 26, 30, '#a855f7', 200);
          this.spawnCallout('MAXIMUM UZUMAKI!', target.x, target.y - 58, '#c084fc');
          return;
        }
      } else if (f.id === 'uraume') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'uraume_ice',
            x: f.x + f.facing * 26,
            y: f.y - 24,
            vx: f.facing * 265,
            vy: 0,
            radius: 12,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.35,
            piercesInfinity: false,
            pullsEnemy: false,
            stunsTarget: true,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnHazard({
            owner,
            kind: 'ice_pillar',
            x: clampStageX(target.x),
            width: 32,
            telegraph: 0.22,
            active: 0.26,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'uraume_ice',
            x: f.x + f.facing * 28,
            y: f.y - 24,
            vx: f.facing * 330,
            vy: 0,
            radius: 16,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.3,
            piercesInfinity: false,
            pullsEnemy: false,
            unblockable: true,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.4;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-44, 0, 44].entries()) {
            this.spawnHazard({
              owner,
              kind: 'ice_pillar',
              x: clampStageX(target.x + offset),
              width: 30,
              telegraph: 0.16 + idx * 0.08,
              active: 0.26,
              damage: 14,
              knockbackX: 95,
              knockbackY: -120,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 30, '#67e8f9', 200);
          this.spawnCallout('ABSOLUTE ZERO!', target.x, target.y - 58, '#a5f3fc');
          return;
        }
      } else if (f.id === 'kashimo') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'kashimo_bolt',
            x: f.x + f.facing * 24,
            y: f.y - 26,
            vx: f.facing * 340,
            vy: 0,
            radius: 11,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.2,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnHazard({
            owner,
            kind: 'lightning_strike',
            x: clampStageX(target.x),
            width: 34,
            telegraph: 0.2,
            active: 0.25,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-48, -16, 16, 48].entries()) {
            this.spawnHazard({
              owner,
              kind: 'lightning_strike',
              x: clampStageX(target.x + offset),
              width: 28,
              telegraph: 0.14 + idx * 0.08,
              active: 0.24,
              damage: 13,
              knockbackX: 95,
              knockbackY: -115,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 30, '#22d3ee', 210);
          this.spawnCallout('THUNDERCLAP!', target.x, target.y - 58, '#facc15');
          return;
        }
      } else if (f.id === 'toji') {
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.88);
          for (const [idx, offset] of [-36, 0, 36].entries()) {
            this.spawnHazard({
              owner,
              kind: 'shrine_slash',
              x: clampStageX(target.x + offset),
              width: 30,
              telegraph: 0.12 + idx * 0.07,
              active: 0.22,
              damage: 14,
              knockbackX: 110,
              knockbackY: -110,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 32, '#e2e8f0', 215);
          this.spawnCallout('HEAVENLY ZERO!', target.x, target.y - 58, '#f8fafc');
          return;
        }
      } else if (f.id === 'kenjaku') {
        if (spec.id === 'skill_1') {
          this.spawnProjectile({
            owner,
            kind: 'kenjaku_uzumaki',
            x: f.x + f.facing * 26,
            y: f.y - 25,
            vx: f.facing * 260,
            vy: 0,
            radius: 15,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.4,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_2') {
          this.spawnHazard({
            owner,
            kind: 'gravity_crush',
            x: clampStageX(target.x),
            width: 38,
            telegraph: 0.22,
            active: 0.28,
            damage: spec.damage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
          });
          return;
        }
        if (spec.id === 'skill_3') {
          for (const vy of [-26, 22]) {
            this.spawnProjectile({
              owner,
              kind: 'geto_swarm',
              x: f.x + f.facing * 24,
              y: f.y - 26,
              vx: f.facing * 240,
              vy,
              radius: 13,
              damage: 24,
              chipDamage: 6,
              knockbackX: 110,
              knockbackY: -80,
              life: 1.4,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          this.spawnProjectile({
            owner,
            kind: 'kenjaku_uzumaki',
            x: f.x + f.facing * 30,
            y: f.y - 24,
            vx: f.facing * 270,
            vy: 0,
            radius: 17,
            damage: 34,
            chipDamage: 10,
            knockbackX: 180,
            knockbackY: -120,
            life: 1.4,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
        if (spec.id === 'skill_4') return;
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.15;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.85);
          for (const [idx, offset] of [-44, 0, 44].entries()) {
            this.spawnHazard({
              owner,
              kind: 'gravity_crush',
              x: clampStageX(target.x + offset),
              width: 36,
              telegraph: 0.16 + idx * 0.08,
              active: 0.26,
              damage: 14,
              knockbackX: 105,
              knockbackY: -125,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 30, '#c084fc', 200);
          this.spawnCallout('WOMB PROFUSION!', target.x, target.y - 58, '#d8b4fe');
          return;
        }
      } else if (f.id === 'sukuna') {
        if (spec.id === 'skill_1') {
          for (const vy of [0, -18]) {
            this.spawnProjectile({
              owner,
              kind: 'sukuna_dismantle',
              x: f.x + f.facing * 26,
              y: f.y - (vy === 0 ? 24 : 34),
              vx: f.facing * 290,
              vy,
              radius: 14,
              damage: vy === 0 ? spec.damage : 14,
              chipDamage: vy === 0 ? spec.chipDamage : 4,
              knockbackX: spec.knockbackX,
              knockbackY: spec.knockbackY,
              life: 1.35,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
          return;
        }
        if (spec.id === 'skill_3') {
          this.spawnProjectile({
            owner,
            kind: 'sukuna_flame',
            x: f.x + f.facing * 28,
            y: f.y - 26,
            vx: f.facing * 295,
            vy: 0,
            radius: 19,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.45,
            piercesInfinity: true,
            pullsEnemy: false,
            hitsRemaining: 2,
          });
          this.trauma = Math.max(this.trauma, 0.68);
          this.screenFlashColor = '#f97316';
          this.screenFlashAlpha = 0.35;
          return;
        }
        if (spec.id === 'skill_4') {
          this.spawnProjectile({
            owner,
            kind: 'sukuna_dismantle',
            x: f.x + f.facing * 28,
            y: f.y - 25,
            vx: f.facing * 355,
            vy: 0,
            radius: 18,
            damage: spec.damage,
            chipDamage: spec.chipDamage,
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.35,
            piercesInfinity: true,
            pullsEnemy: false,
            unblockable: true,
            hitsRemaining: 1,
          });
          this.spawnCallout('WORLD SLASH!', f.x, f.y - 54, '#fca5a5');
          return;
        }
        if (spec.id === 'skill_5_domain') {
          target.stunLockedTimer = 1.25;
          this.applyHitToTarget(f, target, spec, diffMul);
          this.trauma = Math.max(this.trauma, 0.92);
          for (const [idx, offset] of [-48, -16, 16, 48].entries()) {
            this.spawnHazard({
              owner,
              kind: 'shrine_slash',
              x: clampStageX(target.x + offset),
              width: 34,
              telegraph: 0.14 + idx * 0.08,
              active: 0.25,
              damage: 14,
              knockbackX: 110,
              knockbackY: -115,
            });
          }
          this.spawnBurst(target.x, target.y - 26, 36, '#ef4444', 220);
          this.spawnCallout('MALEVOLENT SHRINE!', target.x, target.y - 58, '#fca5a5');
          return;
        }
      }
    }

    // 2. ALL 10 VILLAINS' PROJECTILES, HAZARDS & DOMAIN EXPANSIONS
    if (!f.isPlayer) {
      if (f.id === 'jogo' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'jogo_fireball',
          x: f.x + f.facing * 24,
          y: f.y - 24,
          vx: f.facing * 215,
          vy: 0,
          radius: 10,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.6,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'jogo' && spec.id === 'enemy_special_2') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'jogo_geyser',
          x: clampStageX(target.x),
          width: 32,
          telegraph: 0.45,
          active: 0.25,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'mahito' && spec.id === 'enemy_special_2') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'mahito_spike',
          x: clampStageX(target.x),
          width: 28,
          telegraph: 0.4,
          active: 0.25,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'hanami' && spec.id === 'enemy_special_1') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'hanami_roots',
          x: clampStageX(target.x),
          width: 34,
          telegraph: 0.46,
          active: 0.28,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'hanami' && spec.id === 'enemy_special_2') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'hanami_beam',
          x: f.x + f.facing * 26,
          y: f.y - 24,
          vx: f.facing * 235,
          vy: 0,
          radius: 12,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.5,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'choso' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'choso_piercing',
          x: f.x + f.facing * 28,
          y: f.y - 25,
          vx: f.facing * 320,
          vy: 0,
          radius: 8,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.2,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'choso' && spec.id === 'enemy_special_2') {
        for (const vy of [-32, 24]) {
          this.spawnProjectile({
            owner: 'enemy',
            kind: 'choso_orb',
            x: f.x + f.facing * 22,
            y: f.y - 28,
            vx: f.facing * 185,
            vy,
            radius: 7,
            damage: Math.round(spec.damage * 0.65 * diffMul),
            chipDamage: 4,
            knockbackX: 85,
            knockbackY: -60,
            life: 1.4,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
        }
        return;
      }
      if (f.id === 'geto' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'geto_swarm',
          x: f.x + f.facing * 24,
          y: f.y - 24,
          vx: f.facing * 225,
          vy: 0,
          radius: 12,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.4,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'uraume' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'uraume_ice',
          x: f.x + f.facing * 26,
          y: f.y - 24,
          vx: f.facing * 245,
          vy: 0,
          radius: 11,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.35,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'uraume' && spec.id === 'enemy_special_2') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'ice_pillar',
          x: clampStageX(target.x),
          width: 30,
          telegraph: 0.42,
          active: 0.25,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'kashimo' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'kashimo_bolt',
          x: f.x + f.facing * 24,
          y: f.y - 26,
          vx: f.facing * 310,
          vy: 0,
          radius: 10,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.15,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'kashimo' && spec.id === 'enemy_special_2') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'lightning_strike',
          x: clampStageX(target.x),
          width: 28,
          telegraph: 0.36,
          active: 0.22,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'kenjaku' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'kenjaku_uzumaki',
          x: f.x + f.facing * 26,
          y: f.y - 25,
          vx: f.facing * 235,
          vy: 0,
          radius: 15,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.4,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        return;
      }
      if (f.id === 'kenjaku' && spec.id === 'enemy_special_2') {
        this.spawnHazard({
          owner: 'enemy',
          kind: 'gravity_crush',
          x: clampStageX(target.x),
          width: 36,
          telegraph: 0.4,
          active: 0.26,
          damage: Math.round(spec.damage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
        });
        return;
      }
      if (f.id === 'sukuna' && spec.id === 'enemy_special_1') {
        this.spawnProjectile({
          owner: 'enemy',
          kind: 'sukuna_dismantle',
          x: f.x + f.facing * 26,
          y: f.y - 24,
          vx: f.facing * (f.bossPhase >= 2 ? 295 : 235),
          vy: 0,
          radius: 14,
          damage: Math.round(spec.damage * diffMul),
          chipDamage: Math.round(spec.chipDamage * diffMul),
          knockbackX: spec.knockbackX,
          knockbackY: spec.knockbackY,
          life: 1.35,
          piercesInfinity: false,
          pullsEnemy: false,
          hitsRemaining: 1,
        });
        if (f.bossPhase >= 2) {
          this.spawnProjectile({
            owner: 'enemy',
            kind: 'sukuna_dismantle',
            x: f.x + f.facing * 24,
            y: f.y - 34,
            vx: f.facing * 260,
            vy: -22,
            radius: 12,
            damage: Math.round(16 * diffMul),
            chipDamage: 4,
            knockbackX: 90,
            knockbackY: -40,
            life: 1.2,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
        }
        return;
      }
      if (f.id === 'sukuna' && spec.id === 'enemy_special_2') {
        if (Math.abs(target.x - f.x) > 75) {
          this.spawnProjectile({
            owner: 'enemy',
            kind: 'sukuna_flame',
            x: f.x + f.facing * 24,
            y: f.y - 24,
            vx: f.facing * 275,
            vy: 0,
            radius: 13,
            damage: Math.round(spec.damage * diffMul),
            chipDamage: Math.round(spec.chipDamage * diffMul),
            knockbackX: spec.knockbackX,
            knockbackY: spec.knockbackY,
            life: 1.4,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
          return;
        }
      }
      if (spec.id === 'enemy_ultimate') {
        const hazardKindMap: Partial<Record<FighterId, GroundHazard['kind']>> = {
          jogo: 'jogo_geyser',
          mahito: 'mahito_spike',
          hanami: 'hanami_roots',
          uraume: 'ice_pillar',
          kashimo: 'lightning_strike',
          kenjaku: 'gravity_crush',
          sukuna: 'shrine_slash',
        };
        const hk = hazardKindMap[f.id];
        if (hk) {
          for (const offset of [-42, 0, 42]) {
            this.spawnHazard({
              owner: 'enemy',
              kind: hk,
              x: clampStageX(target.x + offset),
              width: 30,
              telegraph: 0.42,
              active: 0.25,
              damage: Math.round((f.id === 'sukuna' ? 24 : 20) * diffMul),
              knockbackX: 110,
              knockbackY: -100,
            });
          }
        } else if (f.id === 'choso') {
          for (const vy of [-35, 0, 35]) {
            this.spawnProjectile({
              owner: 'enemy',
              kind: 'choso_orb',
              x: f.x + f.facing * 24,
              y: f.y - 26,
              vx: f.facing * 240,
              vy,
              radius: 9,
              damage: Math.round(18 * diffMul),
              chipDamage: 6,
              knockbackX: 110,
              knockbackY: -75,
              life: 1.4,
              piercesInfinity: false,
              pullsEnemy: false,
              hitsRemaining: 1,
            });
          }
        } else if (f.id === 'geto') {
          this.spawnProjectile({
            owner: 'enemy',
            kind: 'kenjaku_uzumaki',
            x: f.x + f.facing * 26,
            y: f.y - 26,
            vx: f.facing * 245,
            vy: 0,
            radius: 20,
            damage: Math.round(42 * diffMul),
            chipDamage: 14,
            knockbackX: 175,
            knockbackY: -115,
            life: 1.5,
            piercesInfinity: false,
            pullsEnemy: false,
            hitsRemaining: 1,
          });
        } else {
          // Toji Heavenly Zero piercing melee blitz
          this.applyHitToTarget(f, target, { ...spec, piercesInfinity: true }, diffMul);
        }
        return;
      }
    }

    // 3. Melee Hitbox Check
    const dx = (target.x - f.x) * f.facing;
    const dy = Math.abs(target.y - f.y);
    if (dx >= -14 && dx <= spec.range && dy <= spec.heightRange) {
      this.applyHitToTarget(f, target, spec, diffMul);
    }
  }

  private applyHitToTarget(
    attacker: FighterState,
    defender: FighterState,
    spec: MoveSpec,
    diffMul: number
  ): void {
    const res = resolveHit(attacker, defender, spec, diffMul);
    if (!res.hit) return;

    if (res.infinityBlocked) {
      this.hitstopTimer = res.hitstop;
      this.spawnBurst(defender.x - attacker.facing * 12, defender.y - 24, 10, '#38bdf8', 90);
      this.spawnCallout('INFINITY', defender.x, defender.y - 52, '#38bdf8');
      audioEngine.playSfx('infinity');
      defender.ce = Math.min(defender.maxCe, defender.ce + res.ceGainDefender);
      return;
    }

    if (res.parried) {
      defender.parryFlashTimer = 0.28;
      defender.parryWindowTimer = 0;
      defender.ce = Math.min(defender.maxCe, defender.ce + res.ceGainDefender);
      attacker.hitstunTimer = 0.55;
      attacker.action = 'hitstun';
      attacker.vx = -attacker.facing * 105;
      this.hitstopTimer = res.hitstop;
      this.spawnBurst(defender.x + defender.facing * 10, defender.y - 26, 18, '#fde047', 155);
      this.spawnCallout('PARRY!', defender.x, defender.y - 56, '#fde047');
      audioEngine.playSfx('parry');
      return;
    }

    defender.hp = Math.max(0, defender.hp - res.damage);
    attacker.ce = Math.min(attacker.maxCe, attacker.ce + res.ceGainAttacker);
    defender.ce = Math.min(defender.maxCe, defender.ce + res.ceGainDefender);

    if (attacker.isPlayer) {
      this.damageDealt += res.damage;
    }

    if (res.blocked) {
      defender.vx = res.knockbackX;
      this.hitstopTimer = res.hitstop;
      this.spawnBurst(defender.x, defender.y - 24, 8, '#94a3b8', 80);
      audioEngine.playSfx('block');
      return;
    }

    // Clean Hit!
    defender.flashTimer = 0.07;
    if (res.hitstun > 0) {
      defender.hitstunTimer = res.hitstun;
      defender.action = 'hitstun';
    }
    defender.vx = res.knockbackX;
    if (res.knockbackY < -10) {
      defender.vy = res.knockbackY;
    }
    this.hitstopTimer = res.hitstop;

    // Combo tracking & multiplier callouts
    attacker.comboCount += 1;
    attacker.comboResetTimer = 1.65;
    if (attacker.isPlayer && attacker.comboCount > this.maxCombo) {
      this.maxCombo = attacker.comboCount;
    }

    // Impact Juice
    const isHeavy = spec.damage >= 24;
    this.trauma = Math.max(this.trauma, isHeavy ? 0.42 : 0.16);
    audioEngine.playSfx(isHeavy ? 'heavy_hit' : 'light_hit');
    const accent = CHARACTER_PROFILES[attacker.id].accentColor;
    this.spawnBurst(defender.x, defender.y - 24, isHeavy ? 20 : 9, accent, isHeavy ? 170 : 105);
  }

  private updatePhysicsOnly(f: FighterState, dt: number): void {
    f.x = clampStageX(f.x + f.vx * dt);
    if (f.action === 'walk') {
      f.walkDist += Math.abs(f.vx * dt);
    }

    const wasAirborne = f.y < GROUND_Y - 1;
    if (f.y < GROUND_Y || f.vy < 0) {
      f.vy += GRAVITY * dt;
      f.y += f.vy * dt;
      if (f.y >= GROUND_Y) {
        f.y = GROUND_Y;
        f.vy = 0;
        if (wasAirborne) {
          f.scaleX = 1.2;
          f.scaleY = 0.8;
          this.spawnBurst(f.x, GROUND_Y, 5, '#94a3b8', 55);
          if (f.action === 'jump') f.action = 'idle';
        }
      }
    }
  }

  private resolvePushbox(): void {
    const minDist = 24;
    const dx = this.enemy.x - this.player.x;
    if (Math.abs(dx) < minDist && Math.abs(this.enemy.y - this.player.y) < 34) {
      const push = (minDist - Math.abs(dx)) * 0.5;
      const sign = dx >= 0 ? 1 : -1;
      this.player.x = clampStageX(this.player.x - sign * push);
      this.enemy.x = clampStageX(this.enemy.x + sign * push);
    }
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0 || p.x < -30 || p.x > 510) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.hitTickTimer = Math.max(0, p.hitTickTimer - dt);

      if (Math.random() < 0.65) {
        const trailColor =
          p.kind === 'blue' || p.kind === 'uraume_ice' || p.kind === 'kashimo_bolt'
            ? '#38bdf8'
            : p.kind === 'red' || p.kind === 'sukuna_flame'
            ? '#ef4444'
            : p.kind === 'purple' || p.kind === 'kenjaku_uzumaki' || p.kind === 'geto_swarm'
            ? '#c084fc'
            : p.kind === 'pure_love' || p.kind === 'rika_claw'
            ? '#f472b6'
            : p.kind === 'nue_bolt'
            ? '#facc15'
            : '#f87171';
        this.spawnSingleParticle(
          p.x,
          p.y,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          trailColor,
          2,
          0.22
        );
      }

      const target = p.owner === 'player' ? this.enemy : this.player;
      const attacker = p.owner === 'player' ? this.player : this.enemy;

      if (p.pullsEnemy) {
        const pull = computeBluePullVelocity(p.x, p.y, target.x, target.y - 24, 340);
        target.x = clampStageX(target.x + pull.vx * dt);
      }

      const dx = Math.abs(p.x - target.x);
      const dy = Math.abs(p.y - (target.y - 24));
      if (dx <= p.radius + 11 && dy <= p.radius + 20 && p.hitTickTimer <= 0) {
        const spec: MoveSpec = {
          id: 'skill_2',
          name: p.kind,
          startup: 0,
          active: 0.1,
          recovery: 0,
          damage: p.damage,
          chipDamage: p.chipDamage,
          ceCost: 0,
          ceGainOnHit: 4,
          range: 0,
          heightRange: 0,
          hitstun: p.stunsTarget ? 1.1 : 0.34,
          blockstun: 0.18,
          knockbackX: p.knockbackX,
          knockbackY: p.knockbackY,
          hitstop: 0.045,
          piercesInfinity: p.piercesInfinity,
          isUnblockable: p.unblockable,
        };
        this.applyHitToTarget(attacker, target, spec, 1.0);
        if (p.stunsTarget && target.parryFlashTimer <= 0) {
          target.stunLockedTimer = 1.05;
        }
        p.hitsRemaining -= 1;
        p.hitTickTimer = 0.22;
        if (p.hitsRemaining <= 0) {
          p.active = false;
        }
      }
    }
  }

  private updateHazards(dt: number): void {
    for (const h of this.hazards) {
      if (!h.active) continue;
      if (h.telegraphTimer > 0) {
        h.telegraphTimer -= dt;
        if (h.telegraphTimer <= 0) {
          this.trauma = Math.max(this.trauma, 0.26);
          const color =
            h.kind === 'jogo_geyser'
              ? '#f97316'
              : h.kind === 'hanami_roots'
              ? '#22c55e'
              : h.kind === 'ice_pillar' || h.kind === 'lightning_strike'
              ? '#38bdf8'
              : h.kind === 'katana_rain'
              ? '#f472b6'
              : h.kind === 'shadow_spire' || h.kind === 'gravity_crush' || h.kind === 'mahito_spike'
              ? '#a855f7'
              : '#fbbf24';
          this.spawnBurst(h.x, GROUND_Y - 24, 14, color, 130);
        }
        continue;
      }

      h.activeTimer -= dt;
      if (!h.hitApplied) {
        const target = h.owner === 'player' ? this.enemy : this.player;
        const attacker = h.owner === 'player' ? this.player : this.enemy;
        if (Math.abs(target.x - h.x) <= h.width * 0.5 + 8 && target.y >= GROUND_Y - 58) {
          h.hitApplied = true;
          const spec: MoveSpec = {
            id: 'enemy_special_2',
            name: h.kind,
            startup: 0,
            active: 0.1,
            recovery: 0,
            damage: h.damage,
            chipDamage: Math.round(h.damage * 0.25),
            ceCost: 0,
            ceGainOnHit: 0,
            range: 0,
            heightRange: 0,
            hitstun: 0.4,
            blockstun: 0.2,
            knockbackX: h.knockbackX,
            knockbackY: h.knockbackY,
            hitstop: 0.05,
          };
          this.applyHitToTarget(attacker, target, spec, 1.0);
        }
      }

      if (h.activeTimer <= 0) {
        h.active = false;
      }
    }
  }

  private triggerSukunaPhaseTransition(newPhase: 1 | 2 | 3): void {
    this.enemy.bossPhase = newPhase;
    this.roundPhase = 'phase_transition';
    this.phaseTimer = 1.45;
    this.enemy.invulnTimer = 1.6;
    this.trauma = 0.68;
    this.screenFlashColor = '#dc2626';
    this.screenFlashAlpha = 0.55;
    this.spawnBurst(this.enemy.x, this.enemy.y - 26, 32, '#ef4444', 190);

    if (newPhase === 2) {
      this.bannerText = 'SUKUNA PHASE II';
      this.bannerSubtext = 'Cleave & Divine Flame Unleashed!';
      audioEngine.playSfx('slash');
    } else {
      this.domainActive = 'malevolent_shrine';
      this.domainTimer = 999;
      this.shrineSlashTimer = 1.1;
      this.bannerText = 'PHASE III: MALEVOLENT SHRINE';
      this.bannerSubtext = 'Domain Expansion Active!';
      audioEngine.playSfx('shrine');
    }
  }

  private finishRound(): void {
    let roundWinner: 'player' | 'enemy' = 'player';
    if (this.player.hp <= 0) {
      roundWinner = 'enemy';
      this.player.action = 'ko';
      this.enemy.action = 'victory';
    } else if (this.enemy.hp <= 0) {
      roundWinner = 'player';
      this.enemy.action = 'ko';
      this.player.action = 'victory';
    } else {
      roundWinner =
        this.player.hp / this.player.maxHp >= this.enemy.hp / this.enemy.maxHp
          ? 'player'
          : 'enemy';
    }

    if (roundWinner === 'player') {
      this.playerRounds += 1;
      this.score += calculateRoundScore({
        remainingHp: this.player.hp,
        maxHp: this.player.maxHp,
        maxCombo: this.maxCombo,
        timeRemaining: this.roundTimer,
        stageNumber: this.stageIndex + 1,
      });
      this.bannerText = this.enemy.hp <= 0 ? 'K.O.!' : 'TIME OVER';
      this.bannerSubtext = `${this.player.name.toUpperCase()} WINS ROUND`;
      audioEngine.playSfx('ko');
    } else {
      this.enemyRounds += 1;
      this.bannerText = this.player.hp <= 0 ? 'K.O.!' : 'TIME OVER';
      this.bannerSubtext = `${this.enemy.name.toUpperCase()} WINS ROUND`;
      audioEngine.playSfx('ko');
    }

    this.roundPhase = 'round_end';
    this.phaseTimer = 1.9;
  }

  private advanceAfterRound(): void {
    if (this.playerRounds >= 2 || this.enemyRounds >= 2) {
      this.winner = this.playerRounds >= 2 ? 'player' : 'enemy';
      this.roundPhase = 'match_end';
      this.screenState = 'gameover';
      document.body.dataset.state = 'gameover';
      audioEngine.stopMusic();

      if (this.winner === 'player') {
        audioEngine.playSfx('victory');
        if (this.mode === 'story' && this.stageIndex >= STORY_STAGES.length - 1) {
          this.storyComplete = true;
        }
      } else {
        audioEngine.playSfx('defeat');
      }
      return;
    }

    this.roundNumber += 1;
    this.resetRound();
  }

  public advanceStoryStage(): void {
    if (this.stageIndex < STORY_STAGES.length - 1) {
      this.startStoryMode(this.stageIndex + 1);
    } else {
      this.startStoryMode(0);
    }
  }

  public retryMatch(): void {
    if (this.mode === 'story') {
      this.startStoryMode(this.stageIndex);
    } else {
      this.startPracticeMode(this.playerId, this.enemyId, this.arenaId);
    }
  }

  private isThreatNearFighter(defender: FighterState, attackerOwner: 'player' | 'enemy'): boolean {
    for (const p of this.projectiles) {
      if (p.active && p.owner === attackerOwner && Math.abs(p.x - defender.x) < 72) {
        return true;
      }
    }
    return false;
  }

  private spawnProjectile(cfg: {
    owner: 'player' | 'enemy';
    kind: Projectile['kind'];
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    damage: number;
    chipDamage: number;
    knockbackX: number;
    knockbackY: number;
    life: number;
    piercesInfinity: boolean;
    pullsEnemy: boolean;
    stunsTarget?: boolean;
    unblockable?: boolean;
    hitsRemaining: number;
  }): void {
    const slot = this.projectiles[this.projIdx];
    this.projIdx = (this.projIdx + 1) % this.projectiles.length;
    slot.active = true;
    slot.owner = cfg.owner;
    slot.kind = cfg.kind;
    slot.x = cfg.x;
    slot.y = cfg.y;
    slot.vx = cfg.vx;
    slot.vy = cfg.vy;
    slot.radius = cfg.radius;
    slot.damage = cfg.damage;
    slot.chipDamage = cfg.chipDamage;
    slot.knockbackX = cfg.knockbackX;
    slot.knockbackY = cfg.knockbackY;
    slot.life = cfg.life;
    slot.maxLife = cfg.life;
    slot.hitTickTimer = 0;
    slot.piercesInfinity = cfg.piercesInfinity;
    slot.pullsEnemy = cfg.pullsEnemy;
    slot.stunsTarget = !!cfg.stunsTarget;
    slot.unblockable = !!cfg.unblockable;
    slot.hitsRemaining = cfg.hitsRemaining;
  }

  private spawnHazard(cfg: {
    owner: 'player' | 'enemy';
    kind: GroundHazard['kind'];
    x: number;
    width: number;
    telegraph: number;
    active: number;
    damage: number;
    knockbackX: number;
    knockbackY: number;
  }): void {
    const slot = this.hazards[this.hazIdx];
    this.hazIdx = (this.hazIdx + 1) % this.hazards.length;
    slot.active = true;
    slot.owner = cfg.owner;
    slot.kind = cfg.kind;
    slot.x = cfg.x;
    slot.y = GROUND_Y;
    slot.width = cfg.width;
    slot.telegraphTimer = cfg.telegraph;
    slot.activeTimer = cfg.active;
    slot.damage = cfg.damage;
    slot.knockbackX = cfg.knockbackX;
    slot.knockbackY = cfg.knockbackY;
    slot.hitApplied = false;
  }

  private spawnBurst(x: number, y: number, count: number, color: string, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = speed * (0.4 + Math.random() * 0.7);
      this.spawnSingleParticle(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 20,
        color,
        Math.random() < 0.4 ? 3 : 2,
        0.26 + Math.random() * 0.25
      );
    }
  }

  private spawnSingleParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    life: number
  ): void {
    const slot = this.particles[this.partIdx];
    this.partIdx = (this.partIdx + 1) % this.particles.length;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.color = color;
    slot.size = size;
    slot.life = life;
    slot.maxLife = life;
    slot.gravity = 160;
    slot.glow = true;
  }

  private spawnAmbientTitleSparks(dt: number): void {
    const heroAccent = CHARACTER_PROFILES[this.playerId].accentColor;
    if (Math.random() < dt * 12) {
      this.spawnSingleParticle(
        this.player.x + (Math.random() - 0.5) * 28,
        GROUND_Y - Math.random() * 44,
        (Math.random() - 0.5) * 12,
        -18 - Math.random() * 20,
        heroAccent,
        2,
        0.7
      );
    }
    if (Math.random() < dt * 12) {
      this.spawnSingleParticle(
        this.enemy.x + (Math.random() - 0.5) * 28,
        GROUND_Y - Math.random() * 44,
        (Math.random() - 0.5) * 12,
        -18 - Math.random() * 20,
        '#ef4444',
        2,
        0.7
      );
    }
  }

  private spawnAfterimage(f: FighterState, tint: string): void {
    const slot = this.afterimages[this.aiIdx];
    this.aiIdx = (this.aiIdx + 1) % this.afterimages.length;
    slot.active = true;
    slot.fighterId = f.id;
    slot.action = f.action;
    slot.x = f.x;
    slot.y = f.y;
    slot.facing = f.facing;
    slot.alpha = 0.45;
    slot.tint = tint;
  }

  private spawnCallout(text: string, x: number, y: number, color: string): void {
    const slot = this.callouts[this.callIdx];
    this.callIdx = (this.callIdx + 1) % this.callouts.length;
    slot.active = true;
    slot.text = text;
    slot.x = x;
    slot.y = y;
    slot.vy = -22;
    slot.color = color;
    slot.life = 0.85;
    slot.maxLife = 0.85;
  }

  private updateParticles(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
  }

  private updateAfterimages(dt: number): void {
    for (const ai of this.afterimages) {
      if (!ai.active) continue;
      ai.alpha -= dt * 2.1;
      if (ai.alpha <= 0) ai.active = false;
    }
  }

  private updateCallouts(dt: number): void {
    for (const c of this.callouts) {
      if (!c.active) continue;
      c.life -= dt;
      c.y += c.vy * dt;
      if (c.life <= 0) c.active = false;
    }
  }

  public getRenderState(): RenderFrameState {
    const shakeMag = this.settings.screenShake ? this.trauma * this.trauma * 9 : 0;
    const cineProgress =
      this.domainCinematicTimer > 0 && this.domainCinematicMax > 0
        ? 1 - this.domainCinematicTimer / this.domainCinematicMax
        : 0;
    return {
      arenaId: this.arenaId,
      timeSec: this.timeSec,
      cameraZoom: this.camera.zoom,
      cameraX: this.camera.x,
      cameraY: this.camera.y,
      shakeOffsetX: shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0,
      shakeOffsetY: shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0,
      screenFlashAlpha: this.screenFlashAlpha,
      screenFlashColor: this.screenFlashColor,
      domainActive: this.domainActive,
      domainCinematicProgress: cineProgress,
      domainCasterId: this.domainCasterId,
      domainTitle: this.domainTitle,
      player: this.player,
      enemy: this.enemy,
      projectiles: this.projectiles,
      hazards: this.hazards,
      particles: this.particles,
      afterimages: this.afterimages,
      callouts: this.callouts,
    };
  }

  public getHudSnapshot(): HudSnapshot {
    return {
      screenState: this.screenState,
      mode: this.mode,
      stageIndex: this.stageIndex,
      totalStages: STORY_STAGES.length,
      arenaId: this.arenaId,
      arenaName: ARENA_PROFILES[this.arenaId].name,
      roundNumber: this.roundNumber,
      roundPhase: this.roundPhase,
      roundTimer: Math.ceil(this.roundTimer),
      bannerText: this.bannerText,
      bannerSubtext: this.bannerSubtext,
      playerId: this.playerId,
      playerName: this.player.name,
      playerHp: Math.round(this.player.hp),
      playerMaxHp: this.player.maxHp,
      playerGhostHp: Math.round(this.player.ghostHp),
      playerCe: Math.floor(this.player.ce),
      playerInfinity: Number(this.player.infinityTimer.toFixed(1)),
      playerBuffTimer: Number(this.player.buffTimer.toFixed(1)),
      playerRounds: this.playerRounds,
      playerCombo: this.player.comboCount,
      playerComboMultiplier: computeComboMultiplier(this.player.comboCount),
      playerSkills: PLAYABLE_SKILLS[this.playerId],
      enemyId: this.enemy.id,
      enemyName: this.enemy.name,
      enemyTitle: this.enemy.title,
      enemyHp: Math.round(this.enemy.hp),
      enemyMaxHp: this.enemy.maxHp,
      enemyGhostHp: Math.round(this.enemy.ghostHp),
      enemyCe: Math.floor(this.enemy.ce),
      enemyRounds: this.enemyRounds,
      enemyCombo: this.enemy.comboCount,
      enemyBossPhase: this.enemy.bossPhase,
      score: this.score,
      maxCombo: this.maxCombo,
      damageDealt: Math.round(this.damageDealt),
      matchTime: Math.round(this.matchTime),
      domainActive: this.domainActive,
      domainBanner: this.domainBanner,
      cameraZoom: Number(this.camera.zoom.toFixed(2)),
      winner: this.winner,
      storyComplete: this.storyComplete,
    };
  }
}
