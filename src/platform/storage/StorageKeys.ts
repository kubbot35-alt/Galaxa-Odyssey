/** Single source of truth for persisted key names. Values are stable (existing saves depend on them). */
export const StorageKeys = {
    session: 'galaxa_odyssey_save',
    profile: 'galaxa_odyssey_profile',
    achievements: 'galaxa_odyssey_achievements',
    locale: 'galaxa_odyssey_locale',
    shipSkin: 'galaxa_ship_skin',
    introSeen: 'galaxa_intro_seen',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
