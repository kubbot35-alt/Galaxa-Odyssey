import {
  GameState,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  EnemyType,
  ENEMY_CONFIGS,
  PowerUpType,
  WeaponMode,
  WEAPON_MODE_CONFIGS,
  UpgradeOption,
  UPGRADE_CONFIGS,
  SettingsOption,
  SoundType,
  GameSaveData,
} from '../types/game';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BOMB_SIZE,
  POWERUP_SIZE,
  POWERUP_TOKEN_SIZE,
  MAX_SHIELD,
  MAX_WEAPON_ENERGY,
  LASER_BEAM_WIDTH,
} from './constants';
import { soundEngine } from '../audio/soundEngine';
import { ACHIEVEMENTS, Achievement, AchievementProgress } from '../types/achievements';

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFromPlayer: boolean;
  color?: string;
  size?: number;
}

export interface Bomb {
  x: number;
  y: number;
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  startX: number;
  startY: number;
  angle: number;
  type: EnemyType;
  diving: boolean;
  hp: number;
  maxHp: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  bobAngle: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  shield: number;
  score: number;
  weaponLevel: number;
  weaponMode: WeaponMode;
  unlockedWeaponModes: WeaponMode[];
  weaponEnergy: number;
  isLaserActive?: boolean;
  movingLeft: boolean;
  movingRight: boolean;
}

export interface ActiveAchievementToast {
  id: string;
  title: string;
  subtitle: string;
  rewardCredits: number;
  iconName: string;
}

export interface WeaponAnnouncement {
  title: string;
  subtitle: string;
  color: string;
  timer: number;
  maxTimer: number;
}

const SAVE_KEY = 'galaxa_odyssey_save';
const PROFILE_KEY = 'galaxa_odyssey_profile';
const ACHIEVEMENTS_KEY = 'galaxa_odyssey_achievements';

export class GameEngine {
  public gameState: GameState = GameState.MENU;
  public difficultyLevel: DifficultyLevel = DifficultyLevel.NORMAL;
  public twoPlayerMode = false;

  public player1!: PlayerState;
  public player2: PlayerState | null = null;

  public bullets: Bullet[] = [];
  public bombs: Bomb[] = [];
  public enemies: Enemy[] = [];
  public powerUps: PowerUp[] = [];
  public particles: Particle[] = [];
  public stars: Star[] = [];

  public wave = 0;
  public credits = 0;
  public profileScore = 0;
  public highScore = 0;
  public ownedWeaponLevel = 1;
  public doubleLives = false;
  public infiniteLives = false;

  public particlesEnabled = true;
  public soundEnabled = true;

  public spaceHeld = false;
  public secondPlayerFireHeld = false;
  public fireCooldown = 0;
  public secondPlayerFireCooldown = 0;
  private laserSoundTimer = 0;

  public menuSelection = 0;
  public playerModeSelection = 0;
  public upgradeSelection = 0;
  public settingsSelection = 0;
  public difficultySelection = 1; // default NORMAL

  // Achievement System
  public achievements: Record<string, AchievementProgress> = {};
  public activeToast: ActiveAchievementToast | null = null;
  private toastTimeout: number | null = null;
  public isAchievementsOpen = false;
  public tookDamageInCurrentWave = false;

  // Weapon Announcement
  public weaponAnnouncement: WeaponAnnouncement | null = null;

  private onStateChange?: () => void;

