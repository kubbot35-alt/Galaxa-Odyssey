import React from 'react';
import { Coins } from 'lucide-react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface AchievementsProgressBarProps {
  progressPercent: number;
  totalCreditsEarned: number;
}

export const AchievementsProgressBar: React.FC<AchievementsProgressBarProps> = ({
  progressPercent,
  totalCreditsEarned,
}) => {
  const { t } = useLocale();
  return (
  <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
    <div className="flex-1 min-w-[200px]">
      <div className="flex justify-between items-center mb-1 text-slate-400 font-mono text-[11px]">
        <span>{t.achievementsProgressBar.careerCompletion}</span>
        <span className="text-cyan-300 font-bold">{progressPercent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>

    <div className="flex items-center gap-4 text-slate-300 font-mono">
      <div className="flex items-center gap-1.5">
        <Coins size={14} className="text-amber-400" />
        <span>
          {t.achievementsProgressBar.earned}: <strong className="text-amber-300">+{totalCreditsEarned}</strong> {t.achievementsProgressBar.credits}
        </span>
      </div>
    </div>
  </div>
  );
};
