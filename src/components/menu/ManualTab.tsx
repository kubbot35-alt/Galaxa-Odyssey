import React from 'react';
import { BookOpen } from 'lucide-react';
import type { TranslationSchema } from '../../config/content/locales';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import { MenuPanelHeader, ReturnToBridgeButton } from './MenuPanel';

interface ManualTabProps {
  onBack: () => void;
}

const CONTROL_BINDINGS: { id: keyof TranslationSchema['controlBindings']; keyClass: string }[] = [
  { id: 'steer', keyClass: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40' },
  { id: 'fire', keyClass: 'text-purple-400 bg-purple-950/80 border-purple-500/40' },
  { id: 'switchWeapon', keyClass: 'text-amber-400 bg-amber-950/80 border-amber-500/40' },
  { id: 'coop', keyClass: 'text-pink-400 bg-pink-950/80 border-pink-500/40' },
  { id: 'pause', keyClass: 'text-slate-300 bg-slate-800 border-slate-700' },
];

export const ManualTab: React.FC<ManualTabProps> = ({ onBack }) => {
  const { t } = useLocale();

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border border-pink-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in duration-200 max-h-[66vh] overflow-y-auto">
      <MenuPanelHeader
        icon={<BookOpen size={16} />}
        title={t.manualTab.tacticalCombatManual}
        titleClassName="text-pink-400"
        onBack={onBack}
      />

      <div className="space-y-2 text-xs font-mono">
        {CONTROL_BINDINGS.map((binding) => (
          <div
            key={binding.id}
            className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between"
          >
            <span className="text-slate-300">{t.controlBindings[binding.id].action}</span>
            <span className={`font-bold px-2 py-0.5 rounded border ${binding.keyClass}`}>{t.controlBindings[binding.id].keys}</span>
          </div>
        ))}
      </div>

      <ReturnToBridgeButton onClick={onBack} />
    </div>
  );
};
