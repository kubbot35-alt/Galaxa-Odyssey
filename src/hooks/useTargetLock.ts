import { useEffect, useRef, useState } from 'react';
import type { TargetLockAudio } from '../rendering/three/combatSceneTypes';

export type LockState = 'SEARCHING' | 'ACQUIRING' | 'LOCKED';

export function useTargetLock(
  targetId: string | null,
  isTargetInView: boolean,
  audio: TargetLockAudio,
) {
  const [lockProgress, setLockProgress] = useState(0);
  const [lockState, setLockState] = useState<LockState>('SEARCHING');
  const lockedTargetIdRef = useRef<string | null>(null);
  const lastSoundTickRef = useRef<number>(0);
  const wasFullyLockedRef = useRef(false);

  useEffect(() => {
    let animationFrameId = 0;
    let lastTime = performance.now();

    const updateLock = (now: number) => {
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (!targetId || !isTargetInView) {
        setLockProgress(0);
        setLockState('SEARCHING');
        lockedTargetIdRef.current = null;
        wasFullyLockedRef.current = false;
      } else {
        if (lockedTargetIdRef.current !== targetId) {
          lockedTargetIdRef.current = targetId;
          setLockProgress(0.15);
          setLockState('ACQUIRING');
          wasFullyLockedRef.current = false;
        }

        setLockProgress((previous) => {
          const next = Math.min(1, previous + delta * 1.35);
          if (next >= 1) {
            setLockState('LOCKED');
            if (!wasFullyLockedRef.current) {
              wasFullyLockedRef.current = true;
              audio.playTargetLockedAlert();
            }
          } else {
            setLockState('ACQUIRING');
            if (now - lastSoundTickRef.current > 260) {
              lastSoundTickRef.current = now;
              audio.playTargetAcquiringBeep();
            }
          }
          return next;
        });
      }

      animationFrameId = requestAnimationFrame(updateLock);
    };

    animationFrameId = requestAnimationFrame(updateLock);
    return () => cancelAnimationFrame(animationFrameId);
  }, [audio, isTargetInView, targetId]);

  return { lockProgress, lockState };
}