  constructor(onStateChange?: () => void) {
    this.onStateChange = onStateChange;
    this.initStars();
    this.loadProfile();
    this.loadAchievements();
    this.resetPlayers();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() > 0.8 ? 2 : 1,
        speed: 0.5 + Math.random() * 1.8,
      });
    }
  }

  public loadAchievements() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (raw) {
        this.achievements = JSON.parse(raw);
      }
    } catch {
      this.achievements = {};
    }

    for (const ach of ACHIEVEMENTS) {
      if (!this.achievements[ach.id]) {
        this.achievements[ach.id] = {
          unlocked: false,
          currentProgress: 0,
        };
      }
    }
  }

  public saveAchievements() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
    } catch {
      // Storage error fallback
    }
  }

  public isAchievementUnlocked(id: string): boolean {
    return !!this.achievements[id]?.unlocked;
  }

  public getProgress(id: string): number {
    return this.achievements[id]?.currentProgress ?? 0;
  }

  public getUnlockedCount(): number {
    return ACHIEVEMENTS.filter((a) => this.isAchievementUnlocked(a.id)).length;
  }

  public getTotalCount(): number {
    return ACHIEVEMENTS.length;
  }

  public unlockAchievement(id: string) {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;

    if (!this.achievements[id]) {
      this.achievements[id] = { unlocked: false, currentProgress: 0 };
    }

    if (this.achievements[id].unlocked) return;

    this.achievements[id].unlocked = true;
    this.achievements[id].unlockedAt = Date.now();
    this.achievements[id].currentProgress = ach.maxProgress;

    this.credits += ach.rewardCredits;

    this.activeToast = {
      id: ach.id,
      title: ach.title,
      subtitle: ach.subtitle,
      rewardCredits: ach.rewardCredits,
      iconName: ach.iconName,
    };

    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = window.setTimeout(() => {
      this.activeToast = null;
      this.notifyChange();
    }, 4500);

    soundEngine.playSound(SoundType.POWER_UP);

    this.saveAchievements();
    this.saveProfile();
    this.notifyChange();
  }

  public incrementProgress(id: string, amount = 1) {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;

    if (!this.achievements[id]) {
      this.achievements[id] = { unlocked: false, currentProgress: 0 };
    }

    if (this.achievements[id].unlocked) return;

    const newProg = (this.achievements[id].currentProgress || 0) + amount;
    this.achievements[id].currentProgress = Math.min(ach.maxProgress, newProg);

    if (this.achievements[id].currentProgress >= ach.maxProgress) {
      this.unlockAchievement(id);
    } else {
      this.saveAchievements();
    }
  }

  public dismissToast() {
    this.activeToast = null;
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.notifyChange();
  }

  public openAchievements() {
    this.isAchievementsOpen = true;
    this.notifyChange();
  }

  public closeAchievements() {
    this.isAchievementsOpen = false;
    this.notifyChange();
  }

  public toggleAchievements() {
    this.isAchievementsOpen = !this.isAchievementsOpen;
    this.notifyChange();
  }

  public loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.credits = data.credits ?? 0;
        this.profileScore = data.profileScore ?? 0;
        this.highScore = data.highScore ?? 0;
        this.ownedWeaponLevel = data.ownedWeaponLevel ?? 1;
        this.doubleLives = !!data.doubleLives;
        this.infiniteLives = !!data.infiniteLives;
        if (typeof data.soundEnabled === 'boolean') {
          this.soundEnabled = data.soundEnabled;
          soundEngine.setSoundEnabled(this.soundEnabled);
        }
        if (typeof data.particlesEnabled === 'boolean') {
          this.particlesEnabled = data.particlesEnabled;
        }
      }
    } catch {
      // Profile parse error fallback
    }
  }

  public saveProfile() {
    try {
      const data = {
        credits: this.credits,
        profileScore: this.profileScore,
        highScore: this.highScore,
        ownedWeaponLevel: this.ownedWeaponLevel,
        doubleLives: this.doubleLives,
        infiniteLives: this.infiniteLives,
        soundEnabled: this.soundEnabled,
        particlesEnabled: this.particlesEnabled,
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    } catch {
      // Profile storage error fallback
    }
  }

  public saveGameSession() {
    if (this.gameState !== GameState.PLAYING && this.gameState !== GameState.PAUSED) return;
    try {
      const save: GameSaveData = {
        lives: this.player1.lives,
        weaponLevel: this.player1.weaponLevel,
        weaponMode: this.player1.weaponMode,
        unlockedModes: this.player1.unlockedWeaponModes,
        score: this.player1.score,
        stage: this.wave,
        credits: this.credits,
        ownedWeaponLevel: this.ownedWeaponLevel,
        doubleLives: this.doubleLives,
        infiniteLives: this.infiniteLives,
        highScore: this.highScore,
        profileScore: this.profileScore,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      this.saveProfile();
    } catch {
      // Save session error fallback
    }
  }

  public hasSavedGame(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  public loadSavedGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);

      this.resetPlayers();
      this.player1.lives = data.lives ?? 3;
      this.player1.weaponLevel = data.weaponLevel ?? 1;
      this.player1.weaponMode = data.weaponMode ?? WeaponMode.STANDARD;
      this.player1.unlockedWeaponModes = data.unlockedModes ?? [WeaponMode.STANDARD];
      this.player1.score = data.score ?? 0;
      this.wave = Math.max(0, (data.stage ?? 1) - 1);
      this.credits = data.credits ?? this.credits;
      this.ownedWeaponLevel = data.ownedWeaponLevel ?? this.ownedWeaponLevel;
      this.doubleLives = !!data.doubleLives;
      this.infiniteLives = !!data.infiniteLives;

      this.gameState = GameState.PLAYING;
      this.bullets = [];
      this.bombs = [];
      this.enemies = [];
      this.powerUps = [];
      this.particles = [];
      this.spawnNextWave();
      soundEngine.stopMenuMusic();
      this.notifyChange();
      return true;
    } catch {
      return false;
    }
  }

  public clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
  }

  public resetPlayers() {
    const startLives = this.infiniteLives ? 999 : this.doubleLives ? 6 : 3;
    const initialWeapon = Math.max(1, this.ownedWeaponLevel);

    this.player1 = {
      x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      lives: startLives,
      shield: MAX_SHIELD,
      score: 0,
      weaponLevel: initialWeapon,
      weaponMode: WeaponMode.STANDARD,
      unlockedWeaponModes: [WeaponMode.STANDARD],
      weaponEnergy: MAX_WEAPON_ENERGY,
      isLaserActive: false,
      movingLeft: false,
      movingRight: false,
    };

    if (this.twoPlayerMode) {
      this.player1.x = GAME_WIDTH / 2 - PLAYER_WIDTH - 30;
      this.player2 = {
        x: GAME_WIDTH / 2 + 30,
        y: GAME_HEIGHT - 80,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        lives: startLives,
        shield: MAX_SHIELD,
        score: 0,
        weaponLevel: initialWeapon,
        weaponMode: WeaponMode.STANDARD,
        unlockedWeaponModes: [WeaponMode.STANDARD],
        weaponEnergy: MAX_WEAPON_ENERGY,
        isLaserActive: false,
        movingLeft: false,
        movingRight: false,
      };
    } else {
      this.player2 = null;
    }
  }

  public startNewGame() {
    this.clearSavedGame();
    this.resetPlayers();
    this.wave = 0;
    this.bullets = [];
    this.bombs = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.tookDamageInCurrentWave = false;
    this.weaponAnnouncement = null;

    if (this.twoPlayerMode) {
      this.unlockAchievement('coop_commander');
    }

    this.gameState = GameState.PLAYING;
    this.spawnNextWave();
    soundEngine.stopMenuMusic();
    this.notifyChange();
  }

  public spawnNextWave() {
    if (this.wave >= 1) {
      this.unlockAchievement('first_wave');
      if (this.difficultyLevel === DifficultyLevel.HARD) {
        this.unlockAchievement('void_conqueror');
      }
      if (!this.tookDamageInCurrentWave) {
        this.unlockAchievement('indomitable');
      }
    }

    this.wave += 1;

    if (this.wave >= 5) {
      this.unlockAchievement('interstellar_ace');
    }
    if (this.wave >= 8) {
      this.unlockAchievement('boss_slayer');
    }

    this.tookDamageInCurrentWave = false;

    const diff = DIFFICULTY_CONFIGS[this.difficultyLevel];
    const rows = Math.max(1, Math.min(5, 2 + Math.floor(this.wave / 2) + diff.additionalRows));

    this.enemies = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 8; col++) {
        const type = row === 0 ? EnemyType.ELITE : EnemyType.STANDARD;
        const x = 100 + col * 75;
        const y = 40 + row * 45;
        const hp = type === EnemyType.ELITE ? 3 : 1;
        this.enemies.push({
          x,
          y,
          startX: x,
          startY: y,
          angle: Math.random() * Math.PI * 2,
          type,
          diving: false,
          hp,
          maxHp: hp,
        });
      }
    }
  }

  public setWeaponMode(mode: WeaponMode) {
    if (this.player1.unlockedWeaponModes.includes(mode)) {
      this.player1.weaponMode = mode;
      this.player1.isLaserActive = false;
      this.notifyChange();
    }
  }

  public cycleWeaponMode(direction: 1 | -1 = 1) {
    const modes = this.player1.unlockedWeaponModes;
    if (modes.length <= 1) return;
    const currIdx = modes.indexOf(this.player1.weaponMode);
    const nextIdx = (currIdx + direction + modes.length) % modes.length;
    this.player1.weaponMode = modes[nextIdx];
    this.player1.isLaserActive = false;
    soundEngine.playSound(SoundType.SHOOT);
    this.notifyChange();
  }

  public firePlayer1() {
    const p = this.player1;
    if (p.lives <= 0) return;

    if (p.weaponMode === WeaponMode.LASER_BEAM) {
      // Laser Beam mode
      if (p.weaponEnergy > 2) {
        p.isLaserActive = true;
        p.weaponEnergy = Math.max(0, p.weaponEnergy - 0.4);
        this.laserSoundTimer++;
        if (this.laserSoundTimer % 7 === 0) {
          soundEngine.playSound(SoundType.LASER);
        }
      } else {
        p.isLaserActive = false;
        // Low energy fallback to standard pulse
        this.fireStandardBlaster(p);
      }
      return;
    }

    // Projectile weapons
    p.isLaserActive = false;

    if (p.weaponMode === WeaponMode.TRIPLE_SHOT) {
      this.fireTripleShot(p);
      p.weaponEnergy = Math.max(0, p.weaponEnergy - 1.2);
    } else if (p.weaponMode === WeaponMode.PLASMA_SPREAD) {
      this.firePlasmaSpread(p);
      p.weaponEnergy = Math.max(0, p.weaponEnergy - 1.8);
    } else {
      this.fireStandardBlaster(p);
    }
  }

  private fireStandardBlaster(p: PlayerState) {
    soundEngine.playSound(SoundType.SHOOT);
    const lvl = p.weaponLevel;

    if (lvl === 1) {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
    } else if (lvl === 2) {
      this.bullets.push({
        x: p.x + 8,
        y: p.y,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
      this.bullets.push({
        x: p.x + p.width - 8,
        y: p.y,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
    } else {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y - 4,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
      this.bullets.push({
        x: p.x + 2,
        y: p.y,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
      this.bullets.push({
        x: p.x + p.width - 2,
        y: p.y,
        vx: 0,
        vy: -11,
        isFromPlayer: true,
        color: '#41f0ff',
      });
    }
    this.fireCooldown = Math.max(5, 12 - lvl * 2);
  }

  private fireTripleShot(p: PlayerState) {
    soundEngine.playSound(SoundType.TRIPLE_SHOT);
    const cx = p.x + p.width / 2;
    const cy = p.y;

    // 3-way fan volley
    this.bullets.push({
      x: cx,
      y: cy - 4,
      vx: 0,
      vy: -12,
      isFromPlayer: true,
      color: '#fbbf24',
      size: 5,
    });
    this.bullets.push({
      x: cx - 10,
      y: cy,
      vx: -3.8,
      vy: -11.5,
      isFromPlayer: true,
      color: '#fbbf24',
      size: 4,
    });
    this.bullets.push({
      x: cx + 10,
      y: cy,
      vx: 3.8,
      vy: -11.5,
      isFromPlayer: true,
      color: '#fbbf24',
      size: 4,
    });

    if (p.weaponLevel >= 3) {
      // Upgraded Gun Level 3 fires extra wide wings
      this.bullets.push({
        x: cx - 18,
        y: cy + 4,
        vx: -6.2,
        vy: -10,
        isFromPlayer: true,
        color: '#f59e0b',
        size: 3,
      });
      this.bullets.push({
        x: cx + 18,
        y: cy + 4,
        vx: 6.2,
        vy: -10,
        isFromPlayer: true,
        color: '#f59e0b',
        size: 3,
      });
    }

    this.fireCooldown = 8;
  }

  private firePlasmaSpread(p: PlayerState) {
    soundEngine.playSound(SoundType.TRIPLE_SHOT);
    const cx = p.x + p.width / 2;
    const cy = p.y;
    const angles = [-5.2, -2.6, 0, 2.6, 5.2];

    for (const vx of angles) {
      this.bullets.push({
        x: cx,
        y: cy,
        vx,
        vy: -11,
        isFromPlayer: true,
        color: '#c084fc',
        size: 5,
      });
    }
    this.fireCooldown = 10;
  }

  public firePlayer2() {
    if (!this.player2 || this.player2.lives <= 0) return;
    this.fireStandardBlaster(this.player2);
    this.secondPlayerFireCooldown = Math.max(5, 12 - this.player2.weaponLevel * 2);
  }

  public addExplosion(x: number, y: number, r: number, g: number, b: number, count: number) {
    if (!this.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r,
        g,
        b,
        life: 35,
        maxLife: 35,
        size: 3 + Math.random() * 3,
      });
    }
  }

  public addLaserSparks(x: number, y: number, colorHex: string, count = 4) {
    if (!this.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed,
        r: colorHex === '#ff37a6' ? 255 : 251,
        g: colorHex === '#ff37a6' ? 70 : 191,
        b: colorHex === '#ff37a6' ? 180 : 36,
        life: 14,
        maxLife: 14,
        size: 2.5 + Math.random() * 2,
      });
    }
  }

  public update() {
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
    }

    if (this.weaponAnnouncement) {
      this.weaponAnnouncement.timer -= 1;
      if (this.weaponAnnouncement.timer <= 0) {
        this.weaponAnnouncement = null;
      }
    }

    if (this.gameState !== GameState.PLAYING) {
      this.updateParticles();
      return;
    }

    const diff = DIFFICULTY_CONFIGS[this.difficultyLevel];

    // Player 1 movement
    if (this.player1.movingLeft) {
      this.player1.x = Math.max(10, this.player1.x - PLAYER_SPEED);
    }
    if (this.player1.movingRight) {
      this.player1.x = Math.min(GAME_WIDTH - this.player1.width - 10, this.player1.x + PLAYER_SPEED);
    }

    // Passive weapon energy regeneration (+0.08 per frame up to 100)
    if (this.player1.weaponEnergy < MAX_WEAPON_ENERGY) {
      this.player1.weaponEnergy = Math.min(MAX_WEAPON_ENERGY, this.player1.weaponEnergy + 0.08);
    }

    // Player 1 firing
    if (this.fireCooldown > 0) this.fireCooldown--;

    if (this.spaceHeld && this.player1.lives > 0) {
      if (this.player1.weaponMode === WeaponMode.LASER_BEAM) {
        this.firePlayer1();
      } else if (this.fireCooldown === 0) {
        this.firePlayer1();
      }
    } else {
      this.player1.isLaserActive = false;
    }

    // Player 2 movement & fire
    if (this.twoPlayerMode && this.player2 && this.player2.lives > 0) {
      if (this.player2.movingLeft) {
        this.player2.x = Math.max(10, this.player2.x - PLAYER_SPEED);
      }
      if (this.player2.movingRight) {
        this.player2.x = Math.min(GAME_WIDTH - this.player2.width - 10, this.player2.x + PLAYER_SPEED);
      }
      if (this.secondPlayerFireCooldown > 0) this.secondPlayerFireCooldown--;
      if (this.secondPlayerFireHeld && this.secondPlayerFireCooldown === 0) {
        this.firePlayer2();
      }
    }

    // Bullets movement (with horizontal angle vx)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx || 0;
      b.y += b.vy;
      if (b.y < -20 || b.y > GAME_HEIGHT + 20 || b.x < -20 || b.x > GAME_WIDTH + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemies movement
    for (const e of this.enemies) {
      e.angle += 0.04;
      e.x = e.startX + Math.sin(e.angle) * (42 + this.wave * 2);

      if (!e.diving && Math.random() < 0.001 + this.wave * 0.0003) {
        e.diving = true;
      }

      if (e.diving) {
        const typeCfg = ENEMY_CONFIGS[e.type];
        e.y += (2.6 + typeCfg.difficulty * 0.6 + Math.min(1.5, this.wave * 0.08)) * diff.enemySpeedMultiplier;
        e.x += Math.sin(e.angle * 2.5) * (1.8 + Math.min(1.2, this.wave * 0.05)) * diff.enemySpeedMultiplier;
        if (e.y > 620) {
          e.y = e.startY;
          e.x = e.startX;
          e.diving = false;
        }
      } else {
        e.y += Math.min(0.14, 0.025 + this.wave * 0.004) * diff.enemySpeedMultiplier;
      }
    }

    // Enemy bullets firing
    const enemyFireChance = Math.min(0.012, (0.0025 + this.wave * 0.0007) * diff.enemyFireMultiplier);
    for (const e of this.enemies) {
      if (Math.random() < enemyFireChance) {
        this.bullets.push({
          x: e.x + ENEMY_WIDTH / 2,
          y: e.y + ENEMY_HEIGHT,
          vx: 0,
          vy: 5 + diff.enemySpeedMultiplier,
          isFromPlayer: false,
        });
      }
    }

    // Bombs spawn and update
    const bombChance = Math.min(0.012, (0.0002 + this.wave * 0.00008) * diff.bombChanceMultiplier);
    if (Math.random() < bombChance) {
      this.bombs.push({
        x: 30 + Math.random() * (GAME_WIDTH - 60),
        y: -30,
        speed: Math.round((3 + Math.min(3, this.wave / 5)) * diff.bombSpeedMultiplier),
      });
    }

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.y += bomb.speed;
      if (bomb.y > GAME_HEIGHT + 40) {
        this.bombs.splice(i, 1);
      }
    }

    // Power-up tokens update with sway bobbing
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.bobAngle += 0.05;
      p.x += Math.sin(p.bobAngle) * 0.6;
      p.y += p.speed;
      if (p.y > GAME_HEIGHT + 30) {
        this.powerUps.splice(i, 1);
      }
    }

    // Resolve Collisions
    this.resolveLaserBeamHits();
    this.resolveBulletHits();
    this.resolveEnemyAndHazardCollisions();
    this.resolvePowerUpCollisions();

    // Particles update
    this.updateParticles();

    // Check wave complete
    if (this.enemies.length === 0 && this.gameState === GameState.PLAYING) {
      this.spawnNextWave();
    }
  }

  private resolveLaserBeamHits() {
    if (!this.player1.isLaserActive || this.player1.lives <= 0) return;

    const laserX = this.player1.x + this.player1.width / 2;
    const laserTop = 0;
    const laserBottom = this.player1.y;

    // Laser vs Bombs
    for (let bmi = this.bombs.length - 1; bmi >= 0; bmi--) {
      const bomb = this.bombs[bmi];
      const bombCenterX = bomb.x + 12;
      const bombCenterY = bomb.y + 12;

      if (
        Math.abs(bombCenterX - laserX) < LASER_BEAM_WIDTH / 2 + 12 &&
        bombCenterY >= laserTop &&
        bombCenterY <= laserBottom
      ) {
        this.addLaserSparks(laserX, bombCenterY, '#ff37a6', 5);
        this.bombs.splice(bmi, 1);
        this.addExplosion(bomb.x + 12, bomb.y + 12, 255, 70, 80, 40);
        soundEngine.playSound(SoundType.EXPLOSION);
        this.incrementProgress('bomb_defuser', 1);
      }
    }

    // Laser vs Enemies
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const enemy = this.enemies[ei];
      const enemyCenterX = enemy.x + 16;
      const enemyCenterY = enemy.y + 16;

      if (
        Math.abs(enemyCenterX - laserX) < LASER_BEAM_WIDTH / 2 + 16 &&
        enemyCenterY >= laserTop &&
        enemyCenterY <= laserBottom
      ) {
        // High-energy cutting ticks
        this.addLaserSparks(laserX, enemyCenterY, '#ff37a6', 3);
        enemy.hp -= 0.35;

        if (enemy.hp <= 0) {
          const cfg = ENEMY_CONFIGS[enemy.type];
          this.enemies.splice(ei, 1);
          this.addExplosion(enemy.x + 16, enemy.y + 16, 255, 55, 166, 30);
          soundEngine.playSound(SoundType.EXPLOSION);

          this.player1.score += cfg.score;
          this.credits += cfg.credits;
          this.profileScore += cfg.score;
          this.highScore = Math.max(this.highScore, this.player1.score);

          if (enemy.type === EnemyType.ELITE) {
            this.incrementProgress('elite_hunter', 1);
            this.incrementProgress('boss_slayer', 1);
          }

          if (this.player1.score >= 3000) {
            this.unlockAchievement('high_roller');
          }

          this.dropTokenAt(enemy.x, enemy.y, enemy.type === EnemyType.ELITE);
        }
      }
    }
  }

  private resolveBulletHits() {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.isFromPlayer) continue;

      let bulletHit = false;

      // Check bomb hits
      for (let bmi = this.bombs.length - 1; bmi >= 0; bmi--) {
        const bomb = this.bombs[bmi];
        if (this.intersects(b.x - 4, b.y, 8, 14, bomb.x, bomb.y, BOMB_SIZE, BOMB_SIZE)) {
          this.bullets.splice(bi, 1);
          this.bombs.splice(bmi, 1);
          this.addExplosion(bomb.x + 12, bomb.y + 12, 255, 70, 80, 45);
          soundEngine.playSound(SoundType.EXPLOSION);
          bulletHit = true;
          this.incrementProgress('bomb_defuser', 1);
          break;
        }
      }
      if (bulletHit) continue;

      // Check enemy hits
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (this.intersects(b.x - 4, b.y, 8, 14, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
          this.bullets.splice(bi, 1);
          enemy.hp -= 1;

          if (enemy.hp <= 0) {
            this.enemies.splice(ei, 1);
            const cfg = ENEMY_CONFIGS[enemy.type];
            this.addExplosion(enemy.x + 16, enemy.y + 16, 255, 0, 255, 25);
            soundEngine.playSound(SoundType.EXPLOSION);

            this.player1.score += cfg.score;
            this.credits += cfg.credits;
            this.profileScore += cfg.score;
            this.highScore = Math.max(this.highScore, this.player1.score);

            if (enemy.type === EnemyType.ELITE) {
              this.incrementProgress('elite_hunter', 1);
              this.incrementProgress('boss_slayer', 1);
            }

            if (this.player1.score >= 3000) {
              this.unlockAchievement('high_roller');
            }

            this.dropTokenAt(enemy.x, enemy.y, enemy.type === EnemyType.ELITE);
          } else {
            // Hit spark on armored enemy
            this.addLaserSparks(enemy.x + 16, enemy.y + 16, '#37f5ff', 3);
          }
          break;
        }
      }
    }
  }

  private dropTokenAt(x: number, y: number, isElite: boolean) {
    const chance = isElite ? 0.45 : 0.14;
    if (Math.random() >= chance) return;

    // Token distribution
    const roll = Math.random();
    let type: PowerUpType;

    if (isElite) {
      // Elites drop high-tier weapon tokens!
      if (roll < 0.38) type = PowerUpType.TOKEN_LASER_BEAM;
      else if (roll < 0.68) type = PowerUpType.TOKEN_TRIPLE_SHOT;
      else if (roll < 0.85) type = PowerUpType.TOKEN_PLASMA_SPREAD;
      else type = PowerUpType.EXTRA_LIFE;
    } else {
      if (roll < 0.28) type = PowerUpType.TOKEN_TRIPLE_SHOT;
      else if (roll < 0.48) type = PowerUpType.TOKEN_LASER_BEAM;
      else if (roll < 0.65) type = PowerUpType.TOKEN_PLASMA_SPREAD;
      else if (roll < 0.82) type = PowerUpType.SHIELD_BOOST;
      else if (roll < 0.93) type = PowerUpType.WEAPON;
      else type = PowerUpType.EXTRA_LIFE;
    }

    this.powerUps.push({
      x,
      y,
      type,
      bobAngle: Math.random() * Math.PI * 2,
      speed: 1.8 + Math.random() * 0.6,
    });
  }

  private resolveEnemyAndHazardCollisions() {
    const diff = DIFFICULTY_CONFIGS[this.difficultyLevel];
    const baseDamage = Math.max(1, Math.round(Math.min(70, 40 + Math.floor(this.wave / 3)) * diff.damageMultiplier));

    const playersToCheck = [this.player1];
    if (this.twoPlayerMode && this.player2) playersToCheck.push(this.player2);

    for (const player of playersToCheck) {
      if (player.lives <= 0) continue;

      // Enemy bullet hit
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (b.isFromPlayer) continue;
        if (this.intersects(b.x - 3, b.y, 6, 12, player.x, player.y, player.width, player.height)) {
          this.bullets.splice(bi, 1);
          this.damagePlayer(player, baseDamage);
          break;
        }
      }

      // Bomb hit
      for (let bmi = this.bombs.length - 1; bmi >= 0; bmi--) {
        const bomb = this.bombs[bmi];
        if (this.intersects(bomb.x, bomb.y, BOMB_SIZE, BOMB_SIZE, player.x, player.y, player.width, player.height)) {
          this.bombs.splice(bmi, 1);
          this.addExplosion(player.x + 20, player.y + 20, 255, 70, 80, 50);
          soundEngine.playSound(SoundType.EXPLOSION);
          this.damagePlayer(player, 100);
          break;
        }
      }

      // Enemy crash into player
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (this.intersects(enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, player.x, player.y, player.width, player.height)) {
          this.enemies.splice(ei, 1);
          this.addExplosion(enemy.x + 16, enemy.y + 16, 255, 120, 60, 30);
          soundEngine.playSound(SoundType.EXPLOSION);
          this.damagePlayer(player, baseDamage);
          break;
        }
      }
    }

    const p1Dead = this.player1.lives <= 0;
    const p2Dead = !this.twoPlayerMode || !this.player2 || this.player2.lives <= 0;
    if (p1Dead && p2Dead && this.gameState === GameState.PLAYING) {
      this.clearSavedGame();
      this.saveProfile();
      this.gameState = GameState.GAMEOVER;
      this.notifyChange();
    }
  }

  private damagePlayer(player: PlayerState, damage: number) {
    this.tookDamageInCurrentWave = true;

    if (this.infiniteLives) {
      player.shield = MAX_SHIELD;
      return;
    }

    if (player.shield > 0) {
      player.shield = Math.max(0, player.shield - damage);
      return;
    }

    player.lives -= 1;
    player.shield = MAX_SHIELD;
    this.addExplosion(player.x + 20, player.y + 20, 80, 210, 255, 32);
    soundEngine.playSound(SoundType.EXPLOSION);
  }

  private resolvePowerUpCollisions() {
    const playersToCheck = [this.player1];
    if (this.twoPlayerMode && this.player2) playersToCheck.push(this.player2);

    for (const player of playersToCheck) {
      if (player.lives <= 0) continue;
      for (let pi = this.powerUps.length - 1; pi >= 0; pi--) {
        const p = this.powerUps[pi];
        if (this.intersects(p.x, p.y, POWERUP_TOKEN_SIZE, POWERUP_TOKEN_SIZE, player.x, player.y, player.width, player.height)) {
          this.powerUps.splice(pi, 1);

          this.incrementProgress('power_surge', 1);

          if (p.type === PowerUpType.TOKEN_TRIPLE_SHOT) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.TRIPLE_SHOT)) {
              player.unlockedWeaponModes.push(WeaponMode.TRIPLE_SHOT);
            }
            player.weaponMode = WeaponMode.TRIPLE_SHOT;
            player.weaponEnergy = MAX_WEAPON_ENERGY;
            player.isLaserActive = false;

            this.weaponAnnouncement = {
              title: '🔱 TRIPLE SHOT ENGAGED!',
              subtitle: '3-Way Angled Fan Cannons Activated',
              color: '#fbbf24',
              timer: 130,
              maxTimer: 130,
            };
            this.unlockAchievement('triple_threat');
            soundEngine.playSound(SoundType.TOKEN_COLLECT);
          } else if (p.type === PowerUpType.TOKEN_LASER_BEAM) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.LASER_BEAM)) {
              player.unlockedWeaponModes.push(WeaponMode.LASER_BEAM);
            }
            player.weaponMode = WeaponMode.LASER_BEAM;
            player.weaponEnergy = MAX_WEAPON_ENERGY;

            this.weaponAnnouncement = {
              title: '⚡ HYPER LASER BEAM ENGAGED!',
              subtitle: 'Piercing Coherent Laser Column Activated',
              color: '#ff37a6',
              timer: 130,
              maxTimer: 130,
            };
            this.unlockAchievement('laser_master');
            soundEngine.playSound(SoundType.TOKEN_COLLECT);
          } else if (p.type === PowerUpType.TOKEN_PLASMA_SPREAD) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.PLASMA_SPREAD)) {
              player.unlockedWeaponModes.push(WeaponMode.PLASMA_SPREAD);
            }
            player.weaponMode = WeaponMode.PLASMA_SPREAD;
            player.weaponEnergy = MAX_WEAPON_ENERGY;
            player.isLaserActive = false;

            this.weaponAnnouncement = {
              title: '🔮 PLASMA SPREAD ENGAGED!',
              subtitle: '5-Way Heavy Disruption Bolts Activated',
              color: '#c084fc',
              timer: 130,
              maxTimer: 130,
            };
            soundEngine.playSound(SoundType.TOKEN_COLLECT);
          } else if (p.type === PowerUpType.SHIELD_BOOST) {
            player.shield = MAX_SHIELD;
            this.weaponAnnouncement = {
              title: '🛡️ MAXIMUM SHIELD RESTORED',
              subtitle: 'Deflector System Overcharged to 100%',
              color: '#38bdf8',
              timer: 100,
              maxTimer: 100,
            };
            soundEngine.playSound(SoundType.POWER_UP);
          } else if (p.type === PowerUpType.EXTRA_LIFE) {
            player.lives += 1;
            this.weaponAnnouncement = {
              title: '❤️ EXTRA PILOT LIFE ACQUIRED',
              subtitle: 'Hull Backup Unit Online',
              color: '#4ade80',
              timer: 100,
              maxTimer: 100,
            };
            soundEngine.playSound(SoundType.POWER_UP);
          } else if (p.type === PowerUpType.WEAPON) {
            player.weaponLevel = Math.min(3, player.weaponLevel + 1);
            if (player.weaponLevel >= 3) {
              this.unlockAchievement('full_arsenal');
            }
            this.weaponAnnouncement = {
              title: `⭐ CANNON LEVEL ${player.weaponLevel}`,
              subtitle: 'Primary Firepower Tier Upgraded',
              color: '#22d3ee',
              timer: 100,
              maxTimer: 100,
            };
            soundEngine.playSound(SoundType.POWER_UP);
          }

          this.notifyChange();
        }
      }
    }
  }

  private updateParticles() {
    if (!this.particlesEnabled) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public intersects(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  public buyUpgrade(option: UpgradeOption): boolean {
    const config = UPGRADE_CONFIGS.find((u) => u.id === option);
    if (!config) return false;

    if (option === UpgradeOption.DUAL_CANNONS) {
      if (this.ownedWeaponLevel >= 2) return false;
      if (this.profileScore >= config.cost) {
        this.profileScore -= config.cost;
        this.ownedWeaponLevel = 2;
        this.player1.weaponLevel = Math.max(this.player1.weaponLevel, 2);
        this.saveProfile();
        soundEngine.playSound(SoundType.POWER_UP);
        this.notifyChange();
        return true;
      }
    } else if (option === UpgradeOption.TRIPLE_CANNONS) {
      if (this.ownedWeaponLevel >= 3) return false;
      if (this.profileScore >= config.cost) {
        this.profileScore -= config.cost;
        this.ownedWeaponLevel = 3;
        this.player1.weaponLevel = 3;
        this.saveProfile();
        soundEngine.playSound(SoundType.POWER_UP);
        this.unlockAchievement('full_arsenal');
        this.notifyChange();
        return true;
      }
    } else if (option === UpgradeOption.DOUBLE_LIVES) {
      if (this.doubleLives) return false;
      if (this.profileScore >= config.cost) {
        this.profileScore -= config.cost;
        this.doubleLives = true;
        this.saveProfile();
        soundEngine.playSound(SoundType.POWER_UP);
        this.unlockAchievement('ascendant_fleet');
        this.notifyChange();
        return true;
      }
    } else if (option === UpgradeOption.INFINITE_LIVES) {
      if (this.infiniteLives) return false;
      if (this.profileScore >= config.cost) {
        this.profileScore -= config.cost;
        this.infiniteLives = true;
        this.doubleLives = true;
        this.saveProfile();
        soundEngine.playSound(SoundType.POWER_UP);
        this.unlockAchievement('ascendant_fleet');
        this.notifyChange();
        return true;
      }
    }
    return false;
  }

  public toggleAudio() {
    this.soundEnabled = !this.soundEnabled;
    soundEngine.setSoundEnabled(this.soundEnabled);
    if (this.soundEnabled && this.gameState === GameState.MENU) {
      soundEngine.startMenuMusic();
    }
    this.saveProfile();
    this.notifyChange();
  }

  public toggleParticles() {
    this.particlesEnabled = !this.particlesEnabled;
    this.saveProfile();
    this.notifyChange();
  }

  public pauseGame() {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.saveGameSession();
      this.notifyChange();
    }
  }

  public resumeGame() {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.notifyChange();
    }
  }

  public returnToMenu() {
    if (this.gameState === GameState.PAUSED) {
      this.saveGameSession();
    }
    this.gameState = GameState.MENU;
    if (this.soundEnabled) {
      soundEngine.startMenuMusic();
    }
    this.notifyChange();
  }

  private notifyChange() {
    if (this.onStateChange) this.onStateChange();
  }
}
