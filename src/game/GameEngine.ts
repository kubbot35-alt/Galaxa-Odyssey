import {
    GameState,
    DifficultyLevel,
    WeaponMode,
    UpgradeOption,
    GameEngineSnapshot,
} from '../types/game';
import { AchievementProgress } from '../types/achievements';
import type { IGameAudio } from './audio/IGameAudio';
import { createWebPlatform, type PlatformServices } from '../platform/PlatformServices';
import { setStorage } from '../platform/storage/SettingsRepository';
import { InputManager } from './input/InputManager';
import { StorageService } from './persistence/StorageService';
import { AchievementManager, ActiveAchievementToast } from './systems/AchievementManager';
import {
    Star,
    Bullet,
    Bomb,
    Enemy,
    PowerUp,
    Particle,
    PlayerState,
    WeaponAnnouncement,
    PlayerEntityService,
} from './entities/GameEntities';
import { ParticleSystem } from './systems/ParticleSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { WaveSystem } from './systems/WaveSystem';
import { CollisionSystem, ICollisionContext } from './systems/CollisionSystem';
import { CollisionOutcomeHandler } from './systems/CollisionOutcomeHandler';
import { UpgradeSystem, IUpgradeContext } from './systems/UpgradeSystem';
import { PlayerController } from './systems/PlayerController';
import { InputBindings } from './input/InputBindings';
import { ProfileMapper } from './persistence/ProfileMapper';
import { SnapshotBuilder } from './snapshot/SnapshotBuilder';

export type {
    ActiveAchievementToast,
    Star,
    Bullet,
    Bomb,
    Enemy,
    PowerUp,
    Particle,
    PlayerState,
    WeaponAnnouncement,
};

export class GameEngine implements ICollisionContext, IUpgradeContext {
    private _gameState: GameState = GameState.MENU;
    private _difficultyLevel: DifficultyLevel = DifficultyLevel.NORMAL;
    private _twoPlayerMode = false;

    public player1!: PlayerState;
    public player2: PlayerState | null = null;

    public bullets: Bullet[] = [];
    public bombs: Bomb[] = [];
    public enemies: Enemy[] = [];
    public powerUps: PowerUp[] = [];

    private _wave = 0;
    private _credits = 0;
    private _profileScore = 0;
    private _highScore = 0;
    public ownedWeaponLevel = 1;
    public doubleLives = false;
    public infiniteLives = false;

    private _particlesEnabled = true;
    private _soundEnabled = true;

    public spaceHeld = false;
    public secondPlayerFireHeld = false;

    public menuSelection = 0;
    public playerModeSelection = 0;
    public upgradeSelection = 0;
    public settingsSelection = 0;
    public difficultySelection = 1;

    public tookDamageInCurrentWave = false;
    public currentWaveDuration = 0;
    public weaponAnnouncement: WeaponAnnouncement | null = null;

    // Podsystemy domenowe (SRP)
    private readonly _inputManager: InputManager;
    private readonly _audioService: IGameAudio;
    private readonly _achievementManager: AchievementManager;
    private readonly _particleSystem: ParticleSystem;
    private readonly _weaponSystem: WeaponSystem;
    private readonly _waveSystem = new WaveSystem();
    private readonly _collisionSystem = new CollisionSystem();
    private readonly _collisionOutcomeHandler: CollisionOutcomeHandler;
    private readonly _upgradeSystem: UpgradeSystem;
    private readonly _playerController: PlayerController;

    private onStateChange?: () => void;

    /** The platform supplies storage, audio and input devices; defaults to the web platform. */
    constructor(onStateChange?: () => void, platform: PlatformServices = createWebPlatform()) {
        this.onStateChange = onStateChange;
        setStorage(platform.storage);
        this._audioService = platform.audio;
        this._inputManager = new InputManager(platform.createInputSources());
        this._playerController = new PlayerController(this._inputManager);
        this._particleSystem = new ParticleSystem();
        this._weaponSystem = new WeaponSystem(this._audioService);
        this._collisionOutcomeHandler = new CollisionOutcomeHandler(this._audioService);
        this._upgradeSystem = new UpgradeSystem(this._audioService);

        this._achievementManager = new AchievementManager(
            () => this.notifyChange(),
            (rewardCredits: number) => {
                this._credits += rewardCredits;
                this.saveProfile();
            },
            this._audioService
        );

        this.loadProfile();
        this.resetPlayers();
        this.setupInputHandlers();
    }

