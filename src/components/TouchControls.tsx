import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, WeaponMode, WEAPON_MODE_CONFIGS } from '../types/game';
import { Zap, Crosshair, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  engine: GameEngine;
  onStateUpdate: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine, onStateUpdate }) => {
  if (engine.gameState !== GameState.PLAYING) return null;

  const unlocked = engine.player1.unlockedWeaponModes;

  return (
    <div className="w-full max-w-[900px] mt-2 px-2 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
      {/* Player 1 Left / Right steering */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.player1.movingLeft = true;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            engine.player1.movingLeft = false;
          }}
          onMouseDown={() => (engine.player1.movingLeft = true)}
          onMouseUp={() => (engine.player1.movingLeft = false)}
          onMouseLeave={() => (engine.player1.movingLeft = false)}
          className="w-13 h-13 sm:w-14 sm:h-14 bg-cyan-950/70 border-2 border-cyan-400/60 rounded-xl active:bg-cyan-600/40 text-cyan-300 font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          ◀
        </button>
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.player1.movingRight = true;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            engine.player1.movingRight = false;
          }}
          onMouseDown={() => (engine.player1.movingRight = true)}
          onMouseUp={() => (engine.player1.movingRight = false)}
          onMouseLeave={() => (engine.player1.movingRight = false)}
          className="w-13 h-13 sm:w-14 sm:h-14 bg-cyan-950/70 border-2 border-cyan-400/60 rounded-xl active:bg-cyan-600/40 text-cyan-300 font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          ▶
        </button>
      </div>

      {/* Middle: Weapon Mode Switchers & Pause */}
      <div className="flex items-center gap-1.5 order-last sm:order-none w-full sm:w-auto justify-center">
        {unlocked.map((mode) => {
          const cfg = WEAPON_MODE_CONFIGS[mode];
          const isCurrent = engine.player1.weaponMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                engine.setWeaponMode(mode);
                onStateUpdate();
              }}
              style={{
                borderColor: isCurrent ? cfg.color : 'rgba(71, 85, 105, 0.4)',
                backgroundColor: isCurrent ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.6)',
                color: isCurrent ? cfg.color : '#94a3b8',
              }}
              className="px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold tracking-wider active:scale-95 transition shadow-sm"
            >
              {mode === WeaponMode.LASER_BEAM && '⚡ '}
              {mode === WeaponMode.TRIPLE_SHOT && '🔱 '}
              {mode === WeaponMode.PLASMA_SPREAD && '🔮 '}
              {cfg.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            engine.pauseGame();
            onStateUpdate();
          }}
          className="px-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-slate-300 text-[11px] font-mono font-semibold tracking-wider hover:bg-slate-800 transition"
        >
          PAUSE
        </button>
      </div>

      {/* Player 1 Fire */}
      <div className="flex items-center gap-3">
        {engine.twoPlayerMode && (
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[11px] text-pink-400 font-mono">P2: A/D+F</span>
          </div>
        )}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            engine.spaceHeld = true;
            if (engine.fireCooldown === 0) engine.firePlayer1();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            engine.spaceHeld = false;
            engine.player1.isLaserActive = false;
          }}
          onMouseDown={() => {
            engine.spaceHeld = true;
            if (engine.fireCooldown === 0) engine.firePlayer1();
          }}
          onMouseUp={() => {
            engine.spaceHeld = false;
            engine.player1.isLaserActive = false;
          }}
          onMouseLeave={() => {
            engine.spaceHeld = false;
            engine.player1.isLaserActive = false;
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-cyan-600/80 to-blue-500/80 border-2 border-cyan-300 rounded-2xl active:scale-95 text-white font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(55,245,255,0.4)] transition-transform"
        >
          FIRE
        </button>
      </div>
    </div>
  );
};
