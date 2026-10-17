import React from 'react';
import { useLocale } from '../config/content/locales/LocaleProvider';

export const AppFooter: React.FC = () => {
  const { t } = useLocale();

  return (
    <footer className="w-full shrink-0 py-1.5 px-3 sm:px-5 text-center text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-30">
      <div className="flex items-center gap-2">
        <span className="text-cyan-400 font-mono font-semibold">{t.appFooter.n3dControls}</span>
        <span>{t.appFooter.player1Space}</span>
        <span className="text-slate-600">|</span>
        <span>{t.appFooter.weapon14Q}</span>
        <span className="text-slate-600">|</span>
        <span>{t.appFooter.cameraVTppCockpit}</span>
        <span className="text-slate-600">|</span>
        <span>{t.appFooter.fullscreenF}</span>
        <span className="text-slate-600">|</span>
        <span>{t.appFooter.badgesB}</span>
        <span className="text-slate-600">|</span>
        <span>{t.appFooter.pauseEsc}</span>
      </div>
      <div className="text-slate-500 font-mono text-[10px] hidden sm:block">
        {t.appFooter.galaxaOdysseyHangar3dArchitecture}
      </div>
    </footer>
  );
};
