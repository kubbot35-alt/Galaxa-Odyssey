import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { AchievementIcon } from './achievements/AchievementIcon';
import { getAchievementTexts } from '../config/content/locales';
import { useLocale } from '../config/content/locales/LocaleProvider';

interface ToastData {
  id: string;
  rewardCredits: number;
  iconName: string;
}

interface AchievementToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ toast, onDismiss }) => {
  const { t } = useLocale();
  if (!toast) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.45)] backdrop-blur-md">
        {/* Glow Badge Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)]">
          <AchievementIcon iconName={toast.iconName} className="w-6 h-6 text-yellow-300" />
        </div>

        {/* Text Details */}
        <div className="pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles size={11} /> {t.achievementToast.badgeUnlocked}
            </span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
              +{toast.rewardCredits} {t.achievementToast.cr}
            </span>
          </div>
          <h4 className="text-sm font-black text-white font-mono tracking-wide leading-tight">
            {getAchievementTexts(t, toast.id).title}
          </h4>
          <p className="text-[11px] text-slate-300 font-sans">{getAchievementTexts(t, toast.id).subtitle}</p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t.achievementToast.dismissNotification}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
