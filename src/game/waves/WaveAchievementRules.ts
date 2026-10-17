import { DifficultyLevel } from '../../types/game';

export interface WaveAchievementContext {
    completedWave: number;
    difficultyLevel: DifficultyLevel;
    tookDamageInCurrentWave: boolean;
    player1Lives: number;
    currentWaveDuration: number;
}

export interface IAchievementSink {
    unlock(id: string): void;
    increment(id: string, amount?: number): void;
}

/** One independent wave-completion rule; rules run in list order. */
export interface IAchievementRule {
    apply(ctx: WaveAchievementContext, sink: IAchievementSink): void;
}

export const unlockWhen = (
    id: string,
    predicate: (ctx: WaveAchievementContext) => boolean
): IAchievementRule => ({
    apply: (ctx, sink) => {
        if (predicate(ctx)) sink.unlock(id);
    },
});

export const incrementEachWave = (id: string, amount = 1): IAchievementRule => ({
    apply: (_ctx, sink) => sink.increment(id, amount),
});

export const DEFAULT_WAVE_ACHIEVEMENT_RULES: readonly IAchievementRule[] = [
    unlockWhen('first_wave', () => true),
    incrementEachWave('wave_three'),
    unlockWhen('wave_three', (c) => c.completedWave >= 3),
    unlockWhen('interstellar_ace', (c) => c.completedWave >= 5),
    unlockWhen('cosmic_navigator', (c) => c.completedWave >= 10),
    unlockWhen('void_conqueror', (c) => c.difficultyLevel === DifficultyLevel.HARD),
    unlockWhen('nightmare_veteran', (c) => c.difficultyLevel === DifficultyLevel.HARD && c.completedWave >= 3),
    unlockWhen('indomitable', (c) => !c.tookDamageInCurrentWave),
    unlockWhen('near_death_escape', (c) => c.player1Lives === 1),
    unlockWhen('speed_demon', (c) => c.currentWaveDuration > 0 && c.currentWaveDuration < 20),
];
