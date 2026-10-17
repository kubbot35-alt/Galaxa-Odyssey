import React from 'react';
import type { Achievement } from '../../types/achievements';
import { AchievementIcon } from './AchievementIcon';
import { getRarityBadgeStyle } from './rarityStyles';
import { getAchievementTexts } from '../../config/content/locales';
import { useLocale } from '../../config/content/locales/LocaleProvider';

interface AchievementInspectorProps {
  achievement: Achievement;
  unlocked: boolean;
}

export const AchievementInspector: React.FC<AchievementInspectorProps> = ({ achievement: rawAchievement, unlocked }) => {
  const { t } = useLocale();
  const achievement = { ...rawAchievement, ...getAchievementTexts(t, rawAchievement.id) };
  return (
  <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 text-xs">
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          getRarityBadgeStyle(achievement.rarity, unlocked).iconBg
        }`}
      >
        <AchievementIcon iconName={achievement.iconName} className="w-5 h-5" />
      </div>
      <div className="truncate">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">{achievement.title}</span>
          <span className="text-[10px] uppercase font-mono text-cyan-400">[{achievement.subtitle}]</span>
        </div>
        <p className="text-slate-400 text-[11px] truncate">{achievement.description}</p>
      </div>
    </div>

    <div className="shrink-0 text-right font-mono">
      <span className={`text-[11px] font-bold ${unlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
        {unlocked ? t.achievementInspector.commissioned : t.achievementInspector.inProgress}
      </span>
      <div className="text-[10px] text-amber-300">+{achievement.rewardCredits} {t.achievementInspector.credits}</div>
    </div>
  </div>
  );
};
