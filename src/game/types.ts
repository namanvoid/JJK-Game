export const WORLD_WIDTH = 480;
export const WORLD_HEIGHT = 270;
export const GROUND_Y = 232;
export const STAGE_LEFT = 24;
export const STAGE_RIGHT = 456;

export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type GameMode = 'story' | 'practice';

export type Difficulty = 'grade1' | 'special' | 'king';

export type SorcererFighterId = 'gojo' | 'yuta' | 'megumi' | 'panda';

export type VillainFighterId =
  | 'jogo'
  | 'mahito'
  | 'hanami'
  | 'choso'
  | 'toji'
  | 'geto'
  | 'kenjaku'
  | 'uraume'
  | 'kashimo'
  | 'sukuna';

export type FighterId = SorcererFighterId | VillainFighterId;
export type PlayableFighterId = FighterId;

export type ArenaId =
  | 'jujutsu_high'
  | 'abandoned_school'
  | 'cursed_forest'
  | 'shibuya'
  | 'malevolent_shrine';

export type DomainTheme =
  | 'none'
  | 'unlimited_void'
  | 'mutual_love'
  | 'chimera_shadow'
  | 'beast_sanctuary'
  | 'iron_mountain'
  | 'perfection'
  | 'forest_branches'
  | 'blood_eclipse'
  | 'womb_profusion'
  | 'absolute_zero'
  | 'thunderclap'
  | 'heavenly_zero'
  | 'malevolent_shrine';

export type FighterAction =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'dash'
  | 'sidestep'
  | 'block'
  | 'parry'
  | 'light1'
  | 'light2'
  | 'light3'
  | 'heavy'
  | 'skill_1'
  | 'skill_2'
  | 'skill_3'
  | 'skill_4'
  | 'skill_5_domain'
  | 'enemy_special_1'
  | 'enemy_special_2'
  | 'enemy_special_3'
  | 'enemy_ultimate'
  | 'hitstun'
  | 'knockdown'
  | 'victory'
  | 'ko';

export type RoundPhase =
  | 'intro'
  | 'fight'
  | 'round_end'
  | 'phase_transition'
  | 'match_end';

export interface SkillSlotMeta {
  slot: 1 | 2 | 3 | 4 | 5;
  action: 'skill_1' | 'skill_2' | 'skill_3' | 'skill_4' | 'skill_5_domain';
  keyLabel: string;
  name: string;
  shortName: string;
  cost: number;
  color: string;
  description: string;
}

export interface MoveSpec {
  id: FighterAction;
  name: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  chipDamage: number;
  ceCost: number;
  ceGainOnHit: number;
  range: number;
  heightRange: number;
  hitstun: number;
  blockstun: number;
  knockbackX: number;
  knockbackY: number;
  hitstop: number;
  isProjectile?: boolean;
  isUnblockable?: boolean;
  piercesInfinity?: boolean;
  superArmor?: boolean;
  canChainInto?: FighterAction[];
}

export interface FighterState {
  id: FighterId;
  name: string;
  title: string;
  isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  ghostHp: number;
  ce: number;
  maxCe: number;
  action: FighterAction;
  actionTimer: number;
  actionHitApplied: boolean;
  hitstunTimer: number;
  invulnTimer: number;
  blockWindowTimer: number;
  parryWindowTimer: number;
  infinityTimer: number;
  buffTimer: number; // Gorilla mode / Core guard / Flowing scale
  flashTimer: number;
  parryFlashTimer: number;
  comboCount: number;
  comboResetTimer: number;
  bufferedAction: FighterAction | null;
  bufferTimer: number;
  walkDist: number;
  scaleX: number;
  scaleY: number;
  bossPhase: 1 | 2 | 3;
  superArmorActive: boolean;
  stunLockedTimer: number;
  aiCooldown: number;
  aiStateTimer: number;
  aiIntent: 'approach' | 'retreat' | 'zone' | 'guard' | 'pressure' | 'dodge';
}

export interface Projectile {
  active: boolean;
  owner: 'player' | 'enemy';
  kind:
    | 'blue'
    | 'red'
    | 'purple'
    | 'rika_claw'
    | 'cursed_speech'
    | 'pure_love'
    | 'divine_dog'
    | 'nue_bolt'
    | 'elephant_wave'
    | 'drumming_wave'
    | 'jogo_fireball'
    | 'choso_piercing'
    | 'choso_orb'
    | 'hanami_beam'
    | 'geto_swarm'
    | 'kenjaku_uzumaki'
    | 'uraume_ice'
    | 'kashimo_bolt'
    | 'sukuna_dismantle'
    | 'sukuna_flame';
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
  maxLife: number;
  hitTickTimer: number;
  piercesInfinity: boolean;
  pullsEnemy: boolean;
  stunsTarget?: boolean;
  unblockable?: boolean;
  hitsRemaining: number;
}

export interface GroundHazard {
  active: boolean;
  owner: 'player' | 'enemy';
  kind:
    | 'jogo_geyser'
    | 'hanami_roots'
    | 'shrine_slash'
    | 'mahito_spike'
    | 'katana_rain'
    | 'shadow_spire'
    | 'ice_pillar'
    | 'gravity_crush'
    | 'lightning_strike'
    | 'beast_pillar';
  x: number;
  y: number;
  width: number;
  telegraphTimer: number;
  activeTimer: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitApplied: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  glow: boolean;
}

export interface Afterimage {
  active: boolean;
  fighterId: FighterId;
  action: FighterAction;
  x: number;
  y: number;
  facing: 1 | -1;
  alpha: number;
  tint: string;
}

export interface FloatingCallout {
  active: boolean;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  block: boolean;
  justUp: boolean;
  justDown: boolean;
  justDash: boolean;
  justLight: boolean;
  justHeavy: boolean;
  justBlock: boolean;
  justParry: boolean;
  justSkill1: boolean;
  justSkill2: boolean;
  justSkill3: boolean;
  justSkill4: boolean;
  justSkill5: boolean;
}

export interface GameSettings {
  difficulty: Difficulty;
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  practiceAutoCe: boolean;
  practiceAiActive: boolean;
}

export interface HudSnapshot {
  screenState: GameScreenState;
  mode: GameMode;
  stageIndex: number;
  totalStages: number;
  arenaId: ArenaId;
  arenaName: string;
  roundNumber: number;
  roundPhase: RoundPhase;
  roundTimer: number;
  bannerText: string;
  bannerSubtext: string;
  playerId: FighterId;
  playerName: string;
  playerHp: number;
  playerMaxHp: number;
  playerGhostHp: number;
  playerCe: number;
  playerInfinity: number;
  playerBuffTimer: number;
  playerRounds: number;
  playerCombo: number;
  playerComboMultiplier: number;
  playerSkills: SkillSlotMeta[];
  enemyId: FighterId;
  enemyName: string;
  enemyTitle: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyGhostHp: number;
  enemyCe: number;
  enemyRounds: number;
  enemyCombo: number;
  enemyBossPhase: 1 | 2 | 3;
  score: number;
  maxCombo: number;
  damageDealt: number;
  matchTime: number;
  domainActive: DomainTheme;
  domainBanner: string;
  cameraZoom: number;
  winner: 'player' | 'enemy' | null;
  storyComplete: boolean;
}
