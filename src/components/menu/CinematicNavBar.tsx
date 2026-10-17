import React from 'react';
import { Rocket } from 'lucide-react';
import { useUiSound } from '../../platform/audio/useUiSound';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import { CINEMATIC_CAMERA_PRESETS } from './menuTypes';

interface CinematicNavBarProps {
  activeCameraPreset: string;
  onCameraChange: (preset: string) => void;
  onExit: () => void;
  onStartMission: () => void;
}

export const CinematicNavBar: React.FC<CinematicNavBarProps> = ({
  activeCameraPreset,
  onCameraChange,
  onExit,
  onStartMission,
}) => {
  const ui = useUiSound();
  const { t } = useLocale();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl px-4 py-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-2 mr-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{t.cinematicNavBar.hangarCinematicMode}</span>
        <span className="text-slate-400 text-[10px] hidden sm:inline">({t.cinematicNavBar.dragMouse360Scroll})</span>
      </div>

      <div className="flex items-center gap-1">
        {CINEMATIC_CAMERA_PRESETS.map((cam) => (
          <button
            key={cam.id}
            type="button"
            onClick={() => onCameraChange(cam.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
              activeCameraPreset === cam.id
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            {t.cameraLabels[cam.id as keyof typeof t.cameraLabels] ?? cam.label}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

      <button
        type="button"
        onClick={() => {
          ui.click();
          onExit();
        }}
        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
      >
        <span>{t.cinematicNavBar.backToMenuC}</span>
      </button>

      <button
        type="button"
        onClick={onStartMission}
        className="px-4 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
      >
        <Rocket size={13} />
        <span>{t.cinematicNavBar.startMission}</span>
      </button>
    </div>
  );
};