    // --- DELEGACJA KOLEKCJI I STANU PODSYSTEMÓW ---

    public get inputManager(): InputManager {
        return this._inputManager;
    }

    public get achievementManager(): AchievementManager {
        return this._achievementManager;
    }

    public get particles(): Particle[] {
        return this._particleSystem.particles;
    }
    public set particles(val: Particle[]) {
        this._particleSystem.particles = val;
    }

    public get stars(): Star[] {
        return this._particleSystem.stars;
    }
    public set stars(val: Star[]) {
        this._particleSystem.stars = val;
    }

    public get fireCooldown(): number {
        return this._weaponSystem.fireCooldown;
    }
    public set fireCooldown(val: number) {
        this._weaponSystem.fireCooldown = val;
    }

    public get secondPlayerFireCooldown(): number {
        return this._weaponSystem.secondPlayerFireCooldown;
    }
    public set secondPlayerFireCooldown(val: number) {
        this._weaponSystem.secondPlayerFireCooldown = val;
    }

    public get achievements(): Record<string, AchievementProgress> {
        return this._achievementManager.achievements;
    }

    public get activeToast(): ActiveAchievementToast | null {
        return this._achievementManager.activeToast;
    }

    public get isAchievementsOpen(): boolean {
        return this._achievementManager.isOpen;
    }
    public set isAchievementsOpen(val: boolean) {
        if (val) this._achievementManager.open();
        else this._achievementManager.close();
    }

    // --- GETTERY I SETTERY STANU SESJI ---

    public get gameState(): GameState {
        return this._gameState;
    }
    public set gameState(value: GameState) {
        this._gameState = value;
    }

    public get difficultyLevel(): DifficultyLevel {
        return this._difficultyLevel;
    }
    public set difficultyLevel(value: DifficultyLevel) {
        this._difficultyLevel = value;
    }

    public get twoPlayerMode(): boolean {
        return this._twoPlayerMode;
    }
    public set twoPlayerMode(value: boolean) {
        this._twoPlayerMode = value;
        this._inputManager.isTwoPlayer = value;
    }

    public get wave(): number {
        return this._wave;
    }
    public set wave(value: number) {
        this._wave = value;
    }

    public get credits(): number {
        return this._credits;
    }
    public set credits(value: number) {
        this._credits = value;
    }

    public get profileScore(): number {
        return this._profileScore;
    }
    public set profileScore(value: number) {
        this._profileScore = value;
    }

    public get highScore(): number {
        return this._highScore;
    }
    public set highScore(value: number) {
        this._highScore = value;
    }

    public get soundEnabled(): boolean {
        return this._soundEnabled;
    }
    public set soundEnabled(value: boolean) {
        this._soundEnabled = value;
        this._audioService.setEnabled(value);
    }

    public get particlesEnabled(): boolean {
        return this._particlesEnabled;
    }
    public set particlesEnabled(value: boolean) {
        this._particlesEnabled = value;
    }

    // --- API INTENCJI (COMMAND API) ---

    public startMission(difficulty: DifficultyLevel = DifficultyLevel.NORMAL): void {
        this._difficultyLevel = difficulty;
        this.startNewGame();
    }

    public setDifficulty(level: DifficultyLevel): void {
        this._difficultyLevel = level;
        this.notifyChange();
    }

    public toggleAudio(): boolean {
        this._soundEnabled = !this._soundEnabled;
        this._audioService.setEnabled(this._soundEnabled);
        if (this._soundEnabled && this._gameState === GameState.MENU) {
            this._audioService.startMenuMusic();
        }
        this.saveProfile();
        this.notifyChange();
        return this._soundEnabled;
    }

    public setAudioEnabled(enabled: boolean): void {
        this._soundEnabled = enabled;
        this._audioService.setEnabled(enabled);
        this.saveProfile();
        this.notifyChange();
    }

