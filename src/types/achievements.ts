// Re-eksport stałej konfiguracji osiągnięć z src/config/gameplay/achievements
export { ACHIEVEMENTS } from '../config/gameplay/achievements';

export interface Achievement {
    id: string;
    category: 'combat' | 'survival' | 'progression' | 'mastery';
    rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
    rewardCredits: number;
    maxProgress: number;
    iconName:
        | 'trophy'
        | 'skull'
        | 'zap'
        | 'shield'
        | 'target'
        | 'star'
        | 'flame'
        | 'users'
        | 'crosshair'
        | 'award'
        | 'rocket'
        | 'sparkles'
        | 'heart'
        | 'medal';
}

export interface AchievementProgress {
    unlocked: boolean;
    unlockedAt?: number;
    currentProgress: number;
}