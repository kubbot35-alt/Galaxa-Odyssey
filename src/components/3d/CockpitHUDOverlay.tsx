import React from 'react';
import { Shield, Zap, Crosshair, AlertTriangle } from 'lucide-react';
import { WeaponMode, WEAPON_MODE_CONFIGS } from '../../types/game';

interface CockpitHUDOverlayProps {
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  lives: number;
  weaponMode: WeaponMode;
  bankAngle: number;
  isTakingDamage: boolean;
  onToggleView: () => void;
}

export const CockpitHUDOverlay: React.FC<CockpitHUDOverlayProps> = ({
  shield,
  maxShield,
  energy,
  maxEnergy,
  lives,
  weaponMode,
  bankAngle,
  isTakingDamage,
  onToggleView,
}) => {
  const shieldPercent = Math.max(0, Math.min(100, Math.round((shield / maxShield) * 100)));
  const energyPercent = Math.max(0, Math.min(100, Math.round((energy / maxEnergy) * 100)));
  const isCritical = shieldPercent <= 25 && lives <= 1;

  // Roll rotation in degrees for artificial horizon
  const rollDeg = Math.round(bankAngle * -45);

  const weaponCfg = WEAPON_MODE_CONFIGS[weaponMode];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between overflow-hidden">
      {/* 1. Structural Cockpit Canopy Struts & Glass Glare */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-900/90 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="canopyMat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="glassGlare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Glass Surface Glare */}
        <rect width="1920" height="1080" fill="url(#glassGlare)" />

        {/* Top Canopy Arch */}
        <polygon points="0,0 1920,0 1620,90 300,90" fill="url(#canopyMat)" stroke="#1e293b" strokeWidth="2" />

        {/* Left Side Pillar */}
        <polygon points="0,0 300,90 240,1080 0,1080" fill="url(#canopyMat)" stroke="#1e293b" strokeWidth="2" />

        {/* Right Side Pillar */}
        <polygon points="1920,0 1620,90 1680,1080 1920,1080" fill="url(#canopyMat)" stroke="#1e293b" strokeWidth="2" />

        {/* Bottom Dashboard Console Rim */}
        <polygon
          points="240,1080 500,960 1420,960 1680,1080"
          fill="url(#canopyMat)"
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Cockpit Canopy Hairlines */}
        <line x1="300" y1="90" x2="500" y2="960" stroke="#0ea5e9" strokeOpacity="0.25" strokeWidth="1.5" />
        <line x1="1620" y1="90" x2="1420" y2="960" stroke="#0ea5e9" strokeOpacity="0.25" strokeWidth="1.5" />
      </svg>

      {/* 2. Artificial Horizon & Center Gunsight Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative w-48 h-48 transition-transform duration-75 flex items-center justify-center"
          style={{ transform: `rotate(${rollDeg}deg)` }}
        >
          {/* Pitch Ladder Bars */}
          <div className="absolute w-24 h-[1px] bg-cyan-400/50 -top-8" />
          <div className="absolute w-16 h-[1px] bg-cyan-400/40 -top-16" />
          <div className="absolute w-24 h-[1px] bg-cyan-400/50 -bottom-8" />
          <div className="absolute w-16 h-[1px] bg-cyan-400/40 -bottom-16" />

          {/* Central Holographic Crosshair */}
          <div className="relative w-16 h-16 border border-cyan-400/60 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            <div className="absolute w-8 h-[1px] bg-cyan-400/70 -left-6" />
            <div className="absolute w-8 h-[1px] bg-cyan-400/70 -right-6" />
            <div className="absolute h-8 w-[1px] bg-cyan-400/70 -top-6" />
            <div className="absolute h-8 w-[1px] bg-cyan-400/70 -bottom-6" />
          </div>

          {/* Roll Angle Readout */}
          <div className="absolute top-2 text-[10px] font-mono text-cyan-300 font-bold tabular-nums">
            {rollDeg > 0 ? `+${rollDeg}°` : `${rollDeg}°`}
          </div>
        </div>
      </div>

      {/* 3. Top Canopy Bar: Status Alert Banner */}
      <div className="relative pt-3 sm:pt-4 px-6 sm:px-12 flex items-center justify-between text-xs font-mono text-cyan-300">
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[11px] font-bold">WIDOK Z KOKPITU [FPP]</span>
        </div>

        {isCritical && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-500/80 text-red-300 rounded font-bold animate-pulse">
            <AlertTriangle size={14} className="text-red-400" />
            <span>KRYTYCZNE USZKODZENIA KADŁUBA</span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleView}
          className="pointer-events-auto px-3 py-1 bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white rounded text-[11px] transition"
        >
          Przełącz na TPP [V]
        </button>
      </div>

      {/* 4. Bottom Tactical Console Overlays */}
      <div className="relative pb-4 sm:pb-6 px-6 sm:px-12 flex items-end justify-between">
        {/* Left Console: Deflector Shield & Hull Integrity */}
        <div className="w-48 sm:w-56 bg-slate-950/85 backdrop-blur border border-cyan-500/40 rounded-lg p-2.5 shadow-xl font-mono">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Shield size={13} /> TARCZA OBRONNA
            </span>
            <span className="text-white font-bold tabular-nums">{shieldPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30 mb-2">
            <div
              className={`h-full transition-all duration-150 ${
                shieldPercent > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-400'
                  : shieldPercent > 20
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
              }`}
              style={{ width: `${shieldPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>KADŁUB (ŻYCIA):</span>
            <span className="text-amber-400 font-bold tabular-nums">{'▲ '.repeat(lives)}</span>
          </div>
        </div>

        {/* Center Compass / Speed Gauge */}
        <div className="hidden sm:flex flex-col items-center bg-slate-950/80 px-4 py-1.5 rounded-lg border border-slate-800 font-mono text-center">
          <span className="text-[10px] text-slate-400">PRĘDKOŚĆ MARSZOWA</span>
          <span className="text-sm font-bold text-cyan-400 tabular-nums">1 240 KM/H</span>
        </div>

        {/* Right Console: Weapon Capacitor & Mode */}
        <div className="w-48 sm:w-56 bg-slate-950/85 backdrop-blur border border-amber-500/40 rounded-lg p-2.5 shadow-xl font-mono text-right">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-white font-bold tabular-nums">{energyPercent}%</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              ENERGIA BRONI <Zap size={13} />
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30 mb-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150"
              style={{ width: `${energyPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span className="text-cyan-300 font-semibold">{weaponCfg?.name || 'VULCAN'}</span>
            <span>SYSTEM OGNIOWY [1-4]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
