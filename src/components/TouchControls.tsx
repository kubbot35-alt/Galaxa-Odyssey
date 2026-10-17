import React from 'react';
import { WeaponMode, WEAPON_MODE_CONFIGS } from '../types/game';
import type { VirtualButtonAction } from '../types/input';
import { TouchActionButton } from './touch-controls/TouchActionButton';
import { useLocale } from '../config/content/locales/LocaleProvider';

interface TouchControlsProps {
    isPlaying: boolean;
    unlockedWeaponModes: WeaponMode[];
    currentWeaponMode: WeaponMode;
    isTwoPlayer: boolean;
    onActionChange: (action: VirtualButtonAction, isPressed: boolean) => void;
    onWeaponModeChange: (mode: WeaponMode) => void;
    onPause: () => void;
}

const MOVEMENT_BUTTONS: {
    action: 'left' | 'right' | 'up' | 'down';
    label: string;
}[] = [
    { action: 'left', label: '◀' },
    { action: 'right', label: '▶' },
    { action: 'up', label: '▲' },
    { action: 'down', label: '▼' },
];

const movementButtonClassName =
    'w-12 h-12 sm:w-13 sm:h-13 bg-cyan-950/80 border-2 border-cyan-400/60 rounded-xl active:bg-cyan-600/40 text-cyan-300 font-bold text-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform touch-none';

export const TouchControls: React.FC<TouchControlsProps> = ({
    isPlaying,
    unlockedWeaponModes,
    currentWeaponMode,
    isTwoPlayer,
    onActionChange,
    onWeaponModeChange,
    onPause,
}) => {
    const { t } = useLocale();
    if (!isPlaying) return null;

    return (
        <div className="w-full max-w-[900px] mt-2 px-2 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-1.5 sm:gap-2" aria-label={t.touchControls.movementControls}>
                {MOVEMENT_BUTTONS.map(({ action, label }) => (
                    <TouchActionButton
                        key={action}
                        action={action}
                        title={t.touchMovement[action]}
                        className={movementButtonClassName}
                        onActionChange={onActionChange}
                    >
                        {label}
                    </TouchActionButton>
                ))}
            </div>

            <div className="flex items-center gap-1.5 order-last sm:order-none w-full sm:w-auto justify-center">
                {unlockedWeaponModes.map((mode) => {
                    const config = WEAPON_MODE_CONFIGS[mode];
                    const isCurrent = currentWeaponMode === mode;

                    return (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => onWeaponModeChange(mode)}
                            style={{
                                borderColor: isCurrent ? config.color : 'rgba(71, 85, 105, 0.4)',
                                backgroundColor: isCurrent ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.6)',
                                color: isCurrent ? config.color : '#94a3b8',
                            }}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold tracking-wider active:scale-95 transition shadow-sm"
                        >
                            {mode === WeaponMode.LASER_BEAM && '⚡ '}
                            {mode === WeaponMode.TRIPLE_SHOT && '🔱 '}
                            {mode === WeaponMode.PLASMA_SPREAD && '🔮 '}
                            {t.weaponLabels[mode].label}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={onPause}
                    className="px-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-slate-300 text-[11px] font-mono font-semibold tracking-wider hover:bg-slate-800 transition"
                >
                    {t.touchControls.pause}
                </button>
            </div>

            <div className="flex items-center gap-3">
                {isTwoPlayer && (
                    <div className="hidden sm:flex items-center gap-1">
                        <span className="text-[11px] text-pink-400 font-mono">{t.touchControls.p2ADF}</span>
                    </div>
                )}
                <TouchActionButton
                    action="fire"
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-cyan-600/80 to-blue-500/80 border-2 border-cyan-300 rounded-2xl active:scale-95 text-white font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(55,245,255,0.4)] transition-transform touch-none"
                    onActionChange={onActionChange}
                >
                    {t.touchControls.fire}
                </TouchActionButton>
            </div>
        </div>
    );
};
