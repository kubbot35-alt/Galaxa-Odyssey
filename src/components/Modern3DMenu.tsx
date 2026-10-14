import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GameEngine } from '../game/GameEngine';
import {
  GameState,
  DifficultyLevel,
  UpgradeOption,
  UPGRADE_CONFIGS,
  WeaponMode,
  WEAPON_MODE_CONFIGS,
} from '../types/game';
import {
  SpaceHangarScene,
  SHIP_SKINS,
  ShipSkinId,
} from './3d/SpaceHangarScene';
import { soundEngine } from '../audio/soundEngine';
import {
  Rocket,
  Shield,
  Crosshair,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  ChevronRight,
  BookOpen,
  Settings,
  Users,
  Eye,
  Camera,
  Palette,
  RotateCw,
} from 'lucide-react';

interface Modern3DMenuProps {
  engine: GameEngine;
  onLaunch: () => void;
  onStateUpdate: () => void;
  onSwitchToRetro?: () => void;
}

type MenuTab = 'main' | 'deploy' | 'loadout' | 'diagnostics' | 'manual';

export const Modern3DMenu: React.FC<Modern3DMenuProps> = ({
  engine,
  onLaunch,
  onStateUpdate,
  onSwitchToRetro,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SpaceHangarScene | null>(null);

  const [activeTab, setActiveTab] = useState<MenuTab>('main');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(engine.difficultyLevel);
  const [selectedCoop, setSelectedCoop] = useState<boolean>(engine.twoPlayerMode);
  const [activeSkin, setActiveSkin] = useState<ShipSkinId>(() => {
    return (localStorage.getItem('galaxa_ship_skin') as ShipSkinId) || 'titanium';
  });
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<string>('default');

  // Initialize Three.js 3D Hangar Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new SpaceHangarScene(containerRef.current);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update Camera focus based on active tab
  useEffect(() => {
    if (!sceneRef.current) return;
    switch (activeTab) {
      case 'deploy':
        sceneRef.current.setCameraFocus('cinematic');
        setActiveCameraPreset('cinematic');
        break;
      case 'loadout':
        sceneRef.current.setCameraFocus('weapons');
        setActiveCameraPreset('weapons');
        break;
      case 'diagnostics':
        sceneRef.current.setCameraFocus('cockpit');
        setActiveCameraPreset('cockpit');
        break;
      case 'manual':
        sceneRef.current.setCameraFocus('engines');
        setActiveCameraPreset('engines');
        break;
      default:
        sceneRef.current.setCameraFocus('default');
        setActiveCameraPreset('default');
        break;
    }
  }, [activeTab]);

  const handleCameraChange = (preset: string) => {
    soundEngine.playUiClick();
    setActiveCameraPreset(preset);
    if (sceneRef.current) {
      sceneRef.current.setCameraFocus(preset);
    }
  };

  const handleSkinChange = (skinId: ShipSkinId) => {
    soundEngine.playUiClick();
    setActiveSkin(skinId);
    try {
      localStorage.setItem('galaxa_ship_skin', skinId);
    } catch {}
    if (sceneRef.current) {
      sceneRef.current.setShipSkin(skinId);
    }
  };

  const handleStartMission = () => {
    soundEngine.playWarpJump();
    setIsWarping(true);
    engine.difficultyLevel = selectedDifficulty;
    engine.twoPlayerMode = selectedCoop;

    if (sceneRef.current) {
      sceneRef.current.triggerHyperdriveLaunch(() => {
        soundEngine.stopMenuMusic();
        engine.startNewGame();
        onLaunch();
      });
    } else {
      soundEngine.stopMenuMusic();
      engine.startNewGame();
      onLaunch();
    }
  };

  const handleResumeSaved = () => {
    soundEngine.playWarpJump();
    setIsWarping(true);

    if (sceneRef.current) {
      sceneRef.current.triggerHyperdriveLaunch(() => {
        soundEngine.stopMenuMusic();
        engine.loadSavedGame();
        onLaunch();
      });
    } else {
      soundEngine.stopMenuMusic();
      engine.loadSavedGame();
      onLaunch();
    }
  };

  const isUpgradeOwned = (option: UpgradeOption) => {
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

  const hasSave = engine.hasSavedGame();

  return (
    <div className="relative w-full max-w-[900px] aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(2,132,199,0.3)] border border-cyan-500/40 select-none">
      {/* 1. Three.js 3D WebGL Canvas Layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
        title="Click & Drag to Orbit 3D Starfighter • Scroll to Zoom"
      />

      {/* Warp Jump Overlay Flash */}
      {isWarping && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-cyan-400/20 animate-pulse backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center">
          <div className="text-center font-mono">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-widest drop-shadow-[0_0_20px_#38bdf8]">
              HYPERDRIVE ENGAGED
            </div>
            <div className="text-xs text-cyan-200 mt-1 uppercase tracking-widest">
              Jumping to frontline coordinates...
            </div>
          </div>
        </div>
      )}

      {/* 2. Modern 21st-Century Holographic Diegetic HUD Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-5 pointer-events-none">
        {/* Top Telemetry Header */}
        <div className="flex items-start justify-between gap-3 pointer-events-auto">
          {/* Ship Identification Card */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3.5 py-2 shadow-2xl">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                ORBITAL DOCK 07 // DEEP COMBAT
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-white font-mono flex items-center gap-2">
              ODYSSEY-MK4 <span className="text-cyan-400 font-normal">INTERCEPTOR</span>
            </h2>
          </div>

          {/* Quick 3D Camera & Finish Controls */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-2xl">
            <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Camera size={12} className="text-cyan-400" /> CAM:
            </span>
            {[
              { id: 'default', label: '3/4 Hero' },
              { id: 'cockpit', label: 'Cockpit' },
              { id: 'weapons', label: 'Weapons' },
              { id: 'engines', label: 'Engines' },
              { id: 'orbital', label: 'Orbit' },
            ].map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => handleCameraChange(cam.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  activeCameraPreset === cam.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Pilot War Chest & Stats */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-3 text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-400 font-medium">WAR CHEST</div>
              <div className="text-amber-300 font-bold text-xs sm:text-sm">
                {engine.credits} <span className="text-[9px] text-amber-400/80">CR</span>
              </div>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div>
              <div className="text-[9px] text-slate-400 font-medium">COMBAT SCORE</div>
              <div className="text-cyan-300 font-bold text-xs sm:text-sm">{engine.highScore}</div>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                engine.openAchievements();
                onStateUpdate();
              }}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/15 border border-amber-500/50 rounded-lg text-amber-300 hover:bg-amber-500/25 transition cursor-pointer text-xs font-bold"
              title="Inspect Unlocked Badges"
            >
              <Trophy size={13} className="text-amber-400" />
              <span>
                {engine.getUnlockedCount()}/{engine.getTotalCount()}
              </span>
            </button>
          </div>
        </div>

        {/* Center / Left: Interactive 21st-Century Menu Views */}
        <div className="w-full max-w-[440px] pointer-events-auto my-auto">
          {activeTab === 'main' && (
            <div className="space-y-2.5 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Brand Title */}
              <div className="mb-3">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-400 font-bold mb-1 flex items-center gap-2">
                  <span>TACTICAL FLIGHT DECK</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[10px] text-emerald-400">ONLINE</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-mono tracking-tight drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                  GALAXA ODYSSEY
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-[360px] leading-relaxed">
                  Next-generation 21st-century starfighter orbital command & alien frontline defense simulator.
                </p>
              </div>

              {/* Resume Mission Button if save exists */}
              {hasSave && (
                <button
                  type="button"
                  onClick={handleResumeSaved}
                  onMouseEnter={() => soundEngine.playUiHover()}
                  className="w-full group px-4 py-3 bg-gradient-to-r from-emerald-950/85 via-slate-900/90 to-emerald-950/85 hover:from-emerald-900/90 hover:to-slate-900 border border-emerald-500/60 rounded-xl text-left transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Rocket size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
                        RESUME MISSION
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">
                          WAVE {engine.wave + 1}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300/80">Continue from saved tactical state</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Primary Action: Deploy Mission */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('deploy');
                }}
                onMouseEnter={() => soundEngine.playUiHover()}
                className="w-full group px-4 py-3 bg-gradient-to-r from-cyan-950/85 via-slate-900/90 to-slate-950/90 hover:from-cyan-900/85 hover:to-slate-900 border border-cyan-500/60 rounded-xl text-left transition-all duration-200 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                    <Crosshair size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white font-mono">DEPLOY NEW MISSION</div>
                    <div className="text-[11px] text-slate-300">Launch Solo Interceptor or 2P Co-op sortie</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Ship Loadout & Hangar Upgrades */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('loadout');
                }}
                onMouseEnter={() => soundEngine.playUiHover()}
                className="w-full group px-4 py-2.5 bg-slate-950/85 hover:bg-slate-900/90 border border-purple-500/40 rounded-xl text-left transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono">SHIP LOADOUT & HANGAR</div>
                    <div className="text-[10px] text-slate-400">Weapon tiers, ship skins & shield upgrades</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Combat Honors & Achievements */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  engine.openAchievements();
                  onStateUpdate();
                }}
                onMouseEnter={() => soundEngine.playUiHover()}
                className="w-full group px-4 py-2.5 bg-slate-950/85 hover:bg-slate-900/90 border border-amber-500/40 rounded-xl text-left transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                      COMBAT HONORS
                      <span className="text-[10px] text-amber-300 font-mono font-bold">
                        ({engine.getUnlockedCount()}/{engine.getTotalCount()})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">Inspect unlocked badges and combat honors</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Diagnostics & Flight Manual row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('diagnostics');
                  }}
                  onMouseEnter={() => soundEngine.playUiHover()}
                  className="px-3 py-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 rounded-xl text-left transition text-xs font-mono font-semibold text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <Settings size={14} className="text-cyan-400 shrink-0" />
                  <span>DIAGNOSTICS</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('manual');
                  }}
                  onMouseEnter={() => soundEngine.playUiHover()}
                  className="px-3 py-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 rounded-xl text-left transition text-xs font-mono font-semibold text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen size={14} className="text-pink-400 shrink-0" />
                  <span>FLIGHT MANUAL</span>
                </button>
              </div>

              {/* Optional switch to retro 80s arcade button */}
              {onSwitchToRetro && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onSwitchToRetro();
                    }}
                    onMouseEnter={() => soundEngine.playUiHover()}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 text-[10px] font-mono text-slate-400 hover:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw size={12} />
                    <span>COMPARE WITH VINTAGE 80S ARCADE MENU</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DEPLOY TAB: Mission Configuration & Launch */}
          {activeTab === 'deploy' && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs sm:text-sm">
                  <Rocket size={16} /> MISSION DEPLOYMENT PROTOCOL
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('main');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-mono transition cursor-pointer"
                >
                  [BACK]
                </button>
              </div>

              {/* Formation: 1P or 2P */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  FLIGHT FORMATION
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedCoop(false);
                    }}
                    onMouseEnter={() => soundEngine.playUiHover()}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      !selectedCoop
                        ? 'border-cyan-400 bg-cyan-950/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">1P SOLO RECON</div>
                    <div className="text-[10px] text-slate-400">Single interceptor run</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedCoop(true);
                    }}
                    onMouseEnter={() => soundEngine.playUiHover()}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedCoop
                        ? 'border-purple-400 bg-purple-950/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono flex items-center gap-1">
                      <Users size={12} /> 2P CO-OP WINGMAN
                    </div>
                    <div className="text-[10px] text-slate-400">Shared combat flight screen</div>
                  </button>
                </div>
              </div>

              {/* Difficulty Threat Profile */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  THREAT SECTOR PROFILE
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[DifficultyLevel.EASY, DifficultyLevel.NORMAL, DifficultyLevel.HARD].map((diff) => {
                    const isSelected = selectedDifficulty === diff;
                    const color =
                      diff === DifficultyLevel.EASY
                        ? 'text-emerald-400 border-emerald-500/60 bg-emerald-950/40'
                        : diff === DifficultyLevel.NORMAL
                        ? 'text-cyan-400 border-cyan-500/60 bg-cyan-950/40'
                        : 'text-pink-400 border-pink-500/60 bg-pink-950/40';

                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          soundEngine.playUiClick();
                          setSelectedDifficulty(diff);
                        }}
                        onMouseEnter={() => soundEngine.playUiHover()}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? `${color} shadow-lg font-bold`
                            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-mono font-black">{diff}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {diff === DifficultyLevel.EASY ? '0.8x Hazard' : diff === DifficultyLevel.NORMAL ? '1.0x Standard' : '1.5x Lethal'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Launch Button */}
              <button
                type="button"
                onClick={handleStartMission}
                onMouseEnter={() => soundEngine.playUiHover()}
                disabled={isWarping}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm font-mono tracking-wider rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Rocket size={18} /> ENGAGE HYPERDRIVE & LAUNCH
              </button>
            </div>
          )}

          {/* LOADOUT TAB: 3D Hangar Upgrades Inspection */}
          {activeTab === 'loadout' && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in duration-200 max-h-[66vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs sm:text-sm">
                  <Shield size={16} /> STARFIGHTER LOADOUT & UPGRADES
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('main');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-mono transition cursor-pointer"
                >
                  [BACK]
                </button>
              </div>

              {/* Starfighter Skin Customizer */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Palette size={12} className="text-purple-400" /> STARFIGHTER LIVERY
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(SHIP_SKINS) as ShipSkinId[]).map((skinKey) => {
                    const skin = SHIP_SKINS[skinKey];
                    const isSelected = activeSkin === skinKey;
                    return (
                      <button
                        key={skinKey}
                        type="button"
                        onClick={() => handleSkinChange(skinKey)}
                        className={`p-1.5 rounded-lg border text-center transition cursor-pointer text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'border-purple-400 bg-purple-950/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {skin.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-amber-300 font-mono font-bold bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-1.5 flex justify-between items-center">
                <span>AVAILABLE CREDITS:</span>
                <span className="text-sm font-black">{engine.credits} CR</span>
              </div>

              {/* Upgrades List */}
              <div className="space-y-2">
                {UPGRADE_CONFIGS.filter((u) => u.id !== UpgradeOption.RETURN).map((u) => {
                  const owned = isUpgradeOwned(u.id);
                  return (
                    <div
                      key={u.id}
                      className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          {u.name}
                          {owned && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              MOUNTED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.subtitle}</div>
                      </div>

                      <button
                        type="button"
                        disabled={owned || engine.credits < u.cost}
                        onClick={() => {
                          soundEngine.playUiClick();
                          engine.buyUpgrade(u.id);
                          onStateUpdate();
                        }}
                        onMouseEnter={() => soundEngine.playUiHover()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition ${
                          owned
                            ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                            : engine.credits >= u.cost
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] cursor-pointer'
                            : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                        }`}
                      >
                        {owned ? 'ACTIVE' : `${u.cost} CR`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('main');
                }}
                className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                RETURN TO BRIDGE
              </button>
            </div>
          )}

          {/* DIAGNOSTICS TAB: System Configuration */}
          {activeTab === 'diagnostics' && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs sm:text-sm">
                  <Settings size={16} /> SYSTEM DIAGNOSTICS & AUDIO
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('main');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-mono transition cursor-pointer"
                >
                  [BACK]
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Audio Output */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                      {engine.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono">AUDIO SYNTHESIZER</div>
                      <div className="text-[10px] text-slate-400">Weapon lasers, thrusters & engine chimes</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      engine.toggleAudio();
                      onStateUpdate();
                    }}
                    onMouseEnter={() => soundEngine.playUiHover()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      engine.soundEnabled
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {engine.soundEnabled ? 'ONLINE' : 'MUTED'}
                  </button>
                </div>

                {/* Particle FX */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono">PARTICLE VOLUMETRICS</div>
                      <div className="text-[10px] text-slate-400">High-speed plasma sparks & beam glows</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      engine.toggleParticles();
                      onStateUpdate();
                    }}
                    onMouseEnter={() => soundEngine.playUiHover()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      engine.particlesEnabled
                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {engine.particlesEnabled ? 'MAX FX' : 'REDUCED'}
                  </button>
                </div>

                {/* Reset Profile */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-300 font-mono">RESET PROFILE DATA</div>
                    <div className="text-[10px] text-slate-400">Wipe saves, stats and mission honors</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset local pilot profile and achievements?')) {
                        engine.clearSavedGame();
                        localStorage.removeItem('galaxa_odyssey_achievements');
                        localStorage.removeItem('galaxa_odyssey_profile');
                        engine.loadAchievements();
                        engine.loadProfile();
                        onStateUpdate();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-rose-900/60 text-rose-300 transition cursor-pointer"
                  >
                    WIPE DATA
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('main');
                }}
                className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                RETURN TO BRIDGE
              </button>
            </div>
          )}

          {/* MANUAL TAB: Flight Controls & Combat Manual */}
          {activeTab === 'manual' && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-pink-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in duration-200 max-h-[66vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-pink-400 font-mono font-bold text-xs sm:text-sm">
                  <BookOpen size={16} /> TACTICAL COMBAT MANUAL
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('main');
                  }}
                  className="text-xs text-slate-400 hover:text-white font-mono transition cursor-pointer"
                >
                  [BACK]
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-slate-300">STEER STARFIGHTER (P1)</span>
                  <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                    ← / → ARROWS
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-slate-300">FIRE ACTIVE WEAPON (P1)</span>
                  <span className="text-purple-400 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40">
                    SPACEBAR
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-slate-300">SWITCH WEAPON MODES</span>
                  <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    1, 2, 3, 4 / Q, E
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-slate-300">CO-OP WINGMAN (P2)</span>
                  <span className="text-pink-400 font-bold bg-pink-950/80 px-2 py-0.5 rounded border border-pink-500/40">
                    A, D (MOVE) / F (FIRE)
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-slate-300">TACTICAL PAUSE & SAVE</span>
                  <span className="text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    ESC
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveTab('main');
                }}
                className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                RETURN TO BRIDGE
              </button>
            </div>
          )}
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold">RADAR:</span>
            <span>SECTOR 07 CLEAR • WEAPON CAPACITORS 100%</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500">
            <span>DRAG MOUSE TO ORBIT 3D STARFIGHTER</span>
            <span>•</span>
            <span>SCROLL TO ZOOM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
