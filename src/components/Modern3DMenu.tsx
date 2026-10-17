import React, { useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { DifficultyLevel } from '../types/game';
import { SpaceCinematicIntroOverlay } from './menu/SpaceCinematicIntroOverlay';
import { useUiSound } from '../platform/audio/useUiSound';
import { MenuTab } from './menu/menuTypes';
import { useHangarScene } from './menu/useHangarScene';
import { useShipSkin } from './menu/useShipSkin';
import { useMissionLaunch } from './menu/useMissionLaunch';
import { useMenuKeyboard } from './menu/useMenuKeyboard';
import { MenuTopBar } from './menu/MenuTopBar';
import { MainMenuTab } from './menu/MainMenuTab';
import { DeployTab } from './menu/DeployTab';
import { LoadoutTab } from './menu/LoadoutTab';
import { DiagnosticsTab } from './menu/DiagnosticsTab';
import { ManualTab } from './menu/ManualTab';
import { CinematicNavBar } from './menu/CinematicNavBar';
import { MenuTelemetryFooter } from './menu/MenuTelemetryFooter';
import { WarpOverlay } from './menu/WarpOverlay';
import { useLocale } from '../config/content/locales/LocaleProvider';

interface Modern3DMenuProps {
  engine: GameEngine;
  onLaunch: () => void;
  onStateUpdate: () => void;
  onSwitchToRetro?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const nextDifficulty = (prev: DifficultyLevel) =>
  prev === DifficultyLevel.EASY
    ? DifficultyLevel.NORMAL
    : prev === DifficultyLevel.NORMAL
    ? DifficultyLevel.HARD
    : DifficultyLevel.EASY;

export const Modern3DMenu: React.FC<Modern3DMenuProps> = ({ engine, onLaunch, onStateUpdate }) => {
  const ui = useUiSound();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<MenuTab>('main');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(engine.difficultyLevel);
  const [selectedCoop, setSelectedCoop] = useState<boolean>(engine.twoPlayerMode);
  const [isCinematicView, setIsCinematicView] = useState(false);

  const scene = useHangarScene(activeTab);
  const { activeSkin, changeSkin } = useShipSkin(engine, scene.sceneRef);
  const { isWarping, startMission, resumeSaved } = useMissionLaunch({
    engine,
    sceneRef: scene.sceneRef,
    difficulty: selectedDifficulty,
    coop: selectedCoop,
    abortIntroForLaunch: scene.abortIntroForLaunch,
    onLaunch,
  });

  const isIntroActive = scene.isIntroPlaying && scene.introTelemetry.active;
  const backToMain = () => setActiveTab('main');

  const toggleCinematicView = () => {
    ui.click();
    setIsCinematicView((prev) => !prev);
  };

  const handleReplayIntro = () => {
    scene.replayIntro();
    setActiveTab('main');
  };

  const openAchievements = () => {
    engine.openAchievements();
    onStateUpdate();
  };

  useMenuKeyboard({
    isAchievementsOpen: engine.isAchievementsOpen,
    isIntroPlaying: scene.isIntroPlaying,
    isIntroActive: scene.introTelemetry.active,
    isWarping,
    isCinematicView,
    activeTab,
    onToggleCinematicView: toggleCinematicView,
    onExitCinematicView: () => setIsCinematicView(false),
    onSkipIntro: scene.skipIntro,
    onStartMission: startMission,
    onBackToMain: backToMain,
  });

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'main':
        return (
          <MainMenuTab
            engine={engine}
            selectedCoop={selectedCoop}
            selectedDifficulty={selectedDifficulty}
            isWarping={isWarping}
            onToggleCoop={() => setSelectedCoop((prev) => !prev)}
            onCycleDifficulty={() => setSelectedDifficulty(nextDifficulty)}
            onStartMission={startMission}
            onResumeSaved={resumeSaved}
            onOpenTab={setActiveTab}
            onOpenAchievements={openAchievements}
          />
        );
      case 'deploy':
        return (
          <DeployTab
            selectedCoop={selectedCoop}
            selectedDifficulty={selectedDifficulty}
            isWarping={isWarping}
            onSelectCoop={setSelectedCoop}
            onSelectDifficulty={setSelectedDifficulty}
            onStartMission={startMission}
            onBack={backToMain}
          />
        );
      case 'loadout':
        return (
          <LoadoutTab
            engine={engine}
            activeSkin={activeSkin}
            onSkinChange={changeSkin}
            onStateUpdate={onStateUpdate}
            onBack={backToMain}
          />
        );
      case 'diagnostics':
        return <DiagnosticsTab engine={engine} onStateUpdate={onStateUpdate} onBack={backToMain} />;
      case 'manual':
        return <ManualTab onBack={backToMain} />;
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 flex-1 bg-slate-950 overflow-hidden select-none">
      <div
        ref={scene.containerRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
        title={t.modern3DMenu.clickDragToOrbit}
      />

      {isIntroActive && (
        <SpaceCinematicIntroOverlay telemetry={scene.introTelemetry} onSkip={scene.skipIntro} />
      )}

      {isWarping && <WarpOverlay />}

      <div
        className={`relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-5 pointer-events-none transition-opacity duration-500 ${
          isIntroActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MenuTopBar
          engine={engine}
          activeCameraPreset={scene.activeCameraPreset}
          isCinematicView={isCinematicView}
          onCameraChange={scene.changeCamera}
          onReplayIntro={handleReplayIntro}
          onToggleCinematicView={toggleCinematicView}
          onOpenAchievements={openAchievements}
        />

        {!isCinematicView && (
          <div className="w-full max-w-[440px] pointer-events-auto my-auto">{renderActiveTab()}</div>
        )}

        {isCinematicView && (
          <CinematicNavBar
            activeCameraPreset={scene.activeCameraPreset}
            onCameraChange={scene.changeCamera}
            onExit={() => setIsCinematicView(false)}
            onStartMission={startMission}
          />
        )}

        {!isCinematicView && <MenuTelemetryFooter />}
      </div>
    </div>
  );
};
