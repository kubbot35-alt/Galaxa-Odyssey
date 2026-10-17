import React from 'react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

export const WarpOverlay: React.FC = () => {
  const { t } = useLocale();

  return (
    <div className="absolute inset-0 z-30 pointer-events-none bg-cyan-400/20 animate-pulse backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-2xl sm:text-3xl font-black text-white tracking-widest">{t.warpOverlay.hyperdriveEngaged}</div>
        <div className="text-xs text-cyan-200 mt-1 uppercase tracking-widest">
          {t.warpOverlay.jumpingToFrontlineCoordinates}
        </div>
      </div>
    </div>
  );
};
