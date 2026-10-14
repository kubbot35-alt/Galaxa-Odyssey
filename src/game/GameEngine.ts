import {
  GameState,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  EnemyType,
  ENEMY_CONFIGS,
  PowerUpType,
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
  MAX_SHIELD,
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
  vy: number;
  isFromPlayer: boolean;
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
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
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

    // Ensure all registered achievements exist in state
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

    // If already unlocked, ignore
    if (this.achievements[id].unlocked) return;

    this.achievements[id].unlocked = true;
    this.achievements[id].unlockedAt = Date.now();
    this.achievements[id].currentProgress = ach.maxProgress;

    // Grant bonus credits
    this.credits += ach.rewardCredits;

    // Trigger toast notification
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

    if (this.twoPlayerMode) {
      this.unlockAchievement('coop_commander');
    }

    this.gameState = GameState.PLAYING;
    this.spawnNextWave();
    soundEngine.stopMenuMusic();
    this.notifyChange();
  }

  public spawnNextWave() {
    // Check wave achievements for previous wave if completed
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
        this.enemies.push({
          x,
          y,
          startX: x,
          startY: y,
          angle: Math.random() * Math.PI * 2,
          type,
          diving: false,
        });
      }
    }
  }

  public firePlayer1() {
    soundEngine.playSound(SoundType.SHOOT);
    const p = this.player1;
    const lvl = p.weaponLevel;

    if (lvl === 1) {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    } else if (lvl === 2) {
      this.bullets.push({
        x: p.x + 8,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + p.width - 8,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    } else {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y - 4,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + p.width - 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    }
    this.fireCooldown = Math.max(5, 12 - lvl * 2);
  }

  public firePlayer2() {
    if (!this.player2 || this.player2.lives <= 0) return;
    soundEngine.playSound(SoundType.SHOOT);
    const p = this.player2;
    const lvl = p.weaponLevel;

    if (lvl === 1) {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    } else if (lvl === 2) {
      this.bullets.push({
        x: p.x + 8,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + p.width - 8,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    } else {
      this.bullets.push({
        x: p.x + p.width / 2,
        y: p.y - 4,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
      this.bullets.push({
        x: p.x + p.width - 2,
        y: p.y,
        vy: -11,
        isFromPlayer: true,
      });
    }
    this.secondPlayerFireCooldown = Math.max(5, 12 - lvl * 2);
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

  public update() {
    // Background starfield update
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
    }

    if (this.gameState !== GameState.PLAYING) {
      // In menu screens, update ambient particles
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

    // Player 1 continuous fire
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (this.spaceHeld && this.fireCooldown === 0 && this.player1.lives > 0) {
      this.firePlayer1();
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

    // Bullets movement
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy;
      if (b.y < -20 || b.y > GAME_HEIGHT + 20) {
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

    // Powerups update
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += 2.2;
      if (p.y > GAME_HEIGHT) {
        this.powerUps.splice(i, 1);
      }
    }

    // Resolve Collisions
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

  private resolveBulletHits() {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.isFromPlayer) continue;

      let bulletHit = false;

      // Check bomb hits
      for (let bmi = this.bombs.length - 1; bmi >= 0; bmi--) {
        const bomb = this.bombs[bmi];
        if (this.intersects(b.x - 3, b.y, 6, 12, bomb.x, bomb.y, BOMB_SIZE, BOMB_SIZE)) {
          this.bullets.splice(bi, 1);
          this.bombs.splice(bmi, 1);
          this.addExplosion(bomb.x + 12, bomb.y + 12, 255, 70, 80, 45);
          soundEngine.playSound(SoundType.EXPLOSION);
          bulletHit = true;

          // Achievement progression
          this.incrementProgress('bomb_defuser', 1);
          break;
        }
      }
      if (bulletHit) continue;

      // Check enemy hits
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (this.intersects(b.x - 3, b.y, 6, 12, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
          this.bullets.splice(bi, 1);
          this.enemies.splice(ei, 1);
          const cfg = ENEMY_CONFIGS[enemy.type];
          this.addExplosion(enemy.x + 16, enemy.y + 16, 255, 0, 255, 25);
          soundEngine.playSound(SoundType.EXPLOSION);

          this.player1.score += cfg.score;
          this.credits += cfg.credits;
          this.profileScore += cfg.score;
          this.highScore = Math.max(this.highScore, this.player1.score);

          // Achievements trigger
          if (enemy.type === EnemyType.ELITE) {
            this.incrementProgress('elite_hunter', 1);
            this.incrementProgress('boss_slayer', 1);
          }

          if (this.player1.score >= 3000) {
            this.unlockAchievement('high_roller');
          }

          if (Math.random() < 0.1) {
            this.powerUps.push({
              x: enemy.x,
              y: enemy.y,
              type: Math.random() < 0.5 ? PowerUpType.EXTRA_LIFE : PowerUpType.WEAPON,
            });
          }
          break;
        }
      }
    }
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

    // Check game over
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
        if (this.intersects(p.x, p.y, POWERUP_SIZE, POWERUP_SIZE, player.x, player.y, player.width, player.height)) {
          this.powerUps.splice(pi, 1);
          soundEngine.playSound(SoundType.POWER_UP);

          // Power surge achievement tracking
          this.incrementProgress('power_surge', 1);

          if (p.type === PowerUpType.EXTRA_LIFE) {
            player.lives += 1;
          } else if (p.type === PowerUpType.WEAPON) {
            player.weaponLevel = Math.min(3, player.weaponLevel + 1);
            if (player.weaponLevel >= 3) {
              this.unlockAchievement('full_arsenal');
            }
          }
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
