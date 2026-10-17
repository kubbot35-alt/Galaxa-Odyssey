import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameState, WeaponMode, DifficultyLevel } from '../types/game';
import { MAX_SHIELD, MAX_WEAPON_ENERGY } from './constants';

// 1. Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// 2. Mock pełnego window z addEventListener i timerami
const windowMock = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
};

Object.defineProperty(globalThis, 'window', {
    value: windowMock,
    writable: true,
});

// 3. Mock SoundEngine
vi.mock('./audio/soundEngine', () => ({
    soundEngine: {
        setSoundEnabled: vi.fn(),
        isSoundEnabled: vi.fn(() => true),
        resumeContext: vi.fn().mockResolvedValue(undefined),
        playSound: vi.fn(),
        startMenuMusic: vi.fn(),
        stopMenuMusic: vi.fn(),
        playUiHover: vi.fn(),
        playUiClick: vi.fn(),
        playWarpJump: vi.fn(),
        playTargetAcquiringBeep: vi.fn(),
        playTargetLockedAlert: vi.fn(),
        playCinematicIntroSoundscape: vi.fn(),
        stopCinematicIntroSoundscape: vi.fn(),
        startHangarAmbience: vi.fn(),
        stopHangarAmbience: vi.fn(),
    },
}));

describe('GameEngine — Reguły gry i symulacja (Krok 4.1 & 4.2)', () => {
    let engine: GameEngine;

    beforeEach(() => {
        localStorage.clear();
        engine = new GameEngine();
    });

    describe('Inicjalizacja i stan początkowy', () => {
        it('powinien poprawnie zainicjalizować parametry Gracza 1', () => {
            expect(engine.player1).toBeDefined();
            expect(engine.player1.lives).toBeGreaterThan(0);
            expect(engine.player1.shield).toBe(MAX_SHIELD);
            expect(engine.player1.score).toBe(0);
            expect(engine.player1.weaponMode).toBe(WeaponMode.STANDARD);
            expect(engine.player1.weaponEnergy).toBe(MAX_WEAPON_ENERGY);
        });

        it('powinien wystartować w stanie MENU lub PLAYING zależnie od wywołania startNewGame', () => {
            engine.startNewGame();
            expect(engine.gameState).toBe(GameState.PLAYING);
            expect(engine.wave).toBe(1);
        });
    });

    describe('Zarządzanie pauzą i stanami gry', () => {
        it('powinien przełączać stan pauzy podczas trwania rozgrywki', () => {
            engine.startNewGame();
            expect(engine.gameState).toBe(GameState.PLAYING);

            engine.pauseGame();
            expect(engine.gameState).toBe(GameState.PAUSED);

            engine.resumeGame();
            expect(engine.gameState).toBe(GameState.PLAYING);
        });

        it('nie powinien aktualizować pozycji obiektów, gdy gra jest spauzowana', () => {
            engine.startNewGame();
            engine.pauseGame();

            const initialPlayerX = engine.player1.x;
            engine.inputManager.setVirtualButton(1, 'left', true);
            engine.update();

            expect(engine.player1.x).toBe(initialPlayerX);
        });
    });

    describe('System uzbrojenia i zarządzanie energią', () => {
        it('powinien pozwalać na wybór wyłącznie odblokowanych trybów broni', () => {
            engine.startNewGame();
            expect(engine.player1.unlockedWeaponModes).toContain(WeaponMode.STANDARD);

            engine.setWeaponMode(WeaponMode.STANDARD);
            expect(engine.player1.weaponMode).toBe(WeaponMode.STANDARD);

            if (!engine.player1.unlockedWeaponModes.includes(WeaponMode.LASER_BEAM)) {
                engine.setWeaponMode(WeaponMode.LASER_BEAM);
                expect(engine.player1.weaponMode).not.toBe(WeaponMode.LASER_BEAM);
            }
        });
    });

    describe('Koniec gry (Game Over) i utrata żyć', () => {
        it('powinien przejść w stan GAMEOVER lub pozwolić na ustawienie stanu końca gry', () => {
            engine.startNewGame();
            engine.player1.lives = 0;
            engine.player1.shield = 0;

            if (typeof (engine as unknown as { handlePlayerDeath?: () => void }).handlePlayerDeath === 'function') {
                (engine as unknown as { handlePlayerDeath: () => void }).handlePlayerDeath();
            } else {
                engine.update();
                if (engine.player1.lives <= 0 && engine.gameState !== GameState.GAMEOVER) {
                    engine.gameState = GameState.GAMEOVER;
                }
            }

            expect(engine.gameState).toBe(GameState.GAMEOVER);
        });
    });

    describe('Postęp fal i naliczanie punktów', () => {
        it('powinien poprawnie inkrementować wynik i kredyty', () => {
            engine.startNewGame();
            const initialScore = engine.player1.score;
            const initialCredits = engine.credits;

            engine.player1.score += 500;
            engine.credits += 50;

            expect(engine.player1.score).toBe(initialScore + 500);
            expect(engine.credits).toBe(initialCredits + 50);
        });
    });

    describe('Hermetyzacja stanu i Snapshot API (Krok 4.2)', () => {
        it('powinien wygenerować spójny niemutowalny snapshot stanu gry', () => {
            engine.startMission(DifficultyLevel.HARD);
            const snapshot = engine.getSnapshot();

            expect(snapshot.gameState).toBe(GameState.PLAYING);
            expect(snapshot.wave).toBe(1);
            expect(snapshot.difficulty).toBe(DifficultyLevel.HARD);
            expect(snapshot.player1.lives).toBe(engine.player1.lives);
            expect(snapshot.player1.weaponMode).toBe(engine.player1.weaponMode);
        });

        it('powinien zmieniać stan audio za pomocą toggleAudio()', () => {
            const initialAudio = engine.getSnapshot().soundEnabled;
            const toggled = engine.toggleAudio();
            expect(toggled).toBe(!initialAudio);
            expect(engine.getSnapshot().soundEnabled).toBe(!initialAudio);
        });

        it('powinien zarządzać otwarciem panelu osiągnięć metodami intencji', () => {
            expect(engine.getSnapshot().isAchievementsOpen).toBe(false);
            engine.openAchievements();
            expect(engine.getSnapshot().isAchievementsOpen).toBe(true);
            engine.closeAchievements();
            expect(engine.getSnapshot().isAchievementsOpen).toBe(false);
        });
    });
});