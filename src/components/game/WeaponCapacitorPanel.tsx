import React from 'react';
import { Zap } from 'lucide-react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface WeaponCapacitorPanelProps {
    energyPercent: number;
    score: number;
    credits: number;
}

export const WeaponCapacitorPanel: React.FC<WeaponCapacitorPanelProps> = ({ energyPercent, score, credits }) => {
    const { t } = useLocale();
    return (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 shadow-lg min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Zap size={14} className="text-amber-400" /> {t.weaponCapacitorPanel.weaponCapacitor}
                </span>
                <span className="font-bold text-amber-200">{energyPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-amber-500/20">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${energyPercent}%` }}
                />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">{t.weaponCapacitorPanel.score}</span>
                <span className="font-bold text-cyan-300">{score.toLocaleString()}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">{t.weaponCapacitorPanel.credits}</span>
                <span className="font-bold text-amber-400">+{credits}</span>
            </div>
        </div>
    );
};
