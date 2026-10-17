import React from 'react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

export const AchievementsFooter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useLocale();
  return (
  <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
    <span>{t.achievementsFooter.pressBInGame}</span>
    <button
      type="button"
      onClick={onClose}
      className="px-3 py-1 bg-cyan-950/70 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-900/80 transition cursor-pointer font-bold"
    >
      {t.achievementsFooter.returnToHangar}
    </button>
  </div>
  );
};
