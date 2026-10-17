import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENTS } from '../../types/achievements';
import { AchievementManager } from './AchievementManager';

const { playSound, saveAchievements } = vi.hoisted(() => ({
    playSound: vi.fn(),
    saveAchievements: vi.fn(),
}));

vi.mock('../audio/soundEngine', () => ({
    soundEngine: { playSound },
}));

vi.mock('../persistence/StorageService', () => ({
    StorageService: {
        loadAchievements: (defaults: unknown) => defaults,
        saveAchievements,
    },
}));

describe('AchievementManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        playSound.mockClear();
        saveAchievements.mockClear();
    });

    it('initializes progress for every configured achievement', () => {
        const manager = new AchievementManager();

        expect(Object.keys(manager.achievements)).toHaveLength(ACHIEVEMENTS.length);
        expect(manager.getTotalCount()).toBe(ACHIEVEMENTS.length);
        expect(manager.getUnlockedCount()).toBe(0);
    });

    it('delegates progress rules and runs unlock effects once on completion', () => {
        const onStateChange = vi.fn();
        const onCreditsReward = vi.fn();
        const manager = new AchievementManager(onStateChange, onCreditsReward);
        const achievement = ACHIEVEMENTS[0];

        manager.increment(achievement.id, achievement.maxProgress);
        manager.increment(achievement.id);

        expect(manager.isUnlocked(achievement.id)).toBe(true);
        expect(manager.getProgress(achievement.id)).toBe(achievement.maxProgress);
        expect(manager.activeToast).toMatchObject({ id: achievement.id });
        expect(onCreditsReward).toHaveBeenCalledTimes(1);
        expect(onCreditsReward).toHaveBeenCalledWith(achievement.rewardCredits);
        expect(playSound).toHaveBeenCalledTimes(1);
        expect(saveAchievements).toHaveBeenCalledTimes(1);
        expect(onStateChange).toHaveBeenCalledTimes(1);
    });

    it('does not save or notify for unknown achievement ids', () => {
        const onStateChange = vi.fn();
        const manager = new AchievementManager(onStateChange);

        manager.increment('not-a-configured-achievement');

        expect(saveAchievements).not.toHaveBeenCalled();
        expect(onStateChange).not.toHaveBeenCalled();
    });
});
