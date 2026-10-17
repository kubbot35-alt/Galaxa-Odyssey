import React from 'react';
import { Camera, Maximize2, Minimize2, Radar } from 'lucide-react';
import type { CameraViewMode } from '../../rendering/three/combatSceneTypes';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface CombatControlsBarProps {
    viewMode: CameraViewMode;
    showRadar: boolean;
    isFullscreen: boolean;
    onToggleRadar: () => void;
    onToggleView: () => void;
    onToggleFullscreen?: () => void;
}

const Separator = () => <span className="text-slate-600 hidden sm:inline">•</span>;

export const CombatControlsBar: React.FC<CombatControlsBarProps> = ({
    viewMode,
    showRadar,
    isFullscreen,
    onToggleRadar,
    onToggleView,
    onToggleFullscreen,
}) => {
    const { t } = useLocale();
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400">
            <button
                type="button"
                onClick={onToggleRadar}
                className={`flex items-center gap-1 font-bold px-1.5 py-0.5 rounded transition ${
                    showRadar
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
                title={t.combatControlsBar.toggle3dRadarKey}
            >
                <Radar size={11} className={showRadar ? 'text-cyan-400 animate-spin' : ''} style={{ animationDuration: '4s' }} />
                <span>RADAR [R]</span>
            </button>
            <Separator />
            <span className="hidden sm:inline">{t.combatControlsBar.aDOrMove}</span>
            <Separator />
            <span className="hidden sm:inline">{t.combatControlsBar.spaceFire}</span>
            <Separator />
            <span className="hidden sm:inline">{t.combatControlsBar.n14Weapon}</span>
            <Separator />
            <button
                type="button"
                onClick={onToggleView}
                className={`flex items-center gap-1 font-bold px-1.5 py-0.5 rounded transition ${
                    viewMode === 'COCKPIT_3D'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
                title={t.combatControlsBar.togglePerspectiveKeyV}
            >
                <Camera size={11} />
                <span>{viewMode === 'COCKPIT_3D' ? t.combatControlsBar.cockpit : 'TPP'} [V]</span>
            </button>
            {onToggleFullscreen && (
                <>
                    <Separator />
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        className="flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition"
                        title={t.combatControlsBar.toggleFullscreenF}
                    >
                        {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                        <span className="hidden md:inline">{isFullscreen ? t.combatControlsBar.window : t.combatControlsBar.fullscreen} [F]</span>
                    </button>
                </>
            )}
        </div>
    );
};
