import React, { useEffect, useRef, useState } from 'react';
import { ProjectedTarget } from './SpaceCombat3DScene';
import { EnemyType, WeaponMode } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import {
  Crosshair,
  Target,
  Zap,
  AlertOctagon,
  ChevronsDown,
  Shield,
  Activity,
  Flame,
} from 'lucide-react';

interface SpaceCombatLockOnHUDProps {
  targets: ProjectedTarget[];
  primaryTarget: ProjectedTarget | null;
  weaponMode: WeaponMode;
  isTakingDamage?: boolean;
}

export type LockState = 'SEARCHING' | 'ACQUIRING' | 'LOCKED';

export const SpaceCombatLockOnHUD: React.FC<SpaceCombatLockOnHUDProps> = ({
  targets,
  primaryTarget,
  weaponMode,
  isTakingDamage,
}) => {
  // Lock state machine tracking
  const [lockProgress, setLockProgress] = useState(0); // 0 to 1
  const [lockState, setLockState] = useState<LockState>('SEARCHING');
  const lockedTargetIdRef = useRef<string | null>(null);
  const lastSoundTickRef = useRef<number>(0);
  const wasFullyLockedRef = useRef<boolean>(false);

  // Update Lock Progress
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updateLock = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (!primaryTarget || !primaryTarget.inView) {
        setLockProgress(0);
        setLockState('SEARCHING');
        lockedTargetIdRef.current = null;
        wasFullyLockedRef.current = false;
        animId = requestAnimationFrame(updateLock);
        return;
      }

      // Check if target changed
      if (lockedTargetIdRef.current !== primaryTarget.id) {
        lockedTargetIdRef.current = primaryTarget.id;
        setLockProgress(0.15);
        setLockState('ACQUIRING');
        wasFullyLockedRef.current = false;
      }

      // Lock acquisition rate (takes ~0.8s to fully lock on)
      setLockProgress((prev) => {
        const next = Math.min(1.0, prev + dt * 1.35);

        if (next >= 1.0) {
          setLockState('LOCKED');
          if (!wasFullyLockedRef.current) {
            wasFullyLockedRef.current = true;
            soundEngine.playTargetLockedAlert();
          }
        } else {
          setLockState('ACQUIRING');
          // Periodic acquiring beep every 260ms
          if (now - lastSoundTickRef.current > 260) {
            lastSoundTickRef.current = now;
            soundEngine.playTargetAcquiringBeep();
          }
        }
        return next;
      });

      animId = requestAnimationFrame(updateLock);
    };

    animId = requestAnimationFrame(updateLock);
    return () => cancelAnimationFrame(animId);
  }, [primaryTarget]);

  // Lead Aim Offset calculation for projectile deflection
  const leadOffset = primaryTarget
    ? {
        x: Number.isFinite(primaryTarget.enemyRef?.x) && Number.isFinite(primaryTarget.enemyRef?.startX)
          ? (primaryTarget.enemyRef.x - primaryTarget.enemyRef.startX) * 0.45
          : 0,
        y: primaryTarget.isDiving ? 28 : -14,
      }
    : { x: 0, y: 0 };

  const isLocked = lockState === 'LOCKED';
  const lockPercent = Math.round(lockProgress * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono">
      {/* 1. CENTRAL FLIGHT BORESIGHT / RETICLE */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-70">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Subtle Outer Horizon Circle */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/25 border-dashed animate-spin" style={{ animationDuration: '30s' }} />
          {/* Flight Crosshair Ticks */}
          <div className="w-10 h-[1.5px] bg-cyan-400/60" />
          <div className="absolute h-10 w-[1.5px] bg-cyan-400/60" />
          {/* Central Pip */}
          <div className="absolute w-2 h-2 rounded-full border border-cyan-300 bg-cyan-400/30" />
          {/* Pitch Ladder Marks */}
          <div className="absolute -top-6 w-8 h-[1px] bg-cyan-500/40" />
          <div className="absolute -bottom-6 w-8 h-[1px] bg-cyan-500/40" />
        </div>
      </div>

      {/* 2. DANGER CLOSE COLLISION WARNING BANNER */}
      {primaryTarget && primaryTarget.isDiving && primaryTarget.distanceMeters < 240 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-300 font-bold text-xs tracking-wider flex items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse">
          <AlertOctagon size={16} className="text-red-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span>⚠️ PROXIMITY ALERT: HOSTILE DIVE COLLISION COURSE [{primaryTarget.distanceMeters}M]</span>
        </div>
      )}

      {/* 3. DYNAMIC 3D SCREEN-SPACE TARGET LOCK BRACKETS */}
      {/* Secondary Target Markers */}
      {targets.map((tgt) => {
        if (!tgt.inView) return null;
        const isPrimary = primaryTarget?.id === tgt.id;
        if (isPrimary) return null; // Rendered below with full lock systems

        return (
          <div
            key={tgt.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-none"
            style={{
              left: `${tgt.screenPercentX}%`,
              top: `${tgt.screenPercentY}%`,
            }}
          >
            {/* Subtle Diamond Bracket */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div
                className={`w-6 h-6 border rotate-45 transition-colors ${
                  tgt.type === EnemyType.ELITE
                    ? 'border-fuchsia-400/50 bg-fuchsia-950/15'
                    : 'border-amber-400/40 bg-amber-950/10'
                }`}
              />
              {/* Distance Tag */}
              <div className="absolute -bottom-4 whitespace-nowrap text-[9px] font-bold text-slate-300/80 bg-slate-950/60 px-1 rounded border border-slate-700/50">
                {tgt.distanceMeters}m
              </div>
            </div>
          </div>
        );
      })}

      {/* PRIMARY TARGET LOCK RETICLE */}
      {primaryTarget && primaryTarget.inView && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-none"
          style={{
            left: `${primaryTarget.screenPercentX}%`,
            top: `${primaryTarget.screenPercentY}%`,
          }}
        >
          {/* Main Reticle Caliper Frame */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Corner Calipers */}
            <div
              className={`absolute inset-0 transition-all duration-200 ${
                isLocked
                  ? 'scale-100 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                  : 'scale-110 border border-cyan-400/50 border-dashed animate-spin'
              }`}
              style={{
                clipPath:
                  'polygon(0 0, 30% 0, 30% 10%, 10% 10%, 10% 30%, 0 30%, 0 70%, 10% 70%, 10% 90%, 30% 90%, 30% 100%, 0 100%, 70% 100%, 70% 90%, 90% 90%, 90% 70%, 100% 70%, 100% 30%, 90% 30%, 90% 10%, 70% 10%, 70% 0, 100% 0)',
                animationDuration: isLocked ? '0s' : '4s',
              }}
            />

            {/* Locked Diamond Core */}
            {isLocked && (
              <div className="w-7 h-7 rotate-45 border-2 border-red-500 bg-red-500/10 animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              </div>
            )}

            {/* Acquiring Radial Ring Gauge */}
            {!isLocked && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (lockProgress * 200)}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
            )}

            {/* Lead Aim Predictor Pip (where to shoot taking into account enemy motion!) */}
            {isLocked && (
              <div
                className="absolute flex items-center justify-center transition-all duration-100"
                style={{
                  transform: `translate(${leadOffset.x}px, ${leadOffset.y}px)`,
                }}
              >
                <div className="w-6 h-6 rounded-full border border-amber-400 border-dashed animate-spin flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <span className="absolute -top-3.5 whitespace-nowrap text-[8px] font-black tracking-widest text-amber-300 bg-slate-950/80 px-1 rounded border border-amber-500/40">
                  LEAD AIM
                </span>
              </div>
            )}

            {/* Target Distance & Designation Tag */}
            <div className="absolute left-24 -top-2 flex flex-col items-start gap-0.5 whitespace-nowrap bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-md border border-cyan-500/40 shadow-lg text-[10px]">
              <div className="flex items-center gap-1.5 font-black">
                <span className={primaryTarget.type === EnemyType.ELITE ? 'text-fuchsia-300' : 'text-cyan-300'}>
                  {primaryTarget.type === EnemyType.ELITE ? 'ELITE STRIKER' : 'RAIDER DRONE'}
                </span>
                <span
                  className={`px-1 py-0.2 rounded text-[8px] font-extrabold ${
                    isLocked ? 'bg-red-500 text-white animate-pulse' : 'bg-cyan-900/60 text-cyan-300'
                  }`}
                >
                  {isLocked ? 'LOCKED' : `${lockPercent}%`}
                </span>
              </div>

              {/* Real-time Distance Readout */}
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-400">RANGE:</span>
                <span className="font-bold text-amber-300">{primaryTarget.distanceMeters} M</span>
                <span className="text-slate-500">|</span>
                <span className="text-xs text-red-400 flex items-center">
                  <ChevronsDown size={12} /> {Math.abs(primaryTarget.relativeVelocity)} M/S
                </span>
              </div>

              {/* Firing solution readiness */}
              {isLocked && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 pt-0.5 border-t border-slate-800 w-full">
                  <Zap size={10} className="text-amber-400" />
                  <span>FIRE SOLUTION OPTIMAL</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DEDICATED TACTICAL TARGET TELEMETRY MFD PANEL (Docked Right Edge) */}
      <div className="absolute right-4 top-24 pointer-events-auto flex flex-col gap-2 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] min-w-[210px] text-xs">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 text-[10px]">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-300">
            <Target size={13} className="text-cyan-400" /> TARGET TELEMETRY
          </span>
          <span
            className={`font-black px-1.5 py-0.5 rounded text-[9px] ${
              isLocked
                ? 'bg-red-500/30 border border-red-500 text-red-300 animate-pulse'
                : primaryTarget
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                : 'text-slate-500'
            }`}
          >
            {lockState}
          </span>
        </div>

        {primaryTarget ? (
          <div className="flex flex-col gap-2 mt-0.5">
            {/* Target Class & Threat */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-white">
                {primaryTarget.type === EnemyType.ELITE ? 'TITAN INTERCEPTOR' : 'SWARM SCOUT'}
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  primaryTarget.isDiving
                    ? 'bg-red-950 text-red-400 border border-red-500/50'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {primaryTarget.isDiving ? 'DIVING ATTACK' : 'CRUISING'}
              </span>
            </div>

            {/* Real-time Distance Meter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">TARGET RANGE:</span>
                <span className="font-black text-amber-300 text-xs">
                  {primaryTarget.distanceMeters} METERS
                </span>
              </div>
              {/* Distance Range Meter Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-700/60 relative">
                <div
                  className={`h-full transition-all duration-100 ${
                    primaryTarget.distanceMeters < 250
                      ? 'bg-red-500'
                      : primaryTarget.distanceMeters < 500
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{
                    width: `${Math.max(5, Math.min(100, (primaryTarget.distanceMeters / 900) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>0M</span>
                <span>300M (CLOSE)</span>
                <span>900M</span>
              </div>
            </div>

            {/* Relative Closing Velocity */}
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">CLOSING SPEED:</span>
              <span className="font-bold text-rose-300 flex items-center gap-1">
                <Activity size={10} className="text-rose-400" />
                {primaryTarget.relativeVelocity} M/S
              </span>
            </div>

            {/* Target Lock Progress Bar */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">FIRE SOLUTION:</span>
                <span
                  className={`font-bold ${
                    isLocked ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
                  }`}
                >
                  {isLocked ? 'LOCK ACQUIRED' : `${lockPercent}% ENGAGED`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-cyan-500/20">
                <div
                  className={`h-full transition-all duration-75 ${
                    isLocked
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${lockPercent}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center text-center text-slate-500 gap-1.5">
            <Target size={20} className="text-slate-600 animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase">RADAR SWEEP ACTIVE</span>
            <span className="text-[8px] text-slate-600">Align nose with hostile craft</span>
          </div>
        )}
      </div>
    </div>
  );
};
