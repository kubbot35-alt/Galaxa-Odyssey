import React, { useMemo } from 'react';
import { ProjectedTarget } from './SpaceCombat3DScene';
import { EnemyType } from '../../types/game';
import { Radar, AlertTriangle, Crosshair, ShieldAlert } from 'lucide-react';

interface SpaceCombatRadarProps {
  targets: ProjectedTarget[];
  primaryTarget: ProjectedTarget | null;
  wave: number;
}

export const SpaceCombatRadar: React.FC<SpaceCombatRadarProps> = ({
  targets,
  primaryTarget,
  wave,
}) => {
  const radarSize = 160;
  const radius = radarSize / 2;
  const padding = 12;
  const effectiveRadius = radius - padding;

  // Count diving threats
  const divingCount = useMemo(() => targets.filter((t) => t.isDiving).length, [targets]);

  return (
    <div className="relative flex flex-col gap-1 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)] font-mono text-cyan-300 pointer-events-auto select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
          <Radar size={13} className="text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>3D TACTICAL SCANNER</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">WAVE {wave}:</span>
          <span className={`font-bold ${targets.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {targets.length} H
          </span>
        </div>
      </div>

      {/* Radar Circular Display */}
      <div className="relative mx-auto my-0.5" style={{ width: radarSize, height: radarSize }}>
        <svg
          width={radarSize}
          height={radarSize}
          viewBox={`0 0 ${radarSize} ${radarSize}`}
          className="overflow-visible"
        >
          {/* Radar Background Glow & Grid Rings */}
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Ring & Fill */}
          <circle
            cx={radius}
            cy={radius}
            r={effectiveRadius}
            fill="url(#radarGlow)"
            stroke="#0891b2"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.85"
          />

          {/* Mid Range Ring (500m) */}
          <circle
            cx={radius}
            cy={radius}
            r={effectiveRadius * 0.65}
            fill="none"
            stroke="#0e7490"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.7"
          />

          {/* Close Combat / Danger Perimeter Ring (250m) */}
          <circle
            cx={radius}
            cy={radius}
            r={effectiveRadius * 0.32}
            fill="none"
            stroke={divingCount > 0 ? '#ef4444' : '#0891b2'}
            strokeWidth="1"
            opacity="0.6"
            className={divingCount > 0 ? 'animate-pulse' : ''}
          />

          {/* Crosshairs & Sensor Field of View Cone */}
          <line
            x1={radius}
            y1={padding}
            x2={radius}
            y2={radarSize - padding}
            stroke="#0891b2"
            strokeWidth="0.8"
            opacity="0.35"
          />
          <line
            x1={padding}
            y1={radius}
            x2={radarSize - padding}
            y2={radius}
            stroke="#0891b2"
            strokeWidth="0.8"
            opacity="0.35"
          />

          {/* Forward Sensor Angle Cone (Lock-on corridor) */}
          <path
            d={`M ${radius} ${radius} L ${radius - effectiveRadius * 0.58} ${padding} A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${radius + effectiveRadius * 0.58} ${padding} Z`}
            fill="#06b6d4"
            fillOpacity="0.08"
            stroke="#06b6d4"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.5"
          />

          {/* Bearing Tick Labels */}
          <text x={radius} y={padding - 2} textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
            000° FORE
          </text>
          <text x={radarSize - 2} y={radius + 3} textAnchor="end" fill="#64748b" fontSize="7">
            STBD
          </text>
          <text x={2} y={radius + 3} textAnchor="start" fill="#64748b" fontSize="7">
            PORT
          </text>

          {/* Rotating Radar Sweep Line */}
          <g className="origin-center animate-spin" style={{ animationDuration: '3.2s' }}>
            <line
              x1={radius}
              y1={radius}
              x2={radius}
              y2={padding}
              stroke="#22d3ee"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Sweep sector fan */}
            <path
              d={`M ${radius} ${radius} L ${radius - 22} ${padding + 8} A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${radius} ${padding} Z`}
              fill="url(#sweepGradient)"
            />
          </g>

          {/* Player Ship Marker at Center Origin */}
          <polygon
            points={`${radius},${radius - 7} ${radius - 5},${radius + 5} ${radius},${radius + 2} ${radius + 5},${radius + 5}`}
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1"
            className="filter drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]"
          />

          {/* Render Incoming Enemy Wave Blips in 3D Space */}
          {targets.map((tgt) => {
            // Map normalized radar coords:
            // radarX: -1 to 1 (left to right)
            // radarZ: 0 (near player) to 1 (far downrange ahead)
            // On radar display: player is at (radius, radius + 15), targets are ahead (y decreases toward padding)
            const playerCenterY = radius + 10;
            const px = radius + tgt.radarX * (effectiveRadius * 0.85);
            // Invert Z so forward enemies are rendered upward on the radar
            const py = playerCenterY - tgt.radarZ * (effectiveRadius * 1.55);

            const isPrimary = primaryTarget?.id === tgt.id;
            const isElite = tgt.type === EnemyType.ELITE;
            const isDiving = tgt.isDiving;

            // Clamped coordinates to radar boundary
            const clampedX = Math.max(padding + 2, Math.min(radarSize - padding - 2, px));
            const clampedY = Math.max(padding + 2, Math.min(radarSize - padding - 2, py));

            return (
              <g key={tgt.id}>
                {/* 3D Depth Stem / Altitude drop line */}
                <line
                  x1={clampedX}
                  y1={clampedY}
                  x2={clampedX}
                  y2={clampedY + (isDiving ? 7 : 4)}
                  stroke={isDiving ? '#ef4444' : isElite ? '#c084fc' : '#f59e0b'}
                  strokeWidth="0.8"
                  opacity="0.45"
                  strokeDasharray="1 1"
                />

                {/* Primary Lock Bracket on Radar */}
                {isPrimary && (
                  <circle
                    cx={clampedX}
                    cy={clampedY}
                    r="6.5"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    className="animate-spin"
                    style={{ animationDuration: '2s' }}
                  />
                )}

                {/* Threat Indicator Blip */}
                {isDiving ? (
                  // Fast Diving Threat - Red flashing inverted triangle
                  <polygon
                    points={`${clampedX},${clampedY + 4} ${clampedX - 3.5},${clampedY - 3} ${clampedX + 3.5},${clampedY - 3}`}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    className="animate-pulse"
                  />
                ) : isElite ? (
                  // Elite Craft - Magenta diamond
                  <polygon
                    points={`${clampedX},${clampedY - 4} ${clampedX + 4},${clampedY} ${clampedX},${clampedY + 4} ${clampedX - 4},${clampedY}`}
                    fill="#c084fc"
                    stroke="#f43f5e"
                    strokeWidth="0.8"
                  />
                ) : (
                  // Standard Raider - Amber round blip
                  <circle
                    cx={clampedX}
                    cy={clampedY}
                    r="3"
                    fill="#f59e0b"
                    stroke="#fde68a"
                    strokeWidth="0.8"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Radar Telemetry Footer */}
      <div className="flex items-center justify-between text-[9px] pt-1 border-t border-cyan-500/20 text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">RANGE:</span>
          <span className="text-cyan-300 font-bold">850 M</span>
        </div>
        <div className="flex items-center gap-1">
          {divingCount > 0 ? (
            <span className="flex items-center gap-1 text-red-400 font-black animate-pulse">
              <ShieldAlert size={10} /> {divingCount} DIVING!
            </span>
          ) : (
            <span className="text-emerald-400 font-bold">PERIMETER CLEAR</span>
          )}
        </div>
      </div>
    </div>
  );
};
