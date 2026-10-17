import React from 'react';
import { Play, Camera, RotateCcw } from 'lucide-react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface PauseOverlayProps {
    wave: number;
    onResume: () => void;
    onToggleView: () => void;
    onAbort: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ wave, onResume, onToggleView, onAbort }) => {
    const { t } = useLocale();
    return (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
            <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl flex flex-col items-center text-center">
                <h2 className="text-2xl font-black text-cyan-400 font-mono tracking-wider">{t.pauseOverlay.sortieSuspended}</h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">{t.pauseOverlay.sectorTacticalSystemsOn(wave)}</p>

                <div className="w-full flex flex-col gap-3 mt-6 font-mono text-sm">
                    <button
                        type="button"
                        onClick={onResume}
                        className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        <Play size={18} />
                        <span>{t.pauseOverlay.resumeSortie}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToggleView}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition text-xs"
                    >
                        <Camera size={16} className="text-cyan-400" />
                        <span>{t.pauseOverlay.switchCameraPerspective}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onAbort}
                        className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 hover:border-red-500/50 hover:text-red-300 text-slate-400 border border-slate-700/80 flex items-center justify-center gap-2 transition text-xs"
                    >
                        <RotateCcw size={16} />
                        <span>{t.pauseOverlay.abortToShipHangar}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
