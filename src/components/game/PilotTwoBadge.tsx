import React from 'react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface PilotTwoBadgeProps {
    lives: number;
}

export const PilotTwoBadge: React.FC<PilotTwoBadgeProps> = ({ lives }) => {
    const { t } = useLocale();
    return (
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-pink-500/30 text-[11px] text-pink-300 flex items-center gap-2">
            <span className="font-bold">PILOT 2:</span>
            <span>{lives > 0 ? t.pilotTwoBadge.lives(lives) : t.pilotTwoBadge.kia}</span>
        </div>
    );
};
