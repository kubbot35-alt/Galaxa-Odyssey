import { MutableRefObject, useCallback, useState } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { DifficultyLevel } from '../../types/game';
import { useAudioPort } from '../../platform/audio/AudioPortContext';
import { SpaceHangarScene } from '../../rendering/three/SpaceHangarScene';

interface UseMissionLaunchParams {
  engine: GameEngine;
  sceneRef: MutableRefObject<SpaceHangarScene | null>;
  difficulty: DifficultyLevel;
  coop: boolean;
  abortIntroForLaunch: () => void;
  onLaunch: () => void;
}

/** Handles the hyperdrive launch sequence for new and resumed missions. */
export function useMissionLaunch({
  engine,
  sceneRef,
  difficulty,
  coop,
  abortIntroForLaunch,
  onLaunch,
}: UseMissionLaunchParams) {
  const audio = useAudioPort();
  const [isWarping, setIsWarping] = useState(false);

  const launch = useCallback(
    (beginGame: () => void) => {
      abortIntroForLaunch();
      audio.stopHangarAmbience();
      audio.playWarpJump();
      setIsWarping(true);

      const finish = () => {
        audio.stopMenuMusic();
        audio.stopHangarAmbience();
        beginGame();
        onLaunch();
      };

      if (sceneRef.current) {
        sceneRef.current.triggerHyperdriveLaunch(finish);
      } else {
        finish();
      }
    },
    [abortIntroForLaunch, onLaunch, sceneRef]
  );

  const startMission = useCallback(() => {
    engine.difficultyLevel = difficulty;
    engine.twoPlayerMode = coop;
    launch(() => engine.startNewGame());
  }, [engine, difficulty, coop, launch]);

  const resumeSaved = useCallback(() => {
    launch(() => engine.loadSavedGame());
  }, [engine, launch]);

  return { isWarping, startMission, resumeSaved };
}
