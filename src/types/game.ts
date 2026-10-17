// Re-eksport stałych konfiguracji z src/config/gameplay/balance
export {
    DIFFICULTY_CONFIGS,
    ENEMY_CONFIGS,
    WEAPON_MODE_CONFIGS,
    UPGRADE_CONFIGS,
} from '../config/gameplay/balance';

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

export enum EnemyType {
    STANDARD = 'STANDARD',
    ELITE = 'ELITE',
    BOSS = 'BOSS',
    ESCORT = 'ESCORT',
    DIVING = 'DIVING',
    SWARM = 'SWARM',
}

export interface EnemyConfig {
    score: number;
    credits: number;
    difficulty: number;
    width?: number;
    height?: number;
    hp?: number;
}

export enum WeaponMode {
    STANDARD = 'STANDARD',
    TRIPLE_SHOT = 'TRIPLE_SHOT',
    LASER_BEAM = 'LASER_BEAM',
    PLASMA_SPREAD = 'PLASMA_SPREAD',
}

export enum SoundType {
    SHOOT = 'SHOOT',
    P2_SHOOT = 'P2_SHOOT',
    EXPLOSION = 'EXPLOSION',
    POWER_UP = 'POWER_UP',
    POWERUP = 'POWER_UP',
    LASER = 'LASER',
    TRIPLE_SHOT = 'TRIPLE_SHOT',
    TOKEN_COLLECT = 'TOKEN_COLLECT',
    CLICK = 'CLICK',
    HIT = 'HIT',
    DAMAGE = 'DAMAGE',
}

export interface WeaponModeConfig {
    name: string;
    label: string;
    description: string;
    color: string;
    glow: string;
    cooldown: number;
    fireRate: number;
    energyCost: number;
    sound: SoundType;
}

export enum PowerUpType {
    EXTRA_LIFE = 'EXTRA_LIFE',
    SHIELD_BOOST = 'SHIELD_BOOST',
    TOKEN_TRIPLE_SHOT = 'TOKEN_TRIPLE_SHOT',
    TOKEN_LASER_BEAM = 'TOKEN_LASER_BEAM',
    TOKEN_PLASMA_SPREAD = 'TOKEN_PLASMA_SPREAD',
    WEAPON = 'WEAPON',
    UPGRADE = 'WEAPON',
    SHIELD = 'SHIELD_BOOST',
    LIFE = 'EXTRA_LIFE',
    SPEED = 'SPEED',
    NUKE = 'NUKE',
    TIME_WARP = 'TIME_WARP',
}

export enum UpgradeOption {
    DUAL_CANNONS = 'DUAL_CANNONS',
    TRIPLE_CANNONS = 'TRIPLE_CANNONS',
    DOUBLE_LIVES = 'DOUBLE_LIVES',
    INFINITE_LIVES = 'INFINITE_LIVES',
    RETURN = 'RETURN',
}

export interface UpgradeConfig {
    id: UpgradeOption;
    name: string;
    subtitle: string;
    cost: number;
}

export enum SettingsOption {
    AUDIO = 'AUDIO',
    PARTICLES = 'PARTICLES',
    RETURN = 'RETURN',
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

/**
 * Niemutowalny wycinek stanu gry udostępniany dla warstwy UI (React).
 * Single Source of Truth dla HUD-a, menu i nakładek.
 */
export interface GameEngineSnapshot {
    gameState: GameState;
    wave: number;
    credits: number;
    twoPlayerMode: boolean;
    difficulty: DifficultyLevel;
    soundEnabled: boolean;
    particlesEnabled: boolean;
    isAchievementsOpen: boolean;
    highScore: number;
    profileScore: number;
    player1: {
        lives: number;
        shield: number;
        shieldLag: number;
        score: number;
        weaponLevel: number;
        weaponMode: WeaponMode;
        weaponEnergy: number;
        unlockedWeaponModes: WeaponMode[];
        damageFlash: number;
        hitNotice?: string;
    };
    player2?: {
        lives: number;
        shield: number;
        shieldLag: number;
        score: number;
        weaponLevel: number;
        weaponMode: WeaponMode;
        weaponEnergy: number;
        unlockedWeaponModes: WeaponMode[];
        damageFlash: number;
        hitNotice?: string;
    };
}