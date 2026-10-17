import { useMemo, useState } from 'react';
import type { GameEngine } from '../../game/GameEngine';
import { ACHIEVEMENTS, Achievement } from '../../types/achievements';
import {
  CategoryFilter,
  StatusFilter,
  calculateCreditsEarned,
  calculateProgressPercent,
  filterAchievements,
} from './achievementSelectors';

export const useAchievementsView = (engine: GameEngine) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [inspectBadge, setInspectBadge] = useState<Achievement | null>(null);

  const unlockedCount = engine.getUnlockedCount();
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = calculateProgressPercent(unlockedCount, totalCount);

  const totalCreditsEarned = useMemo(
    () => calculateCreditsEarned((id) => engine.isAchievementUnlocked(id)),
    [engine],
  );

  const filteredAchievements = useMemo(
    () =>
      filterAchievements((id) => engine.isAchievementUnlocked(id), selectedStatus, selectedCategory),
    [selectedStatus, selectedCategory, engine],
  );

  return {
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    inspectBadge,
    setInspectBadge,
    unlockedCount,
    totalCount,
    progressPercent,
    totalCreditsEarned,
    filteredAchievements,
  };
};
