import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { Achievement } from '../../types/achievements';
import { AchievementIcon } from './AchievementIcon';
import { getRarityBadgeStyle, getRarityLabel } from './rarityStyles';
import { getAchievementTexts } from '../../config/content/locales';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  selected: boolean;
  onSelect: (achievement: Achievement) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement: achievement,
  unlocked,
  progress,
  selected,
  onSelect,
}) => {
  const { t } = useLocale();
  const ach = { ...achievement, ...getAchievementTexts(t, achievement.id) };
  const style = getRarityBadgeStyle(ach.rarity, unlocked);

  return (
    <div
      onClick={() => onSelect(achievement)}
      className={`relative p-3 rounded-xl border transition cursor-pointer select-none ${style.border} ${style.bg} ${style.glow} ${
        selected ? 'ring-2 ring-cyan-400' : 'hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${style.iconBg}`}
        >
          {unlocked ? (
            <AchievementIcon iconName={ach.iconName} className="w-5 h-5" />
          ) : (
            <Lock className="w-4 h-4 text-slate-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`text-xs font-bold truncate ${unlocked ? 'text-slate-100' : 'text-slate-400'}`}>
              {ach.title}
            </h3>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                unlocked ? `${style.text} border-current/30 bg-black/40` : 'text-slate-600 border-slate-800'
              }`}
            >
              {getRarityLabel(ach.rarity, t)}
            </span>
          </div>

          <div className="text-[10px] text-cyan-400/90 font-mono font-medium truncate">{ach.subtitle}</div>

          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">{ach.description}</p>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
            {unlocked ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t.achievementCard.commissioned}</span>
              </div>
            ) : ach.maxProgress > 1 ? (
              <div className="flex items-center gap-2 flex-1 mr-3">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, (progress / ach.maxProgress) * 100)}%` }}
                  />
                </div>
                <span className="text-slate-400">
                  {progress}/{ach.maxProgress}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">{t.achievementCard.locked}</span>
            )}

            <span className="text-amber-300 font-bold shrink-0">+{ach.rewardCredits} {t.achievementCard.cr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
