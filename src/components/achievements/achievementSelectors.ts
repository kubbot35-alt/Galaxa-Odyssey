import { ACHIEVEMENTS, Achievement } from '../../types/achievements';

export type StatusFilter = 'all' | 'unlocked' | 'in_progress';
export type CategoryFilter = 'all' | Achievement['category'];

export const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  'all',
  'combat',
  'survival',
  'progression',
  'mastery',
];

type IsUnlocked = (id: string) => boolean;

export const filterAchievements = (
  isUnlocked: IsUnlocked,
  status: StatusFilter,
  category: CategoryFilter,
): Achievement[] =>
  ACHIEVEMENTS.filter((ach) => {
    const unlocked = isUnlocked(ach.id);
    if (status === 'unlocked' && !unlocked) return false;
    if (status === 'in_progress' && unlocked) return false;
    return category === 'all' || ach.category === category;
  });

export const calculateCreditsEarned = (isUnlocked: IsUnlocked): number =>
  ACHIEVEMENTS.reduce((sum, ach) => (isUnlocked(ach.id) ? sum + ach.rewardCredits : sum), 0);

export const calculateProgressPercent = (unlocked: number, total: number): number =>
  total === 0 ? 0 : Math.round((unlocked / total) * 100);
