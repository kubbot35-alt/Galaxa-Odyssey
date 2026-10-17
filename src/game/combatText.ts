import type { TranslationSchema } from '../config/content/locales';

export const HIT_NOTICE = {
    SHIELD_DEFLECTED: 'SHIELD DEFLECTED',
    CRITICAL_HULL_HIT: 'CRITICAL HULL HIT!',
    shieldDamage: (damage: number) => `-${damage} SHIELD`,
} as const;

export type WeaponAnnouncementId =
    | 'TRIPLE_SHOT'
    | 'LASER_BEAM'
    | 'PLASMA_SPREAD'
    | 'SHIELD_RESTORED'
    | 'EXTRA_LIFE'
    | 'CANNON_LEVEL';

export interface LocalizableAnnouncement {
    id?: WeaponAnnouncementId;
    level?: number;
    title: string;
    subtitle: string;
}

export const localizeHitNotice = (notice: string, t: TranslationSchema): string => {
    if (notice === HIT_NOTICE.SHIELD_DEFLECTED) return t.combatText.shieldDeflected;
    if (notice === HIT_NOTICE.CRITICAL_HULL_HIT) return t.combatText.criticalHullHit;
    const shieldMatch = /^-(\d+) SHIELD$/.exec(notice);
    if (shieldMatch) return t.combatText.shieldDamage(shieldMatch[1]);
    return notice;
};

// Announcement titles start with an emoji prefix that is language-neutral.
export const localizeAnnouncement = (
    announcement: LocalizableAnnouncement,
    t: TranslationSchema,
): { title: string; subtitle: string } => {
    const icon = announcement.title.slice(0, Math.max(0, announcement.title.indexOf(' ')));
    const withIcon = (text: string) => (icon ? `${icon} ${text}` : text);

    switch (announcement.id) {
        case 'TRIPLE_SHOT':
            return {
                title: withIcon(t.combatText.tripleShotEngaged),
                subtitle: t.combatText.n3WayAngledFan,
            };
        case 'LASER_BEAM':
            return {
                title: withIcon(t.combatText.hyperLaserBeamEngaged),
                subtitle: t.combatText.piercingCoherentLaserColumn,
            };
        case 'PLASMA_SPREAD':
            return {
                title: withIcon(t.combatText.plasmaSpreadEngaged),
                subtitle: t.combatText.n5WayHeavyDisruption,
            };
        case 'SHIELD_RESTORED':
            return {
                title: withIcon(t.combatText.maximumShieldRestored),
                subtitle: t.combatText.deflectorSystemOverchargedTo,
            };
        case 'EXTRA_LIFE':
            return {
                title: withIcon(t.combatText.extraPilotLifeAcquired),
                subtitle: t.combatText.hullBackupUnitOnline,
            };
        case 'CANNON_LEVEL':
            return {
                title: withIcon(t.combatText.cannonLevel(announcement.level ?? 1)),
                subtitle: t.combatText.primaryFirepowerTierUpgraded,
            };
        default:
            return { title: announcement.title, subtitle: announcement.subtitle };
    }
};