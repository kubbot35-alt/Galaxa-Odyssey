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

export enum PowerUpType {
  EXTRA_LIFE = 'EXTRA_LIFE',
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
}

export interface GameSaveData {
  lives: number;
  weaponLevel: number;
  score: number;
  stage: number;
  credits: number;
  ownedWeaponLevel: number;
  doubleLives: boolean;
  infiniteLives: boolean;
  highScore: number;
  profileScore: number;
}
