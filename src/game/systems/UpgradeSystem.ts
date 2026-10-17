import { SoundType, UpgradeOption, UPGRADE_CONFIGS } from '../../types/game';
import { PlayerState } from '../entities/GameEntities';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';

export interface IUpgradeContext {
    profileScore: number;
    ownedWeaponLevel: number;
    doubleLives: boolean;
    infiniteLives: boolean;
    player1: PlayerState;
    saveProfile: () => void;
    unlockAchievement: (id: string) => void;
    notifyChange: () => void;
}

export class UpgradeSystem {
    constructor(private readonly audio: IGameAudio = new GameAudioService()) {}

    public buyUpgrade(option: UpgradeOption, ctx: IUpgradeContext): boolean {
        const config = UPGRADE_CONFIGS.find((u) => u.id === option);
        if (!config || ctx.profileScore < config.cost) return false;

        if (option === UpgradeOption.DUAL_CANNONS) {
            if (ctx.ownedWeaponLevel >= 2) return false;
            ctx.profileScore -= config.cost;
            ctx.ownedWeaponLevel = 2;
            ctx.player1.weaponLevel = Math.max(ctx.player1.weaponLevel, 2);
        } else if (option === UpgradeOption.TRIPLE_CANNONS) {
            if (ctx.ownedWeaponLevel >= 3) return false;
            ctx.profileScore -= config.cost;
            ctx.ownedWeaponLevel = 3;
            ctx.player1.weaponLevel = 3;
            ctx.unlockAchievement('full_arsenal');
        } else if (option === UpgradeOption.DOUBLE_LIVES) {
            if (ctx.doubleLives) return false;
            ctx.profileScore -= config.cost;
            ctx.doubleLives = true;
            ctx.unlockAchievement('ascendant_fleet');
        } else if (option === UpgradeOption.INFINITE_LIVES) {
            if (ctx.infiniteLives) return false;
            ctx.profileScore -= config.cost;
            ctx.infiniteLives = true;
            ctx.doubleLives = true;
            ctx.unlockAchievement('ascendant_fleet');
        } else {
            return false;
        }

        ctx.saveProfile();
        this.audio.playSound(SoundType.POWER_UP);
        ctx.notifyChange();
        return true;
    }
}