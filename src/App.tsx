import React, { useState, useMemo } from 'react';
import { GameEngine } from './game/GameEngine';
import { Modern3DGameCanvas } from './components/Modern3DGameCanvas';
import { TouchControls } from './components/TouchControls';
import { Modern3DMenu } from './components/Modern3DMenu';
import { AchievementsOverlay } from './components/AchievementsOverlay';
import { AchievementToast } from './components/AchievementToast';
import { usePlatform } from './platform/PlatformContext';
import { useUiSound } from './platform/audio/useUiSound';
import { GameState } from './types/game';
import { shipSkinRepo, StorageService } from './game/persistence/StorageService';
import type { ShipSkinId } from './config/visuals/hangarVisuals';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { useFullscreenManager } from './hooks/useFullscreenManager';
import { useLocale } from './config/content/locales/LocaleProvider';

export const App: React.FC = () => {
  const ui = useUiSound();
  const { t } = useLocale();
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const platform = usePlatform();
  const engine = useMemo(() => new GameEngine(forceUpdate, platform), [platform]);

  const { isFullscreen, toggleFullscreen } = useFullscreenManager(engine.twoPlayerMode);

  const isMenuState = [
    GameState.MENU,
    GameState.PLAYER_MODE_SELECTION,
    GameState.DIFFICULTY_SELECTION,
    GameState.UPGRADES,
    GameState.SETTINGS,
    GameState.HOW_TO_PLAY,
  ].includes(engine.gameState);

  const selectedSkin = (shipSkinRepo.load() as ShipSkinId | null) || 'titanium';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Bar Header (Hidden in Fullscreen for 100% pure 3D gaming immersion) */}
      {!isFullscreen && (
        <AppHeader
          isFullscreen={isFullscreen}
          soundEnabled={engine.soundEnabled}
          particlesEnabled={engine.particlesEnabled}
          unlockedAchievementCount={engine.getUnlockedCount()}
          totalAchievementCount={engine.getTotalCount()}
          onToggleAchievements={() => {
            ui.click();
            engine.toggleAchievements();
            forceUpdate();
          }}
          onToggleAudio={() => {
            engine.toggleAudio();
            forceUpdate();
          }}
          onToggleParticles={() => {
            engine.toggleParticles();
            forceUpdate();
          }}
          onToggleFullscreen={toggleFullscreen}
          onResetProfile={() => {
            if (
              window.confirm(
                t.app.resetSavedGameData
              )
            ) {
              engine.clearSavedGame();
              StorageService.resetPilotData({ includeShipSkin: true });
              engine.loadAchievements();
              engine.loadProfile();
              engine.returnToMenu();
              forceUpdate();
            }
          }}
        />
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
            <TouchControls
              isPlaying={engine.gameState === GameState.PLAYING}
              unlockedWeaponModes={engine.player1.unlockedWeaponModes}
              currentWeaponMode={engine.player1.weaponMode}
              isTwoPlayer={engine.twoPlayerMode}
              onActionChange={(action, isPressed) => engine.inputManager.setVirtualButton(1, action, isPressed)}
              onWeaponModeChange={(mode) => {
                engine.setWeaponMode(mode);
                forceUpdate();
              }}
              onPause={() => {
                engine.pauseGame();
                forceUpdate();
              }}
            />
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
      <AppFooter />
    </div>
  );
};

export default App;
