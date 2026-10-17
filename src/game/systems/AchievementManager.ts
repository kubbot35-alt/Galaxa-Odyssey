import { AchievementProgress } from '../../types/achievements';
import { SoundType } from '../../types/game';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import { StorageService } from '../persistence/StorageService';
import { AchievementProgressService } from './AchievementProgressService';

export interface ActiveAchievementToast {
    id: string;
    rewardCredits: number;
    iconName: string;
}

export class AchievementManager {
    private readonly progress = new AchievementProgressService();
    public activeToast: ActiveAchievementToast | null = null;
    private toastTimeout: ReturnType<typeof setTimeout> | number | null = null;
    private _isOpen = false;

    private onStateChange?: () => void;
    private onCreditsReward?: (credits: number) => void;

    constructor(
        onStateChange?: () => void,
        onCreditsReward?: (credits: number) => void,
        private readonly audio: IGameAudio = new GameAudioService()
    ) {
        this.onStateChange = onStateChange;
        this.onCreditsReward = onCreditsReward;
        this.load();
    }

    public get achievements(): Record<string, AchievementProgress> {
        return this.progress.achievements;
    }

    public set achievements(value: Record<string, AchievementProgress>) {
        this.progress.achievements = value;
    }

    public get isOpen(): boolean {
        return this._isOpen;
    }

    public open(): void {
        this._isOpen = true;
        this.notify();
    }

    public close(): void {
        this._isOpen = false;
        this.notify();
    }

    public toggle(): void {
        this._isOpen = !this._isOpen;
        this.notify();
    }

    public load(): void {
        this.achievements = StorageService.loadAchievements(this.achievements);
        this.progress.initialize();
    }

    public save(): void {
        StorageService.saveAchievements(this.achievements);
    }

    public isUnlocked(id: string): boolean {
        return this.progress.isUnlocked(id);
    }

    public getProgress(id: string): number {
        return this.progress.getProgress(id);
    }

    public getUnlockedCount(): number {
        return this.progress.getUnlockedCount();
    }

    public getTotalCount(): number {
        return this.progress.getTotalCount();
    }

    public unlock(id: string): void {
        const ach = this.progress.unlock(id);
        if (!ach) return;

        this.onCreditsReward?.(ach.rewardCredits);

        this.activeToast = {
            id: ach.id,
            rewardCredits: ach.rewardCredits,
            iconName: ach.iconName,
        };

        if (this.toastTimeout !== null) {
            clearTimeout(this.toastTimeout as number);
        }

        this.toastTimeout = setTimeout(() => {
            this.activeToast = null;
            this.notify();
        }, 4500);

        this.audio.playSound(SoundType.POWER_UP);

        this.save();
        this.notify();
    }

    public increment(id: string, amount = 1): void {
        const result = this.progress.increment(id, amount);
        if (result === 'completed') {
            this.unlock(id);
        } else if (result === 'changed') {
            this.save();
        }
    }

    public dismissToast(): void {
        this.activeToast = null;
        if (this.toastTimeout !== null) {
            clearTimeout(this.toastTimeout as number);
            this.toastTimeout = null;
        }
        this.notify();
    }

    private notify(): void {
        this.onStateChange?.();
    }
}