    public toggleParticles(): void {
        this._particlesEnabled = !this._particlesEnabled;
        this.saveProfile();
        this.notifyChange();
    }

    public loadAchievements(): void {
        this._achievementManager.load();
    }

    public saveAchievements(): void {
        this._achievementManager.save();
    }

    public openAchievements(): void {
        this._achievementManager.open();
    }
    public closeAchievements(): void {
        this._achievementManager.close();
    }
    public toggleAchievements(): void {
        this._achievementManager.toggle();
    }
    public unlockAchievement(id: string): void {
        this._achievementManager.unlock(id);
    }
    public incrementProgress(id: string, amount = 1): void {
        this._achievementManager.increment(id, amount);
    }
    public dismissToast(): void {
        this._achievementManager.dismissToast();
    }
    public isAchievementUnlocked(id: string): boolean {
        return this._achievementManager.isUnlocked(id);
    }
    public getProgress(id: string): number {
        return this._achievementManager.getProgress(id);
    }
    public getUnlockedCount(): number {
        return this._achievementManager.getUnlockedCount();
    }
    public getTotalCount(): number {
        return this._achievementManager.getTotalCount();
    }

    // --- SNAPSHOT STANU DLA REACTA ---

    public getSnapshot(): GameEngineSnapshot {
        return SnapshotBuilder.build(this);
    }

    // --- KONFIGURACJA WEJŚCIA ---

    private setupInputHandlers(): void {
        InputBindings.bind(this._inputManager, this);
    }

    // --- PERSYSTENCJA ---

    public loadProfile(): void {
        ProfileMapper.applyProfile(this, StorageService.loadProfile());
    }

    public saveProfile(): void {
        StorageService.saveProfile(ProfileMapper.toProfileData(this));
    }

    public saveGameSession(): void {
        if (this._gameState !== GameState.PLAYING && this._gameState !== GameState.PAUSED) return;
        StorageService.saveSession(ProfileMapper.toSessionData(this));
        this.saveProfile();
    }

    public hasSavedGame(): boolean {
        return StorageService.hasSavedGame();
    }

    public loadSavedGame(): boolean {
        const data = StorageService.loadSession();
        if (!data) return false;

        this.resetPlayers();
        ProfileMapper.applySession(this, data);

        this._gameState = GameState.PLAYING;
        this.clearEntities();
        this.spawnNextWave();
        this._audioService.stopMenuMusic();
        this.notifyChange();
        return true;
    }

    public clearSavedGame(): void {
        StorageService.clearSession();
    }

    // --- CYKL ŻYCIA ROZGRYWKI ---

    private clearEntities(): void {
        this.bullets = [];
        this.bombs = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
    }

    public resetPlayers(): void {
        const { player1, player2 } = PlayerEntityService.createPlayers(
            this._twoPlayerMode,
            this.ownedWeaponLevel,
            this.doubleLives,
            this.infiniteLives
        );
        this.player1 = player1;
        this.player2 = player2;

        this._inputManager.isTwoPlayer = this._twoPlayerMode;
        this._inputManager.reset();
    }

    public startNewGame(): void {
        this.clearSavedGame();
        this.resetPlayers();
        this._wave = 0;
        this.clearEntities();
        this.tookDamageInCurrentWave = false;
        this.currentWaveDuration = 0;
        this.weaponAnnouncement = null;

        this.unlockAchievement('cadet_takeoff');
        if (this._twoPlayerMode) {
            this.unlockAchievement('coop_commander');
        }

        this._gameState = GameState.PLAYING;
        this.spawnNextWave();
        this._audioService.stopMenuMusic();
        this.notifyChange();
    }

    public spawnNextWave(): void {
        this._waveSystem.evaluateWaveAchievements({
            completedWave: this._wave,
            difficultyLevel: this._difficultyLevel,
            tookDamageInCurrentWave: this.tookDamageInCurrentWave,
            player1Lives: this.player1.lives,
            currentWaveDuration: this.currentWaveDuration,
            unlockAchievement: (id: string) => this.unlockAchievement(id),
            incrementProgress: (id: string, amount?: number) => this.incrementProgress(id, amount),
        });

        this._wave += 1;
        this.currentWaveDuration = 0;
        this.tookDamageInCurrentWave = false;
        this.enemies = this._waveSystem.createWaveEnemies(this._wave, this._difficultyLevel);
    }

