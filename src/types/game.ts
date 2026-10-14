export enum GameState {
  MENU = 'MENU',
  PLAYER_MODE_SELECTION = 'PLAYER_MODE_SELECTION',
  DIFFICULTY_SELECTION = 'DIFFICULTY_SELECTION',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  UPGRADES = 'UPGRADES',
  SETTINGS = 'SETTINGS',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
}

export interface DifficultyConfig {
  displayName: string;
  enemySpeedMultiplier: number;
  additionalRows: number;
  enemyFireMultiplier: number;
  damageMultiplier: number;
  bombChanceMultiplier: number;
  bombSpeedMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    displayName: 'EASY',
    enemySpeedMultiplier: 0.8,
    additionalRows: -1,
    enemyFireMultiplier: 0.65,
    damageMultiplier: 0.75,
    bombChanceMultiplier: 0.65,
    bombSpeedMultiplier: 0.9,
  },
  [DifficultyLevel.NORMAL]: {
    displayName: 'NORMAL',
    enemySpeedMultiplier: 1.0,
    additionalRows: 0,
    enemyFireMultiplier: 1.0,
    damageMultiplier: 1.0,
    bombChanceMultiplier: 1.0,
    bombSpeedMultiplier: 1.0,
  },
  [DifficultyLevel.HARD]: {
    displayName: 'HARD',
    enemySpeedMultiplier: 1.25,
    additionalRows: 1,
    enemyFireMultiplier: 1.45,
    damageMultiplier: 1.35,
    bombChanceMultiplier: 1.5,
    bombSpeedMultiplier: 1.15,
  },
};

export enum EnemyType {
  STANDARD = 'STANDARD',
  ELITE = 'ELITE',
}

export interface EnemyConfig {
  score: number;
  credits: number;
  difficulty: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.STANDARD]: { score: 100, credits: 5, difficulty: 1 },
  [EnemyType.ELITE]: { score: 250, credits: 15, difficulty: 2 },
};

export enum WeaponMode {
  STANDARD = 'STANDARD',
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  LASER_BEAM = 'LASER_BEAM',
  PLASMA_SPREAD = 'PLASMA_SPREAD',
}

export interface WeaponModeConfig {
  name: string;
  label: string;
  description: string;
  color: string;
  glow: string;
  cooldown: number;
}

export const WEAPON_MODE_CONFIGS: Record<WeaponMode, WeaponModeConfig> = {
  [WeaponMode.STANDARD]: {
    name: 'Standard Blaster',
    label: 'BLASTER',
    description: 'Rapid concentrated dual/triple forward pulse cannons',
    color: '#37f5ff',
    glow: 'rgba(55, 245, 255, 0.4)',
    cooldown: 8,
  },
  [WeaponMode.TRIPLE_SHOT]: {
    name: 'Triple Fan Shot',
    label: 'TRIPLE SHOT',
    description: '3-way angled spread shot sweeping through entire enemy formations',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.4)',
    cooldown: 9,
  },
  [WeaponMode.LASER_BEAM]: {
    name: 'Hyper Laser Beam',
    label: 'LASER BEAM',
    description: 'Piercing high-energy coherent continuous beam cutting through all targets',
    color: '#ff37a6',
    glow: 'rgba(255, 55, 166, 0.5)',
    cooldown: 3,
  },
  [WeaponMode.PLASMA_SPREAD]: {
    name: 'Plasma Spread',
    label: 'PLASMA SPREAD',
    description: 'Heavy 5-way destructive arc bolts vaporizing bombs & dive-bombers',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    cooldown: 11,
  },
};

export enum PowerUpType {
  EXTRA_LIFE = 'EXTRA_LIFE',
  SHIELD_BOOST = 'SHIELD_BOOST',
  TOKEN_TRIPLE_SHOT = 'TOKEN_TRIPLE_SHOT',
  TOKEN_LASER_BEAM = 'TOKEN_LASER_BEAM',
  TOKEN_PLASMA_SPREAD = 'TOKEN_PLASMA_SPREAD',
  WEAPON = 'WEAPON',
}

export enum UpgradeOption {
  DUAL_CANNONS = 'DUAL_CANNONS',
  TRIPLE_CANNONS = 'TRIPLE_CANNONS',
  DOUBLE_LIVES = 'DOUBLE_LIVES',
  INFINITE_LIVES = 'INFINITE_LIVES',
  RETURN = 'RETURN',
}

export const UPGRADE_CONFIGS = [
  { id: UpgradeOption.DUAL_CANNONS, name: 'DUAL CANNONS', subtitle: 'Fire two projectiles simultaneously', cost: 120 },
  { id: UpgradeOption.TRIPLE_CANNONS, name: 'TRIPLE CANNONS', subtitle: 'Fire three spread projectiles', cost: 260 },
  { id: UpgradeOption.DOUBLE_LIVES, name: 'DOUBLE LIVES', subtitle: 'Start missions with double lives (6 lives)', cost: 5000 },
  { id: UpgradeOption.INFINITE_LIVES, name: 'INFINITE LIVES', subtitle: 'Damage never removes lives (invincible)', cost: 50000000 },
  { id: UpgradeOption.RETURN, name: 'RETURN TO HANGAR', subtitle: 'Back to main menu', cost: 0 },
];

export enum SettingsOption {
  AUDIO = 'AUDIO',
  PARTICLES = 'PARTICLES',
  RETURN = 'RETURN',
}

export enum SoundType {
  SHOOT = 'SHOOT',
  EXPLOSION = 'EXPLOSION',
  POWER_UP = 'POWER_UP',
  LASER = 'LASER',
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  TOKEN_COLLECT = 'TOKEN_COLLECT',
}

export interface GameSaveData {
  lives: number;
  weaponLevel: number;
  weaponMode: WeaponMode;
  unlockedModes: WeaponMode[];
  score: number;
  stage: number;
  credits: number;
  ownedWeaponLevel: number;
  doubleLives: boolean;
  infiniteLives: boolean;
  highScore: number;
  profileScore: number;
}
