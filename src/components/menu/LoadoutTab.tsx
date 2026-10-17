import React from 'react';
import { Shield, Palette } from 'lucide-react';
import { GameEngine } from '../../game/GameEngine';
import { UpgradeOption } from '../../types/game';
import { UPGRADE_CONFIGS } from '../../config/gameplay/balance';
import { SHIP_SKINS } from '../../config/visuals/hangarVisuals';
import type { ShipSkinId } from '../../config/visuals/hangarVisuals';
import { useUiSound } from '../../platform/audio/useUiSound';
import { useLocale } from '../../config/content/locales/LocaleProvider';
import { MenuPanelHeader, ReturnToBridgeButton } from './MenuPanel';

interface LoadoutTabProps {
  engine: GameEngine;
  activeSkin: ShipSkinId;
  onSkinChange: (skin: ShipSkinId) => void;
  onStateUpdate: () => void;
  onBack: () => void;
}

const isUpgradeOwned = (engine: GameEngine, option: UpgradeOption) => {
  switch (option) {
    case UpgradeOption.DUAL_CANNONS:
      return engine.ownedWeaponLevel >= 2;
    case UpgradeOption.TRIPLE_CANNONS:
      return engine.ownedWeaponLevel >= 3;
    case UpgradeOption.DOUBLE_LIVES:
      return engine.doubleLives;
    case UpgradeOption.INFINITE_LIVES:
      return engine.infiniteLives;
    default:
      return false;
  }
};

export const LoadoutTab: React.FC<LoadoutTabProps> = ({
  engine,
  activeSkin,
  onSkinChange,
  onStateUpdate,
  onBack,
}) => {
  const ui = useUiSound();
  const { t } = useLocale();

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-200 max-h-[66vh] overflow-y-auto">
      <MenuPanelHeader
        icon={<Shield size={16} />}
        title={t.loadoutTab.starfighterLoadoutUpgrades}
        titleClassName="text-purple-400"
        onBack={onBack}
      />

      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
          <Palette size={12} className="text-purple-400" /> {t.loadoutTab.starfighterLivery}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(Object.keys(SHIP_SKINS) as ShipSkinId[]).map((skinKey) => (
            <button
              key={skinKey}
              type="button"
              onClick={() => onSkinChange(skinKey)}
              className={`p-1.5 rounded-lg border text-center transition cursor-pointer text-[10px] font-mono font-bold ${
                activeSkin === skinKey
                  ? 'border-purple-400 bg-purple-950/60 text-purple-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {t.hangar.skins[skinKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-amber-300 font-mono font-bold bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-1.5 flex justify-between items-center">
        <span>{t.loadoutTab.availableCredits}</span>
        <span className="text-sm font-black">{engine.credits} CR</span>
      </div>

      <div className="space-y-2">
        {UPGRADE_CONFIGS.filter((u) => u.id !== UpgradeOption.RETURN).map((u) => {
          const owned = isUpgradeOwned(engine, u.id);
          return (
            <div
              key={u.id}
              className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  {t.upgradeLabels[u.id as keyof typeof t.upgradeLabels]?.name ?? u.name}
                  {owned && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {t.loadoutTab.mounted}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.upgradeLabels[u.id as keyof typeof t.upgradeLabels]?.subtitle ?? u.subtitle}</div>
              </div>

              <button
                type="button"
                disabled={owned || engine.credits < u.cost}
                onClick={() => {
                  ui.click();
                  engine.buyUpgrade(u.id);
                  onStateUpdate();
                }}
                onMouseEnter={() => ui.hover()}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition ${
                  owned
                    ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                    : engine.credits >= u.cost
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }`}
              >
                {owned ? t.loadoutTab.active : `${u.cost} CR`}
              </button>
            </div>
          );
        })}
      </div>

      <ReturnToBridgeButton onClick={onBack} />
    </div>
  );
};
