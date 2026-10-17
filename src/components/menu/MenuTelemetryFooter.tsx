import React from 'react';
import { useLocale } from '../../config/content/locales/LocaleProvider';

export const MenuTelemetryFooter: React.FC = () => {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-cyan-400 font-bold">{t.menuTelemetryFooter.radar}</span>
        <span>{t.menuTelemetryFooter.sector07ClearWeapon}</span>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-slate-500">
        <span>{t.menuTelemetryFooter.dragMouseToOrbit}</span>
        <span>•</span>
        <span>{t.menuTelemetryFooter.scrollToZoom}</span>
      </div>
    </div>
  );
};
