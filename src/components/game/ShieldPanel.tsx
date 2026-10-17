import React from 'react';
import { Shield } from 'lucide-react';
import { localizeHitNotice } from '../../game/combatText';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface ShieldPanelProps {
    shieldPercent: number;
    shieldLagPercent: number;
    lives: number;
    isTakingDamage: boolean;
    hitNotice?: string | null;
}

export const ShieldPanel: React.FC<ShieldPanelProps> = ({
    shieldPercent,
    shieldLagPercent,
    lives,
    isTakingDamage,
    hitNotice,
}) => {
    const { t } = useLocale();
    return (
        <div
            className={`flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border shadow-lg min-w-[240px] transition-colors duration-150 ${
                isTakingDamage ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-cyan-500/30'
            }`}
        >
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Shield size={14} className={isTakingDamage ? 'text-red-400 animate-spin' : 'text-cyan-400'} /> {t.shieldPanel.deflectorShield}
                </span>
                <span className={`font-bold ${isTakingDamage ? 'text-red-300' : 'text-cyan-200'}`}>{shieldPercent}%</span>
            </div>

            <div className="relative w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-cyan-500/20">
                <div
                    className="absolute inset-y-0 left-0 bg-red-500/80 transition-all duration-300 ease-out"
                    style={{ width: `${shieldLagPercent}%` }}
                />
                <div
                    className={`relative h-full transition-all duration-150 ${
                        shieldPercent > 50
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                            : shieldPercent > 20
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
                    } ${isTakingDamage ? 'brightness-150' : ''}`}
                    style={{ width: `${shieldPercent}%` }}
                />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">{t.shieldPanel.hullReserves}</span>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                        <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-sm bg-cyan-400 border border-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                            title={t.shieldPanel.lifeUnit(i + 1)}
                        />
                    ))}
                    {lives <= 0 && <span className="text-red-400 font-bold">{t.shieldPanel.critical}</span>}
                </div>
            </div>

            {hitNotice && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-[10px] text-red-300 font-bold animate-pulse">
                    <span>⚡ {localizeHitNotice(hitNotice, t)}</span>
                </div>
            )}
        </div>
    );
};
