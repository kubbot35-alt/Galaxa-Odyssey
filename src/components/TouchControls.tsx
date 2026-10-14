import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState } from '../types/game';

interface TouchControlsProps {
  engine: GameEngine;
  onStateUpdate: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine, onStateUpdate }) => {
  if (engine.gameState !== GameState.PLAYING) return null;

  return (
    <div className="w-full max-w-[900px] mt-2 px-3 py-2 flex items-center justify-between select-none">
      {/* Player 1 Left / Right */}
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
          className="w-14 h-14 bg-cyan-950/70 border-2 border-cyan-400/60 rounded-xl active:bg-cyan-600/40 text-cyan-300 font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
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
          className="w-14 h-14 bg-cyan-950/70 border-2 border-cyan-400/60 rounded-xl active:bg-cyan-600/40 text-cyan-300 font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          ▶
        </button>
      </div>

      {/* Middle Pause button */}
      <button
        type="button"
        onClick={() => {
          engine.pauseGame();
          onStateUpdate();
        }}
        className="px-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-lg text-slate-300 text-xs font-semibold tracking-wider hover:bg-slate-800 transition"
      >
        PAUSE [ESC]
      </button>

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
          }}
          onMouseDown={() => {
            engine.spaceHeld = true;
            if (engine.fireCooldown === 0) engine.firePlayer1();
          }}
          onMouseUp={() => (engine.spaceHeld = false)}
          onMouseLeave={() => (engine.spaceHeld = false)}
          className="w-16 h-16 bg-gradient-to-tr from-cyan-600/80 to-blue-500/80 border-2 border-cyan-300 rounded-2xl active:scale-95 text-white font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(55,245,255,0.4)] transition-transform"
        >
          FIRE
        </button>
      </div>
    </div>
  );
};
