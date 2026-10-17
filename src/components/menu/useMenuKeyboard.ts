import { useEffect, useRef } from 'react';
import { MenuTab } from './menuTypes';

interface UseMenuKeyboardParams {
  isAchievementsOpen: boolean;
  isIntroPlaying: boolean;
  isIntroActive: boolean;
  isWarping: boolean;
  isCinematicView: boolean;
  activeTab: MenuTab;
  onToggleCinematicView: () => void;
  onExitCinematicView: () => void;
  onSkipIntro: () => void;
  onStartMission: () => void;
  onBackToMain: () => void;
}

/** Registers menu keyboard shortcuts; always calls the latest handlers. */
export function useMenuKeyboard(params: UseMenuKeyboardParams) {
  const latest = useRef(params);
  latest.current = params;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const p = latest.current;

      if ((e.key === 'c' || e.key === 'C') && document.activeElement?.tagName !== 'INPUT' && !p.isIntroPlaying) {
        p.onToggleCinematicView();
      }
      if (e.key === 'Escape' && p.isCinematicView) {
        p.onExitCinematicView();
      }

      if (p.isAchievementsOpen) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        if (p.isIntroPlaying && p.isIntroActive) {
          e.preventDefault();
          p.onSkipIntro();
        } else if (!p.isWarping && p.activeTab === 'main') {
          e.preventDefault();
          p.onStartMission();
        }
      } else if (e.key === 'Escape') {
        if (p.isIntroPlaying) {
          e.preventDefault();
          p.onSkipIntro();
        } else if (p.activeTab !== 'main') {
          e.preventDefault();
          p.onBackToMain();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
}
