import { GameSaveData } from '../../types/game';
import { StorageKeys } from '../../platform/storage/StorageKeys';
import {
    getStorage,
    jsonCodec,
    SettingsRepository,
    type IStorageCodec,
} from '../../platform/storage/SettingsRepository';

export interface UserProfileData {
    credits: number;
    profileScore: number;
    highScore: number;
    ownedWeaponLevel: number;
    doubleLives: boolean;
    infiniteLives: boolean;
    soundEnabled?: boolean;
    particlesEnabled?: boolean;
}

const defaultProfile = (): UserProfileData => ({
    credits: 0,
    profileScore: 0,
    highScore: 0,
    ownedWeaponLevel: 1,
    doubleLives: false,
    infiniteLives: false,
    soundEnabled: true,
    particlesEnabled: true,
});

const profileCodec: IStorageCodec<UserProfileData> = {
    encode: (profile) => JSON.stringify(profile),
    decode: (raw) => {
        const data = JSON.parse(raw);
        return {
            credits: data.credits ?? 0,
            profileScore: data.profileScore ?? 0,
            highScore: data.highScore ?? 0,
            ownedWeaponLevel: data.ownedWeaponLevel ?? 1,
            doubleLives: !!data.doubleLives,
            infiniteLives: !!data.infiniteLives,
            soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : true,
            particlesEnabled: typeof data.particlesEnabled === 'boolean' ? data.particlesEnabled : true,
        };
    },
};

const profileRepo = new SettingsRepository<UserProfileData>(getStorage, StorageKeys.profile, defaultProfile, profileCodec);
const sessionRepo = new SettingsRepository<GameSaveData | null>(getStorage, StorageKeys.session, () => null);
const achievementsRepo = new SettingsRepository<unknown>(getStorage, StorageKeys.achievements, () => null, jsonCodec<unknown>());

export class StorageService {
    public static loadProfile(): UserProfileData {
        return profileRepo.load();
    }

    public static saveProfile(profile: UserProfileData): void {
        profileRepo.save(profile);
    }

    public static loadSession(): GameSaveData | null {
        return sessionRepo.load();
    }

    public static saveSession(session: GameSaveData): void {
        sessionRepo.save(session);
    }

    public static hasSavedGame(): boolean {
        return sessionRepo.exists();
    }

    public static clearSession(): void {
        sessionRepo.clear();
    }

    public static loadAchievements<T>(defaultAchievements: T): T {
        return (achievementsRepo.load() as T | null) ?? defaultAchievements;
    }

    public static saveAchievements(achievements: unknown): void {
        achievementsRepo.save(achievements);
    }

    /** Wipes local pilot progress (profile + achievements); optionally the saved ship skin too. */
    public static resetPilotData(options: { includeShipSkin?: boolean } = {}): void {
        profileRepo.clear();
        achievementsRepo.clear();
        if (options.includeShipSkin) shipSkinRepo.clear();
    }
}

export const shipSkinRepo = new SettingsRepository<string | null>(
    getStorage,
    StorageKeys.shipSkin,
    () => null,
    { encode: (v) => v ?? '', decode: (raw) => raw }
);
