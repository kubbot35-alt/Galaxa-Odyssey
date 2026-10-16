import React, { useState, useEffect, useMemo } from 'react';
import { GameEngine } from './game/GameEngine';
import { Modern3DGameCanvas } from './components/Modern3DGameCanvas';
import { TouchControls } from './components/TouchControls';
import { Modern3DMenu } from './components/Modern3DMenu';
import { AchievementsOverlay } from './components/AchievementsOverlay';
import { AchievementToast } from './components/AchievementToast';
import { soundEngine } from './audio/soundEngine';
import { GameState } from './types/game';
import { ShipSkinId } from './components/3d/SpaceHangarScene';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trophy,
} from 'lucide-react';

export const App: React.FC = () => {
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const engine = useMemo(() => new GameEngine(forceUpdate), []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Global 'F' key listener for full screen toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !engine.twoPlayerMode && !e.repeat) {
        if (document.activeElement?.tagName !== 'INPUT') {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [engine.twoPlayerMode]);

  const isMenuState = [
    GameState.MENU,
    GameState.PLAYER_MODE_SELECTION,
    GameState.DIFFICULTY_SELECTION,
    GameState.UPGRADES,
    GameState.SETTINGS,
    GameState.HOW_TO_PLAY,
  ].includes(engine.gameState);

  const selectedSkin = (typeof window !== 'undefined' && localStorage.getItem('galaxa_ship_skin') as ShipSkinId) || 'titanium';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Bar Header (Hidden in Fullscreen for 100% pure 3D gaming immersion) */}
      {!isFullscreen && (
        <header className="w-full shrink-0 flex items-center justify-between py-1.5 px-3 sm:px-5 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-black text-sm shadow-[0_0_10px_rgba(55,245,255,0.4)]">
            GO
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-cyan-400 font-mono">
              GALAXA ODYSSEY
            </h1>
            <p className="text-[10px] text-slate-400">21st-Century 3D Orbital Space Combat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Achievement Badges Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              engine.toggleAchievements();
              forceUpdate();
            }}
            title="Inspect Achievement Badges [B]"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 transition text-xs font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Trophy size={14} className="text-amber-400" />
            <span className="hidden sm:inline">BADGES</span>
            <span className="text-[11px] text-amber-200">
              ({engine.getUnlockedCount()}/{engine.getTotalCount()})
            </span>
          </button>

          {/* Audio Quick Toggle */}
          <button
            type="button"
            onClick={() => {
              engine.toggleAudio();
              forceUpdate();
            }}
            title={engine.soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            className={`p-2 rounded-lg border transition ${
              engine.soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {engine.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Particles Toggle */}
          <button
            type="button"
            onClick={() => {
              engine.toggleParticles();
              forceUpdate();
            }}
            title={engine.particlesEnabled ? 'High FX' : 'Low FX'}
            className={`p-2 rounded-lg border transition ${
              engine.particlesEnabled
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles size={16} />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Opuść Pełny Ekran [F]' : 'Pełny Ekran [F]'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-cyan-400 transition text-xs font-mono font-bold"
          >
            {isFullscreen ? <Minimize2 size={14} className="text-cyan-400" /> : <Maximize2 size={14} className="text-cyan-400" />}
            <span className="hidden sm:inline">{isFullscreen ? 'OKNO' : 'PEŁNY EKRAN'}</span>
            <span className="text-[10px] text-slate-400 hidden md:inline">[F]</span>
          </button>

          {/* Reset Save Data */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Zresetować dane zapisu gry, osiągnięcia i profil?')) {
                engine.clearSavedGame();
                localStorage.removeItem('galaxa_odyssey_achievements');
                localStorage.removeItem('galaxa_odyssey_profile');
                localStorage.removeItem('galaxa_ship_skin');
                engine.loadAchievements();
                engine.loadProfile();
                engine.returnToMenu();
                forceUpdate();
              }
            }}
            title="Reset Game & Achievements"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>
      )}

      {/* Main Game / Menu Area - Full Screen Fill */}
      <main className="relative w-full flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center">
        {isMenuState ? (
          <Modern3DMenu
            engine={engine}
            onLaunch={forceUpdate}
            onStateUpdate={forceUpdate}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        ) : (
          <>
            <Modern3DGameCanvas
              engine={engine}
              onStateUpdate={forceUpdate}
              selectedSkin={selectedSkin}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onReturnToHangar={() => {
                engine.returnToMenu();
                forceUpdate();
              }}
            />
            <TouchControls engine={engine} onStateUpdate={forceUpdate} />
          </>
        )}

        {/* Real-time Achievement Toast */}
        <AchievementToast
          toast={engine.activeToast}
          onDismiss={() => {
            engine.dismissToast();
            forceUpdate();
          }}
        />

        {/* Badges Overlay Modal */}
        {engine.isAchievementsOpen && (
          <AchievementsOverlay
            engine={engine}
            onClose={() => {
              engine.closeAchievements();
              forceUpdate();
            }}
          />
        )}
      </main>

      {/* Footer Navigation Info - Full Screen Slim Bar */}
      <footer className="w-full shrink-0 py-1.5 px-3 sm:px-5 text-center text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono font-semibold">Sterowanie 3D:</span>
          <span>P1: ← / → + Spacja</span>
          <span className="text-slate-600">|</span>
          <span>Broń: 1-4 / Q, E</span>
          <span className="text-slate-600">|</span>
          <span>Kamera: V (TPP / Kokpit)</span>
          <span className="text-slate-600">|</span>
          <span>Pełny Ekran: F</span>
          <span className="text-slate-600">|</span>
          <span>Odznaki: B</span>
          <span className="text-slate-600">|</span>
          <span>Pauza: ESC</span>
        </div>
        <div className="text-slate-500 font-mono text-[10px] hidden sm:block">
          Galaxa Odyssey • Architektura Hangar3D & Pelny Ekran
        </div>
      </footer>
    </div>
  );
};

export default App;
