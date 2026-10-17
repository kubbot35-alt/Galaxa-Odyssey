import React from 'react';
import { Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GameEngine } from '../../game/GameEngine';
import { useUiSound } from '../../platform/audio/useUiSound';
import { StorageService } from '../../game/persistence/StorageService';
import { MenuPanelHeader, ReturnToBridgeButton } from './MenuPanel';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import type { SupportedLocale } from '../../config/content/locales';

const LANGUAGE_OPTIONS: { id: SupportedLocale; label: string }[] = [
  { id: 'pl-PL', label: 'POLSKI' },
  { id: 'en-US', label: 'ENGLISH' },
];

interface DiagnosticsTabProps {
  engine: GameEngine;
  onStateUpdate: () => void;
  onBack: () => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({ engine, onStateUpdate, onBack }) => {
  const ui = useUiSound();
  const { locale, setLocale, t } = useLocale();
  const handleWipeProfile = () => {
    if (window.confirm(t.diagnosticsTab.resetLocalPilotProfile)) {
      engine.clearSavedGame();
      StorageService.resetPilotData();
      engine.loadAchievements();
      engine.loadProfile();
      onStateUpdate();
    }
  };

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in duration-200">
      <MenuPanelHeader
        icon={<Settings size={16} />}
        title={t.diagnosticsTab.systemDiagnosticsAudio}
        titleClassName="text-cyan-400"
        onBack={onBack}
      />

      <div className="space-y-2.5">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              {engine.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{t.diagnosticsTab.audioSynthesizer}</div>
              <div className="text-[10px] text-slate-400">{t.diagnosticsTab.weaponLasersThrustersEngine}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              ui.click();
              engine.toggleAudio();
              onStateUpdate();
            }}
            onMouseEnter={() => ui.hover()}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              engine.soundEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {engine.soundEnabled ? t.diagnosticsTab.online : t.diagnosticsTab.muted}
          </button>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{t.diagnosticsTab.particleVolumetrics}</div>
              <div className="text-[10px] text-slate-400">{t.diagnosticsTab.highSpeedPlasmaSparks}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              ui.click();
              engine.toggleParticles();
              onStateUpdate();
            }}
            onMouseEnter={() => ui.hover()}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              engine.particlesEnabled ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {engine.particlesEnabled ? t.diagnosticsTab.maxFx : t.diagnosticsTab.reduced}
          </button>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="text-xs font-bold text-white font-mono">{t.diagnosticsTab.language}</div>
          <div className="flex items-center gap-1.5">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={locale === option.id}
                onClick={() => {
                  ui.click();
                  setLocale(option.id);
                }}
                onMouseEnter={() => ui.hover()}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  locale === option.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300 font-mono">{t.diagnosticsTab.resetProfileData}</div>
            <div className="text-[10px] text-slate-400">{t.diagnosticsTab.wipeSavesStatsAnd}</div>
          </div>
          <button
            type="button"
            onClick={handleWipeProfile}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-rose-900/60 text-rose-300 transition cursor-pointer"
          >
            {t.diagnosticsTab.wipeData}
          </button>
        </div>
      </div>

      <ReturnToBridgeButton onClick={onBack} />
    </div>
  );
};
