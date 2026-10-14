import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { SpaceCombat3DScene, CameraViewMode } from './3d/SpaceCombat3DScene';
import {
  GameState,
  WeaponMode,
  WEAPON_MODE_CONFIGS,
  SoundType,
} from '../types/game';
import { MAX_SHIELD, MAX_WEAPON_ENERGY } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';
import {
  Shield,
  Zap,
  Crosshair,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Flame,
  Radio,
} from 'lucide-react';
import { ShipSkinId } from './3d/SpaceHangarScene';

interface Modern3DGameCanvasProps {
  engine: GameEngine;
  onStateUpdate: () => void;
  selectedSkin?: ShipSkinId;
  onReturnToHangar?: () => void;
}

export const Modern3DGameCanvas: React.FC<Modern3DGameCanvasProps> = ({
  engine,
  onStateUpdate,
  selectedSkin = 'titanium',
  onReturnToHangar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SpaceCombat3DScene | null>(null);
  const [viewMode, setViewMode] = useState<CameraViewMode>('CHASE_3D');
  const [isWarpActive, setIsWarpActive] = useState(false);
  const [, setTick] = useState(0);

  // Initialize Three.js 3D Combat Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new SpaceCombat3DScene(containerRef.current, selectedSkin);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [selectedSkin]);

  // Main Animation / Game Sync Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      // 1. Update Game Engine Logic
      engine.update();

      // 2. Synchronize 3D Scene
      if (sceneRef.current) {
        sceneRef.current.syncWithEngine(engine);
        setIsWarpActive(sceneRef.current.isWarpJumping);
      }

      // Re-render React HUD at steady rate
      setTick((t) => (t + 1) % 60);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (engine.isAchievementsOpen) {
        if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
          engine.closeAchievements();
          onStateUpdate();
        }
        return;
      }

      // In-game weapon switching
      if (engine.gameState === GameState.PLAYING) {
        if (e.key === '1') {
          engine.setWeaponMode(WeaponMode.STANDARD);
          onStateUpdate();
        } else if (e.key === '2') {
          engine.setWeaponMode(WeaponMode.TRIPLE_SHOT);
          onStateUpdate();
        } else if (e.key === '3') {
          engine.setWeaponMode(WeaponMode.LASER_BEAM);
          onStateUpdate();
        } else if (e.key === '4') {
          engine.setWeaponMode(WeaponMode.PLASMA_SPREAD);
          onStateUpdate();
        } else if (e.key === 'q' || e.key === 'Q') {
          engine.cycleWeaponMode(-1);
          onStateUpdate();
        } else if (e.key === 'e' || e.key === 'E') {
          engine.cycleWeaponMode(1);
          onStateUpdate();
        } else if (e.key === 'v' || e.key === 'V') {
          toggleViewMode();
        }
      }

      // Movement & Shooting - Player 1
      if (e.key === 'ArrowLeft') {
        engine.player1.movingLeft = true;
      } else if (e.key === 'ArrowRight') {
        engine.player1.movingRight = true;
      } else if (e.key === ' ' || e.code === 'Space') {
        engine.spaceHeld = true;
        if (engine.gameState === GameState.PLAYING && engine.fireCooldown === 0) {
          engine.firePlayer1();
        }
        e.preventDefault();
      }

      // Player 2 controls (A / D / F)
      if (e.key === 'a' || e.key === 'A') {
        if (engine.player2) engine.player2.movingLeft = true;
      } else if (e.key === 'd' || e.key === 'D') {
        if (engine.player2) engine.player2.movingRight = true;
      } else if (e.key === 'f' || e.key === 'F') {
        engine.secondPlayerFireHeld = true;
        if (engine.gameState === GameState.PLAYING && engine.secondPlayerFireCooldown === 0) {
          engine.firePlayer2();
        }
      }

      // Pause toggle
      if (e.key === 'Escape') {
        if (engine.gameState === GameState.PLAYING) {
          engine.pauseGame();
          onStateUpdate();
        } else if (engine.gameState === GameState.PAUSED) {
          engine.resumeGame();
          onStateUpdate();
        }
      }

      // Enter key actions
      if (e.key === 'Enter') {
        if (engine.gameState === GameState.PAUSED) {
          engine.resumeGame();
          onStateUpdate();
        } else if (engine.gameState === GameState.GAMEOVER) {
          if (onReturnToHangar) onReturnToHangar();
          else engine.returnToMenu();
          onStateUpdate();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        engine.player1.movingLeft = false;
      } else if (e.key === 'ArrowRight') {
        engine.player1.movingRight = false;
      } else if (e.key === ' ' || e.code === 'Space') {
        engine.spaceHeld = false;
        engine.player1.isLaserActive = false;
      }

      if (e.key === 'a' || e.key === 'A') {
        if (engine.player2) engine.player2.movingLeft = false;
      } else if (e.key === 'd' || e.key === 'D') {
        if (engine.player2) engine.player2.movingRight = false;
      } else if (e.key === 'f' || e.key === 'F') {
        engine.secondPlayerFireHeld = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onStateUpdate, onReturnToHangar]);

  // Toggle Camera View Mode
  const toggleViewMode = useCallback(() => {
    soundEngine.playUiClick();
    setViewMode((prev) => {
      let next: CameraViewMode = 'CHASE_3D';
      if (prev === 'CHASE_3D') next = 'COCKPIT_3D';
      else if (prev === 'COCKPIT_3D') next = 'TACTICAL_3D';
      else next = 'CHASE_3D';

      if (sceneRef.current) {
        sceneRef.current.setViewMode(next);
      }
      return next;
    });
  }, []);

  const handleSelectWeapon = (mode: WeaponMode) => {
    if (engine.player1.unlockedWeaponModes.includes(mode)) {
      soundEngine.playUiClick();
      engine.setWeaponMode(mode);
      onStateUpdate();
    }
  };

  const handleManualWarpJump = () => {
    soundEngine.playWarpJump();
    if (sceneRef.current) {
      sceneRef.current.triggerHyperspaceJump();
    }
  };

  const p1 = engine.player1;
  const shieldPercent = Math.max(0, Math.min(100, Math.round((p1.shield / MAX_SHIELD) * 100)));
  const energyPercent = Math.max(0, Math.min(100, Math.round((p1.weaponEnergy / MAX_WEAPON_ENERGY) * 100)));

  return (
    <div className="relative w-full max-w-[1000px] h-[640px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-slate-950 select-none">
      {/* 3D WebGL Three.js Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Diegetic 21st-Century Tactical HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono">
        {/* TOP STATUS BAR */}
        <div className="w-full flex items-start justify-between gap-4 pointer-events-auto">
          {/* Left: Shield & Hull Status */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 shadow-lg min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Shield size={14} className="text-cyan-400" /> DEFLECTOR SHIELD
              </span>
              <span className="font-bold text-cyan-200">{shieldPercent}%</span>
            </div>
            {/* Shield Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
              <div
                className={`h-full transition-all duration-200 ${
                  shieldPercent > 50
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : shieldPercent > 20
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${shieldPercent}%` }}
              />
            </div>

            {/* Pilot Lives (Hull Units) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">HULL RESERVES:</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.max(0, p1.lives) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-sm bg-cyan-400 border border-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                    title={`Life Unit ${i + 1}`}
                  />
                ))}
                {p1.lives <= 0 && <span className="text-red-400 font-bold">CRITICAL</span>}
              </div>
            </div>
          </div>

          {/* Center: Mission Sector & 3D View Mode Switcher */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-xs font-bold tracking-widest text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2">
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              <span>SECTOR {engine.wave} • ACTIVE COMBAT ZONE</span>
            </div>

            {/* Camera View Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition text-[11px] shadow-sm"
                title="Przełącz perspektywę kamery 3D (Klawisz V)"
              >
                <Camera size={13} className="text-cyan-400" />
                <span>
                  {viewMode === 'CHASE_3D' && 'Widok: Zza statku (3D)'}
                  {viewMode === 'COCKPIT_3D' && 'Widok: Bliski pościg (3D)'}
                  {viewMode === 'TACTICAL_3D' && 'Widok: Taktyczny (3D)'}
                </span>
                <span className="text-slate-500 text-[9px]">[V]</span>
              </button>

              <button
                type="button"
                onClick={handleManualWarpJump}
                disabled={isWarpActive}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 hover:text-white transition text-[11px]"
                title="Wymuś skok w nadprzestrzeń (Warp Jump)"
              >
                <Flame size={12} className="text-indigo-400" />
                <span>Warp</span>
              </button>
            </div>
          </div>

          {/* Right: Weapon Energy & Score Telemetry */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 shadow-lg min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Zap size={14} className="text-amber-400" /> WEAPON CAPACITOR
              </span>
              <span className="font-bold text-amber-200">{energyPercent}%</span>
            </div>
            {/* Energy Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-amber-500/20">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${energyPercent}%` }}
              />
            </div>

            {/* Score & Credits */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">SCORE:</span>
              <span className="font-bold text-cyan-300">{p1.score.toLocaleString()}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">CREDITS:</span>
              <span className="font-bold text-amber-400">+{engine.credits}</span>
            </div>
          </div>
        </div>

        {/* CENTER HYPERSPACE WARP ANNOUNCEMENT OVERLAY */}
        {isWarpActive && (
          <div className="self-center flex flex-col items-center justify-center p-6 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 backdrop-blur-lg shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-cyan-300 text-lg font-black tracking-widest uppercase">
              <Flame size={22} className="text-cyan-400 animate-bounce" />
              <span>SKOK W NADPRZESTRZEŃ • HYPERDRIVE ACTIVE</span>
            </div>
            <p className="text-xs text-cyan-200 mt-1">Kamera zablokowana za statkiem • Tranzyt do Sektora {engine.wave}</p>
          </div>
        )}

        {/* WEAPON PICKUP ANNOUNCEMENT BANNER */}
        {engine.weaponAnnouncement && !isWarpActive && (
          <div
            className="self-center px-6 py-2 rounded-xl backdrop-blur-md border shadow-xl flex items-center gap-3 transition-all animate-bounce"
            style={{
              backgroundColor: 'rgba(8, 15, 42, 0.92)',
              borderColor: engine.weaponAnnouncement.color,
              boxShadow: `0 0 25px ${engine.weaponAnnouncement.color}40`,
            }}
          >
            <Sparkles size={18} style={{ color: engine.weaponAnnouncement.color }} />
            <div>
              <div className="font-black text-sm text-white tracking-wide">
                {engine.weaponAnnouncement.title}
              </div>
              <div className="text-[11px] text-slate-300">
                {engine.weaponAnnouncement.subtitle}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM WEAPON SYSTEMS TACTICAL SELECTION BAR */}
        <div className="w-full flex items-end justify-between gap-4 pointer-events-auto">
          {/* Controls Reminder */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400">
            <span>[← / →] Ruch</span>
            <span className="text-slate-600">•</span>
            <span>[SPACJA] Ogień</span>
            <span className="text-slate-600">•</span>
            <span>[1-4 / Q, E] Broń</span>
            <span className="text-slate-600">•</span>
            <span>[V] Kamera 3D</span>
            <span className="text-slate-600">•</span>
            <span>[ESC] Pauza</span>
          </div>

          {/* Weapon Modes Quick-Switch Array */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl mx-auto sm:mx-0">
            {[
              { mode: WeaponMode.STANDARD, num: '1', label: 'BLASTER', icon: Crosshair },
              { mode: WeaponMode.TRIPLE_SHOT, num: '2', label: 'TRIPLE', icon: Sparkles },
              { mode: WeaponMode.LASER_BEAM, num: '3', label: 'LASER', icon: Zap },
              { mode: WeaponMode.PLASMA_SPREAD, num: '4', label: 'PLASMA', icon: Layers },
            ].map(({ mode, num, label, icon: Icon }) => {
              const cfg = WEAPON_MODE_CONFIGS[mode];
              const isUnlocked = p1.unlockedWeaponModes.includes(mode);
              const isActive = p1.weaponMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectWeapon(mode)}
                  disabled={!isUnlocked}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-mono font-bold text-xs ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : isUnlocked
                      ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300'
                      : 'bg-slate-900/40 border border-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Icon size={14} style={{ color: isUnlocked ? cfg.color : '#64748b' }} />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-slate-400">[{num}]</span>
                    <span>{label}</span>
                  </div>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Co-op Player 2 Info (if active) */}
          {engine.twoPlayerMode && engine.player2 && (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-pink-500/30 text-[11px] text-pink-300 flex items-center gap-2">
              <span className="font-bold">PILOT 2:</span>
              <span>{engine.player2.lives > 0 ? `${engine.player2.lives} Lives` : 'KIA'}</span>
            </div>
          )}
        </div>
      </div>

      {/* PAUSE OVERLAY MODAL */}
      {engine.gameState === GameState.PAUSED && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-cyan-400 font-mono tracking-wider">
              SORTIE SUSPENDED
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Sector {engine.wave} • Tactical Systems on Standby
            </p>

            <div className="w-full flex flex-col gap-3 mt-6 font-mono text-sm">
              <button
                type="button"
                onClick={() => {
                  engine.resumeGame();
                  onStateUpdate();
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <Play size={18} />
                <span>RESUME SORTIE</span>
              </button>

              <button
                type="button"
                onClick={toggleViewMode}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition text-xs"
              >
                <Camera size={16} className="text-cyan-400" />
                <span>SWITCH CAMERA PERSPECTIVE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onReturnToHangar) onReturnToHangar();
                  else engine.returnToMenu();
                  onStateUpdate();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 hover:border-red-500/50 hover:text-red-300 text-slate-400 border border-slate-700/80 flex items-center justify-center gap-2 transition text-xs"
              >
                <RotateCcw size={16} />
                <span>ABORT TO SHIP HANGAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY MODAL */}
      {engine.gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-500/40 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-red-500 font-mono tracking-wider animate-pulse">
              HULL BREACHED • CRITICAL FAILURE
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Starfighter Destroyed in Sector {engine.wave}
            </p>

            {/* Debrief stats */}
            <div className="w-full grid grid-cols-2 gap-3 my-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500">FINAL SCORE</span>
                <p className="text-lg font-black text-cyan-300">{p1.score.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">SALVAGE CREDITS</span>
                <p className="text-lg font-black text-amber-400">+{engine.credits}</p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 font-mono text-sm">
              <button
                type="button"
                onClick={() => {
                  engine.startNewGame();
                  if (sceneRef.current) sceneRef.current.triggerHyperspaceArrival();
                  onStateUpdate();
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <RotateCcw size={18} />
                <span>DEPLOY REPLACEMENT FIGHTER</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onReturnToHangar) onReturnToHangar();
                  else engine.returnToMenu();
                  onStateUpdate();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition text-xs"
              >
                <ChevronRight size={16} />
                <span>RETURN TO SHIP HANGAR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
