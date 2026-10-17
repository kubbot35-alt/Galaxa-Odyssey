import React from 'react';
import { useLocale } from '../config/content/locales/LocaleProvider';
import { GameEngine } from '../game/GameEngine';
import { AchievementsHeader } from './achievements/AchievementsHeader';
import { AchievementsProgressBar } from './achievements/AchievementsProgressBar';
import { AchievementFilters } from './achievements/AchievementFilters';
import { AchievementsGrid } from './achievements/AchievementsGrid';
import { AchievementInspector } from './achievements/AchievementInspector';
import { AchievementsFooter } from './achievements/AchievementsFooter';
import { useAchievementsView } from './achievements/useAchievementsView';

interface AchievementsOverlayProps {
  engine: GameEngine;
  onClose: () => void;
}

export const AchievementsOverlay: React.FC<AchievementsOverlayProps> = ({ engine, onClose }) => {
  const { t } = useLocale();
  const view = useAchievementsView(engine);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.achievementsOverlay.pilotBadgesAndCommendations}
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[840px] max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AchievementsHeader
          unlockedCount={view.unlockedCount}
          totalCount={view.totalCount}
          onClose={onClose}
        />
        <AchievementsProgressBar
          progressPercent={view.progressPercent}
          totalCreditsEarned={view.totalCreditsEarned}
        />
        <AchievementFilters
          selectedStatus={view.selectedStatus}
          selectedCategory={view.selectedCategory}
          unlockedCount={view.unlockedCount}
          totalCount={view.totalCount}
          onStatusChange={view.setSelectedStatus}
          onCategoryChange={view.setSelectedCategory}
        />
        <AchievementsGrid
          achievements={view.filteredAchievements}
          selectedId={view.inspectBadge?.id}
          isUnlocked={(id) => engine.isAchievementUnlocked(id)}
          getProgress={(id) => engine.getProgress(id)}
          onSelect={view.setInspectBadge}
        />
        {view.inspectBadge && (
          <AchievementInspector
            achievement={view.inspectBadge}
            unlocked={engine.isAchievementUnlocked(view.inspectBadge.id)}
          />
        )}
        <AchievementsFooter onClose={onClose} />
      </div>
    </div>
  );
};
