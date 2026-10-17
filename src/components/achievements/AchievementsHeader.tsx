import React from 'react';
import { Trophy, X } from 'lucide-react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface AchievementsHeaderProps {
  unlockedCount: number;
  totalCount: number;
  onClose: () => void;
}

export const AchievementsHeader: React.FC<AchievementsHeaderProps> = ({
  unlockedCount,
  totalCount,
  onClose,
}) => {
  const { t } = useLocale();
  return (
  <div className="relative px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(55,245,255,0.4)]">
        <Trophy size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black tracking-wide text-cyan-400 font-mono">
            {t.achievementsHeader.pilotBadgesCommendations}
          </h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300 font-mono">
            {unlockedCount}/{totalCount}
          </span>
        </div>
        <p className="text-xs text-slate-400">{t.achievementsHeader.milestoneAchievementsCombatHonors}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={onClose}
      className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
      title={t.achievementsHeader.closeEsc}
      aria-label={t.achievementsHeader.close}
    >
      <X size={18} />
    </button>
  </div>
  );
};
