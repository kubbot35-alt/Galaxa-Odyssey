import React from 'react';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import { CATEGORY_FILTERS, CategoryFilter, StatusFilter } from './achievementSelectors';

interface AchievementFiltersProps {
  selectedStatus: StatusFilter;
  selectedCategory: CategoryFilter;
  unlockedCount: number;
  totalCount: number;
  onStatusChange: (status: StatusFilter) => void;
  onCategoryChange: (category: CategoryFilter) => void;
}

export const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  selectedStatus,
  selectedCategory,
  unlockedCount,
  totalCount,
  onStatusChange,
  onCategoryChange,
}) => {
  const { t } = useLocale();
  const categoryLabels: Record<CategoryFilter, string> = {
    all: t.achievementFilters.all,
    combat: t.achievementFilters.combat,
    survival: t.achievementFilters.survival,
    progression: t.achievementFilters.progression,
    mastery: t.achievementFilters.mastery,
  };
  const statusButtons: { value: StatusFilter; label: string; active: string }[] = [
    { value: 'all', label: `${t.achievementFilters.all2} (${totalCount})`, active: 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' },
    {
      value: 'unlocked',
      label: `${t.achievementFilters.unlocked} (${unlockedCount})`,
      active: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40',
    },
    {
      value: 'in_progress',
      label: `${t.achievementFilters.locked} (${totalCount - unlockedCount})`,
      active: 'bg-amber-500/25 text-amber-300 border border-amber-500/40',
    },
  ];

  return (
    <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        {statusButtons.map(({ value, label, active }) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(value)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              selectedStatus === value ? active : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 text-[11px] font-mono">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${
              selectedCategory === cat ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>
    </div>
  );
};
