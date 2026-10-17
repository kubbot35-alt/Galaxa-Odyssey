import { describe, expect, it } from 'vitest';
import { DifficultyLevel, EnemyType } from '../../types/game';
import { WaveSystem } from './WaveSystem';

const evaluate = (overrides: Partial<Parameters<WaveSystem['evaluateWaveAchievements']>[0]> = {}) => {
    const unlocked: string[] = [];
    const increments: Array<[string, number | undefined]> = [];
    new WaveSystem().evaluateWaveAchievements({
        completedWave: 1,
        difficultyLevel: DifficultyLevel.NORMAL,
        tookDamageInCurrentWave: true,
        player1Lives: 3,
        currentWaveDuration: 60,
        unlockAchievement: (id) => unlocked.push(id),
        incrementProgress: (id, amount) => increments.push([id, amount]),
        ...overrides,
    });
    return { unlocked, increments };
};

describe('WaveSystem achievement rules', () => {
    it('does nothing before the first completed wave', () => {
        const { unlocked, increments } = evaluate({ completedWave: 0 });
        expect(unlocked).toEqual([]);
        expect(increments).toEqual([]);
    });

    it('first wave unlocks only first_wave and increments wave_three', () => {
        const { unlocked, increments } = evaluate();
        expect(unlocked).toEqual(['first_wave']);
        expect(increments).toEqual([['wave_three', 1]]);
    });

    it('applies wave, difficulty and performance rules in order', () => {
        const { unlocked } = evaluate({
            completedWave: 10,
            difficultyLevel: DifficultyLevel.HARD,
            tookDamageInCurrentWave: false,
            player1Lives: 1,
            currentWaveDuration: 10,
        });
        expect(unlocked).toEqual([
            'first_wave',
            'wave_three',
            'interstellar_ace',
            'cosmic_navigator',
            'void_conqueror',
            'nightmare_veteran',
            'indomitable',
            'near_death_escape',
            'speed_demon',
        ]);
    });

    it('does not award speed_demon for a zero duration', () => {
        expect(evaluate({ currentWaveDuration: 0 }).unlocked).not.toContain('speed_demon');
    });
});

describe('WaveSystem enemy rows', () => {
    const rowTypes = (wave: number) => {
        const enemies = new WaveSystem().createWaveEnemies(wave, DifficultyLevel.HARD);
        return [0, 1, 2, 3].map((r) => enemies[r * 8]?.type);
    };

    it('uses standard enemies in wave 1', () => {
        expect(rowTypes(1).filter(Boolean).every((t) => t === EnemyType.STANDARD)).toBe(true);
    });

    it('introduces special rows as waves progress', () => {
        expect(rowTypes(2)[0]).toBe(EnemyType.ELITE);
        expect(rowTypes(3)[1]).toBe(EnemyType.DIVING);
        expect(rowTypes(4)).toEqual([EnemyType.ELITE, EnemyType.DIVING, EnemyType.SWARM, EnemyType.STANDARD]);
    });
});