    // --- DELEGACJA SYSTEMÓW WALKI, BRONI I EFEKTÓW ---

    public setWeaponMode(mode: WeaponMode): void {
        if (this._weaponSystem.setWeaponMode(this.player1, mode)) {
            this.notifyChange();
        }
    }

    public cycleWeaponMode(direction: 1 | -1 = 1): void {
        if (this._weaponSystem.cycleWeaponMode(this.player1, direction)) {
            this.notifyChange();
        }
    }

    public firePlayer1(): void {
        this._weaponSystem.firePlayer1(this.player1, this.bullets);
    }

    public firePlayer2(): void {
        this._weaponSystem.firePlayer2(this.player2, this.bullets);
    }

    public addExplosion(x: number, y: number, r: number, g: number, b: number, count: number): void {
        this._particleSystem.addExplosion(x, y, r, g, b, count, this._particlesEnabled);
    }

    public addLaserSparks(x: number, y: number, colorHex: string, count = 4): void {
        this._particleSystem.addLaserSparks(x, y, colorHex, count, this._particlesEnabled);
    }

    public intersects(
        x1: number,
        y1: number,
        w1: number,
        h1: number,
        x2: number,
        y2: number,
        w2: number,
        h2: number
    ): boolean {
        return this._collisionSystem.intersects(x1, y1, w1, h1, x2, y2, w2, h2);
    }

    public buyUpgrade(option: UpgradeOption): boolean {
        return this._upgradeSystem.buyUpgrade(option, this);
    }

    // --- GŁÓWNA PĘTLA SYMULACJI ---

    public update(): void {
        this._inputManager.poll();
        this._particleSystem.updateStars();

        if (this.weaponAnnouncement) {
            this.weaponAnnouncement.timer -= 1;
            if (this.weaponAnnouncement.timer <= 0) {
                this.weaponAnnouncement = null;
            }
        }

        if (this._gameState !== GameState.PLAYING) {
            this._particleSystem.updateParticles(this._particlesEnabled);
            return;
        }

        this.currentWaveDuration += 1 / 60;

        this._playerController.update(this);

        // Ruch pocisków, wrogów, bomb i power-upów
        this._waveSystem.updateBullets(this.bullets);
        this._waveSystem.updateEnemiesAndFire(this.enemies, this.bullets, this._wave, this._difficultyLevel);
        this._waveSystem.updateBombs(this.bombs, this._wave, this._difficultyLevel);
        this._waveSystem.updatePowerUps(this.powerUps);

        // Detekcja kolizji
        for (const collision of this._collisionSystem.detectAllCollisions(this)) {
            this._collisionOutcomeHandler.handle(collision, this);
        }

        // Cząsteczki
        this._particleSystem.updateParticles(this._particlesEnabled);

        // Kolejna fala
        if (this.enemies.length === 0 && this._gameState === GameState.PLAYING) {
            this.spawnNextWave();
        }
    }

    public onAllPlayersDead(): void {
        if (this._gameState === GameState.PLAYING) {
            this.clearSavedGame();
            this.saveProfile();
            this._gameState = GameState.GAMEOVER;
            this.notifyChange();
        }
    }

    public pauseGame(): void {
        if (this._gameState === GameState.PLAYING) {
            this._gameState = GameState.PAUSED;
            this.saveGameSession();
            this.notifyChange();
        }
    }

    public resumeGame(): void {
        if (this._gameState === GameState.PAUSED) {
            this._gameState = GameState.PLAYING;
            this.notifyChange();
        }
    }

    public returnToMenu(): void {
        if (this._gameState === GameState.PAUSED) {
            this.saveGameSession();
        }
        this._gameState = GameState.MENU;
        if (this._soundEnabled) {
            this._audioService.startMenuMusic();
        }
        this.notifyChange();
    }

    public notifyChange(): void {
        if (this.onStateChange) this.onStateChange();
    }
}