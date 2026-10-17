import React from 'react';
import { Crosshair, Sparkles, Zap, Layers } from 'lucide-react';
import { WeaponMode, WEAPON_MODE_CONFIGS } from '../../types/game';
import { useLocale } from '../../config/content/locales/LocaleProvider';

const WEAPON_SLOTS = [
    { mode: WeaponMode.STANDARD, num: '1', icon: Crosshair },
    { mode: WeaponMode.TRIPLE_SHOT, num: '2', icon: Sparkles },
    { mode: WeaponMode.LASER_BEAM, num: '3', icon: Zap },
    { mode: WeaponMode.PLASMA_SPREAD, num: '4', icon: Layers },
];

interface WeaponSelectorProps {
    unlockedModes: WeaponMode[];
    activeMode: WeaponMode;
    onSelect: (mode: WeaponMode) => void;
}

export const WeaponSelector: React.FC<WeaponSelectorProps> = ({ unlockedModes, activeMode, onSelect }) => {
    const { t } = useLocale();
    return (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl mx-auto sm:mx-0">
            {WEAPON_SLOTS.map(({ mode, num, icon: Icon }) => {
                const cfg = WEAPON_MODE_CONFIGS[mode];
                const isUnlocked = unlockedModes.includes(mode);
                const isActive = activeMode === mode;

                return (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onSelect(mode)}
                        disabled={!isUnlocked}
                        className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-mono font-bold text-xs ${
                            isActive
                                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                : isUnlocked
                                    ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300'
                                    : 'bg-slate-900/40 border border-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                    >
                        <Icon size={14} style={{ color: isUnlocked ? cfg.color : '#64748b' }} />
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[10px] text-slate-400">[{num}]</span>
                            <span>{t.weaponLabels[mode].label}</span>
                        </div>
                        {isActive && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />}
                    </button>
                );
            })}
        </div>
    );
};
