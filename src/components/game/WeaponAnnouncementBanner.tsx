import React from 'react';
import { Sparkles } from 'lucide-react';
import type { WeaponAnnouncement } from '../../game/entities/GameEntities';
import { localizeAnnouncement } from '../../game/combatText';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface WeaponAnnouncementBannerProps {
    announcement: WeaponAnnouncement;
}

export const WeaponAnnouncementBanner: React.FC<WeaponAnnouncementBannerProps> = ({ announcement }) => {
    const { t } = useLocale();
    const { color } = announcement;
    const { title, subtitle } = localizeAnnouncement(announcement, t);

    return (
        <div
            className="self-center px-6 py-2 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-3 transition-all animate-bounce"
            style={{
                backgroundColor: 'rgba(8, 15, 42, 0.92)',
                borderColor: color,
                boxShadow: `0 0 25px ${color}40`,
            }}
        >
            <Sparkles size={18} style={{ color }} />
            <div>
                <div className="font-black text-sm text-white tracking-wide">{title}</div>
                <div className="text-[11px] text-slate-300">{subtitle}</div>
            </div>
        </div>
    );
};
