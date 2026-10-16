import React, { useEffect } from 'react';
import { SkipForward, Radio, Shield, Sparkles, Activity } from 'lucide-react';

interface CinematicTelemetry {
  phase: string;
  code: string;
  title: string;
  subtitle: string;
  progress: number;
  timeRemaining: string;
  active: boolean;
}

interface SpaceCinematicIntroOverlayProps {
  telemetry: CinematicTelemetry;
  onSkip: () => void;
  onLaunchImmediate?: () => void;
}

export const SpaceCinematicIntroOverlay: React.FC<SpaceCinematicIntroOverlayProps> = ({
  telemetry,
  onSkip,
  onLaunchImmediate,
}) => {
  // Listen for Space and Escape keys to skip, and Enter to start directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onLaunchImmediate) onLaunchImmediate();
        else onSkip();
      } else if (e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  // If intro telemetry is not active, unmount completely so no div overlays the screen
  if (!telemetry.active) {
    return null;
  }

  const percent = Math.min(100, Math.max(0, Math.round(telemetry.progress * 100)));

  return (
    <div
      onClick={onSkip}
      className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-auto cursor-pointer select-none transition-opacity duration-300 opacity-100"
      title="Click or press SPACE to skip intro and enter main menu"
    >
      {/* 1. TOP CINEMATIC LETTERBOX BAR */}
      <div className="w-full h-14 sm:h-18 bg-black/95 backdrop-blur-md border-b border-cyan-500/30 flex items-center justify-between px-3 sm:px-6 transition-transform duration-700 shadow-2xl">
        {/* Left: Recording & Camera Feed Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-red-400">
              REC
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-wider text-cyan-300">
              HANGAR BAY 09 // CRANE-CAM 04
            </span>
            <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
              SEC 14-TITAN ORBITAL YARD • 60 FPS • RAW FEED
            </span>
          </div>
        </div>

        {/* Right: Optical Lens & Security Classification */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span>LENS: 35mm ANAMORPHIC</span>
          </div>
          <div className="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            SEC-LEVEL 4
          </div>
        </div>
      </div>

      {/* 2. CENTER VIEWPORT CINEMATIC FRAMING & SUBTITLES */}
      <div className="relative flex-1 flex flex-col justify-between p-4 sm:p-8 pointer-events-none">
        {/* Viewport Corner Reticles */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/50" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/50" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400/50" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400/50" />

        {/* Center Crosshair Guides */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-12 h-[1px] bg-cyan-400" />
          <div className="h-12 w-[1px] bg-cyan-400" />
        </div>

        {/* Telemetry Corner Indicator */}
        <div className="self-end text-right font-mono text-[10px] text-cyan-400/80 drop-shadow">
          <div>FOV: 62° &gt; 48° AUTO-TILT</div>
          <div>DOCK LOCK: POSITIVE</div>
        </div>

        {/* Cinematic Lower-Third Narrative Title Card */}
        <div className="max-w-xl mx-auto sm:mx-0 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3.5 sm:p-4 shadow-[0_0_30px_rgba(2,132,199,0.35)] transition-all duration-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-cyan-500 text-black">
              [{telemetry.phase}]
            </span>
            <span className="text-[10px] font-mono text-cyan-300 tracking-wider">
              {telemetry.code}
            </span>
          </div>
          <h3 className="text-base sm:text-xl font-black font-mono tracking-wider text-white drop-shadow-[0_0_12px_rgba(56,189,248,0.6)] flex items-center gap-2">
            {telemetry.title}
          </h3>
          <p className="text-xs font-mono text-slate-300 mt-1 leading-relaxed">
            {telemetry.subtitle}
          </p>
        </div>
      </div>

      {/* 3. BOTTOM CINEMATIC LETTERBOX BAR */}
      <div className="relative w-full h-16 sm:h-20 bg-black/95 backdrop-blur-md border-t border-cyan-500/30 flex items-center justify-between px-3 sm:px-6 transition-transform duration-700 shadow-2xl">
        {/* Continuous Progress Indicator Line along top of bottom bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-100 shadow-[0_0_10px_#38bdf8]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Starfighter Telemetry Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Activity size={16} className="animate-pulse" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wider">
              NX-ODYSSEY INTERCEPTOR
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400">
              STATUS: ALL SYSTEMS NOMINAL • PRE-FLIGHT {percent}%
            </span>
          </div>
        </div>

        {/* Skip Intro & Start Button */}
        <div className="flex items-center gap-2">
          {onLaunchImmediate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLaunchImmediate();
              }}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 transition-all shadow-[0_0_25px_rgba(6,182,212,0.8)] text-xs font-mono font-black group cursor-pointer animate-pulse"
            >
              <span>ROZPOCZNIJ MISJĘ</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded text-slate-950 font-bold">[ENTER]</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all text-xs font-mono font-bold group cursor-pointer"
          >
            <span>POMIŃ DO MENU</span>
            <SkipForward size={14} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline text-[10px] bg-slate-800 px-1 py-0.5 rounded text-slate-400">[SPACJA]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
