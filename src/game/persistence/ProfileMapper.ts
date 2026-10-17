import { GameSaveData, WeaponMode } from '../../types/game';
import { PlayerState } from '../entities/GameEntities';
import { UserProfileData } from './StorageService';

export interface IProfileState {
    credits: number;
    profileScore: number;
    highScore: number;
    ownedWeaponLevel: number;
    doubleLives: boolean;
    infiniteLives: boolean;
    soundEnabled: boolean;
    particlesEnabled: boolean;
}

export interface ISessionState extends IProfileState {
    wave: number;
    player1: PlayerState;
}

/** Czyste mapowanie stanu gry <-> formaty zapisu (bez I/O). */
export class ProfileMapper {
    public static toProfileData(state: IProfileState): UserProfileData {
        return {
            credits: state.credits,
            profileScore: state.profileScore,
            highScore: state.highScore,
            ownedWeaponLevel: state.ownedWeaponLevel,
            doubleLives: state.doubleLives,
            infiniteLives: state.infiniteLives,
            soundEnabled: state.soundEnabled,
            particlesEnabled: state.particlesEnabled,
        };
    }

    public static applyProfile(target: IProfileState, data: UserProfileData): void {
        target.credits = data.credits;
        target.profileScore = data.profileScore;
        target.highScore = data.highScore;
        target.ownedWeaponLevel = data.ownedWeaponLevel;
        target.doubleLives = data.doubleLives;
        target.infiniteLives = data.infiniteLives;
        if (typeof data.soundEnabled === 'boolean') target.soundEnabled = data.soundEnabled;
        if (typeof data.particlesEnabled === 'boolean') target.particlesEnabled = data.particlesEnabled;
    }

    public static toSessionData(state: ISessionState): GameSaveData {
        const p1 = state.player1;
        return {
            lives: p1.lives,
            weaponLevel: p1.weaponLevel,
            weaponMode: p1.weaponMode,
            unlockedModes: p1.unlockedWeaponModes,
            score: p1.score,
            stage: state.wave,
            credits: state.credits,
            ownedWeaponLevel: state.ownedWeaponLevel,
            doubleLives: state.doubleLives,
            infiniteLives: state.infiniteLives,
            highScore: state.highScore,
            profileScore: state.profileScore,
        };
    }

    /** Wymaga wcześniej zresetowanych graczy; ustawia też numer fali poprzedzającej zapisaną. */
    public static applySession(target: ISessionState, data: GameSaveData): void {
        const p1 = target.player1;
        p1.lives = data.lives ?? 3;
        p1.weaponLevel = data.weaponLevel ?? 1;
        p1.weaponMode = data.weaponMode ?? WeaponMode.STANDARD;
        p1.unlockedWeaponModes = data.unlockedModes ?? [WeaponMode.STANDARD];
        p1.score = data.score ?? 0;
        target.wave = Math.max(0, (data.stage ?? 1) - 1);
        target.credits = data.credits ?? target.credits;
        target.ownedWeaponLevel = data.ownedWeaponLevel ?? target.ownedWeaponLevel;
        target.doubleLives = !!data.doubleLives;
        target.infiniteLives = !!data.infiniteLives;
    }
}
