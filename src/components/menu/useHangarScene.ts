import { useCallback, useEffect, useRef, useState } from 'react';
import { SpaceHangarScene } from '../../rendering/three/SpaceHangarScene';
import { useAudioPort } from '../../platform/audio/AudioPortContext';
import { INTRO_SEEN_STORAGE_KEY, MenuTab, TAB_CAMERA_PRESET } from './menuTypes';

const markIntroSeen = () => {
  try {
    sessionStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true');
  } catch {}
};

const wasIntroSeen = () => {
  try {
    return !!sessionStorage.getItem(INTRO_SEEN_STORAGE_KEY);
  } catch {
    return true;
  }
};

/** Owns the Three.js hangar scene lifecycle, the cinematic intro and the camera presets. */
export function useHangarScene(activeTab: MenuTab) {
  const audio = useAudioPort();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SpaceHangarScene | null>(null);

  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(() => !wasIntroSeen());
  const [activeCameraPreset, setActiveCameraPreset] = useState<string>('default');
  const [introTelemetry, setIntroTelemetry] = useState(() => ({
    phase: 'SYS-INIT',
    code: 'HANGAR-APPROACH // SEC-09',
    title: 'ORBITAL DOCKING BAY 09',
    subtitle: 'Pre-flight gantry clearance verified • Overhead structural scan nominal',
    progress: 0,
    timeRemaining: '7.2',
    active: false,
  }));

  const finishIntroUi = useCallback(() => {
    setIsIntroPlaying(false);
    setIntroTelemetry((prev) => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new SpaceHangarScene(containerRef.current);
    sceneRef.current = scene;

    if (isIntroPlaying) {
      setIntroTelemetry({ ...scene.getCinematicTelemetry(), active: true });
      scene.startCinematicIntro(() => {
        finishIntroUi();
        audio.stopCinematicIntroSoundscape();
        audio.startHangarAmbience();
        markIntroSeen();
      });
      audio.playCinematicIntroSoundscape();
    } else {
      setIntroTelemetry((prev) => ({ ...prev, active: false }));
      audio.startHangarAmbience();
    }

    const interval = setInterval(() => {
      const current = sceneRef.current;
      if (!current) return;
      if (current.isCinematicIntro) {
        setIntroTelemetry(current.getCinematicTelemetry());
      } else {
        setIntroTelemetry((prev) => (prev.active ? { ...prev, active: false } : prev));
      }
    }, 45);

    const ro = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      clearInterval(interval);
      audio.stopCinematicIntroSoundscape();
      audio.stopHangarAmbience();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const preset = TAB_CAMERA_PRESET[activeTab];
    sceneRef.current.setCameraFocus(preset);
    setActiveCameraPreset(preset);
  }, [activeTab]);

  const changeCamera = useCallback((preset: string) => {
    audio.playUiClick();
    setActiveCameraPreset(preset);
    sceneRef.current?.setCameraFocus(preset);
  }, []);

  const skipIntro = useCallback(() => {
    audio.playUiClick();
    audio.stopCinematicIntroSoundscape();
    audio.startHangarAmbience();
    finishIntroUi();
    markIntroSeen();
    const scene = sceneRef.current;
    if (scene) {
      scene.skipCinematicIntro();
      setIntroTelemetry({ ...scene.getCinematicTelemetry(), active: false });
    }
  }, [finishIntroUi]);

  const replayIntro = useCallback(() => {
    audio.playUiClick();
    audio.stopHangarAmbience();
    setIsIntroPlaying(true);
    const scene = sceneRef.current;
    if (scene) {
      setIntroTelemetry({ ...scene.getCinematicTelemetry(), active: true });
      scene.startCinematicIntro(() => {
        finishIntroUi();
        audio.stopCinematicIntroSoundscape();
        audio.startHangarAmbience();
      });
      audio.playCinematicIntroSoundscape();
    }
  }, [finishIntroUi]);

  /** Silently aborts a running intro right before a mission launch. */
  const abortIntroForLaunch = useCallback(() => {
    if (!isIntroPlaying) return;
    audio.stopCinematicIntroSoundscape();
    finishIntroUi();
    sceneRef.current?.skipCinematicIntro();
  }, [isIntroPlaying, finishIntroUi]);

  return {
    containerRef,
    sceneRef,
    isIntroPlaying,
    introTelemetry,
    activeCameraPreset,
    changeCamera,
    skipIntro,
    replayIntro,
    abortIntroForLaunch,
  };
}
