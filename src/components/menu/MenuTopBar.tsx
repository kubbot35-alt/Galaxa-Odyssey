import React from 'react';
import { Camera, Eye, Film, Trophy } from 'lucide-react';
import { GameEngine } from '../../game/GameEngine';
import { useUiSound } from '../../platform/audio/useUiSound';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import { TOP_BAR_CAMERA_PRESETS } from './menuTypes';

interface MenuTopBarProps {
  engine: GameEngine;
  activeCameraPreset: string;
  isCinematicView: boolean;
  onCameraChange: (preset: string) => void;
  onReplayIntro: () => void;
  onToggleCinematicView: () => void;
  onOpenAchievements: () => void;
}

export const MenuTopBar: React.FC<MenuTopBarProps> = ({
  engine,
  activeCameraPreset,
  isCinematicView,
  onCameraChange,
  onReplayIntro,
  onToggleCinematicView,
  onOpenAchievements,
}) => {
  const ui = useUiSound();
  const { t } = useLocale();

  return (
    <div className="flex items-start justify-between gap-3 pointer-events-auto">
      <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl px-3.5 py-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
            {t.menuTopBar.orbitalDock07Deep}
          </span>
        </div>
        <h2 className="text-xs sm:text-sm font-black tracking-wider text-white font-mono flex items-center gap-2">
          ODYSSEY-MK4 <span className="text-cyan-400 font-normal">{t.menuTopBar.interceptor}</span>
        </h2>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
          <Camera size={12} className="text-cyan-400" /> {t.menuTopBar.cam}
        </span>

        <button
          type="button"
          onClick={onReplayIntro}
          title={t.menuTopBar.replayCinematic3dHangar}
          className="px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 bg-amber-950/70 text-amber-300 border border-amber-500/50 hover:bg-amber-900/80 hover:text-white font-bold"
        >
          <Film size={11} className="text-amber-400" />
          <span>{t.menuTopBar.intro}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCinematicView}
          title={t.menuTopBar.toggleClean3dHangar}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 font-bold ${
            isCinematicView
              ? 'bg-cyan-500 text-black'
              : 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/80 hover:text-white'
          }`}
        >
          <Eye size={11} className={isCinematicView ? 'text-black' : 'text-cyan-400'} />
          <span>{t.menuTopBar.hangar3dC}</span>
        </button>

        {TOP_BAR_CAMERA_PRESETS.map((cam) => (
          <button
            key={cam.id}
            type="button"
            onClick={() => onCameraChange(cam.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
              activeCameraPreset === cam.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.cameraLabels[cam.id as keyof typeof t.cameraLabels] ?? cam.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-3 text-xs font-mono">
        <div>
          <div className="text-[9px] text-slate-400 font-medium">{t.menuTopBar.warChest}</div>
          <div className="text-amber-300 font-bold text-xs sm:text-sm">
            {engine.credits} <span className="text-[9px] text-amber-400/80">CR</span>
          </div>
        </div>
        <div className="h-5 w-px bg-slate-800" />
        <div>
          <div className="text-[9px] text-slate-400 font-medium">{t.menuTopBar.combatScore}</div>
          <div className="text-cyan-300 font-bold text-xs sm:text-sm">{engine.highScore}</div>
        </div>
        <div className="h-5 w-px bg-slate-800" />
        <button
          type="button"
          onClick={() => {
            ui.click();
            onOpenAchievements();
          }}
          onMouseEnter={() => ui.hover()}
          className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/15 border border-amber-500/50 rounded-lg text-amber-300 hover:bg-amber-500/25 transition cursor-pointer text-xs font-bold"
          title={t.menuTopBar.inspectUnlockedBadges}
        >
          <Trophy size={13} className="text-amber-400" />
          <span>
            {engine.getUnlockedCount()}/{engine.getTotalCount()}
          </span>
        </button>
      </div>
    </div>
  );
};
