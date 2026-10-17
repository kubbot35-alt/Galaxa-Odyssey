import { ACHIEVEMENTS, AchievementProgress } from '../../types/achievements';

export class AchievementProgressService {
    public achievements: Record<string, AchievementProgress> = {};

    public initialize(): void {
        for (const achievement of ACHIEVEMENTS) {
            if (!this.achievements[achievement.id]) {
                this.achievements[achievement.id] = {
                    unlocked: false,
                    currentProgress: 0,
                };
            }
        }
    }

    public isUnlocked(id: string): boolean {
        return !!this.achievements[id]?.unlocked;
    }

    public getProgress(id: string): number {
        return this.achievements[id]?.currentProgress ?? 0;
    }

    public getUnlockedCount(): number {
        return ACHIEVEMENTS.filter((achievement) => this.isUnlocked(achievement.id)).length;
    }

    public getTotalCount(): number {
        return ACHIEVEMENTS.length;
    }

    public unlock(id: string): (typeof ACHIEVEMENTS)[number] | undefined {
        const achievement = ACHIEVEMENTS.find((item) => item.id === id);
        if (!achievement) return undefined;

        if (!this.achievements[id]) {
            this.achievements[id] = { unlocked: false, currentProgress: 0 };
        }

        if (this.achievements[id].unlocked) return undefined;

        this.achievements[id].unlocked = true;
        this.achievements[id].unlockedAt = Date.now();
        this.achievements[id].currentProgress = achievement.maxProgress;
        return achievement;
    }

    public increment(id: string, amount: number): 'unknown' | 'unlocked' | 'changed' | 'completed' {
        const achievement = ACHIEVEMENTS.find((item) => item.id === id);
        if (!achievement) return 'unknown';

        if (!this.achievements[id]) {
            this.achievements[id] = { unlocked: false, currentProgress: 0 };
        }

        if (this.achievements[id].unlocked) return 'unlocked';

        const newProgress = (this.achievements[id].currentProgress || 0) + amount;
        this.achievements[id].currentProgress = Math.min(achievement.maxProgress, newProgress);
        return this.achievements[id].currentProgress >= achievement.maxProgress ? 'completed' : 'changed';
    }
}
