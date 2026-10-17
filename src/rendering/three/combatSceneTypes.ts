import type { Bomb, Bullet, Enemy, PlayerState, PowerUp } from '../../game/entities/GameEntities';
import type { EnemyType } from '../../types/game';
import type { ShipSkinId } from '../../config/visuals/hangarVisuals';

export type CameraViewMode = 'CHASE_3D' | 'TACTICAL_3D' | 'COCKPIT_3D';

export interface CombatSceneSource {
  wave: number;
  twoPlayerMode: boolean;
  player1: PlayerState;
  player2: PlayerState | null;
  enemies: readonly Enemy[];
  bullets: readonly Bullet[];
  bombs: readonly Bomb[];
  powerUps: readonly PowerUp[];
}

export interface ProjectedTarget {
  id: string;
  type: EnemyType;
  screenX: number;
  screenY: number;
  screenPercentX: number;
  screenPercentY: number;
  inView: boolean;
  distanceUnits: number;
  distanceMeters: number;
  relativeVelocity: number;
  radarX: number;
  radarZ: number;
  hp: number;
  maxHp: number;
  isDiving: boolean;
  enemyX: number;
  enemyStartX: number;
}

export interface TargetLockAudio {
  playTargetAcquiringBeep(): void;
  playTargetLockedAlert(): void;
}

export interface CameraViewStrategy {
  getCameraPosition(x: number, z: number): readonly [number, number, number];
  getLookAt(x: number, z: number): readonly [number, number, number];
}

export const COMBAT_SKIN_PALETTES: Record<
  ShipSkinId,
  { hull: number; armor: number; trim: number; cockpit: number }
> = {
  stealth: { hull: 0x050508, armor: 0x0f0f15, trim: 0x818cf8, cockpit: 0x4f46e5 },
  titanium: { hull: 0x1e293b, armor: 0x334155, trim: 0x38bdf8, cockpit: 0x0284c7 },
  cyberpunk: { hull: 0x18181b, armor: 0x27272a, trim: 0xf43f5e, cockpit: 0xf59e0b },
  hyperion: { hull: 0xf8fafc, armor: 0xe2e8f0, trim: 0xeab308, cockpit: 0x06b6d4 },
};

export const CAMERA_VIEW_STRATEGIES: Record<CameraViewMode, CameraViewStrategy> = {
  CHASE_3D: {
    getCameraPosition: (x, z) => [x * 0.55, 3.8, z - 7.5],
    getLookAt: (x, z) => [x * 0.45, 0.6, z + 18],
  },
  COCKPIT_3D: {
    getCameraPosition: (x, z) => [x, 1.25, z - 1.8],
    getLookAt: (x, z) => [x, 0.8, z + 24],
  },
  TACTICAL_3D: {
    getCameraPosition: (x, z) => [x * 0.2, 14.5, z - 8],
    getLookAt: (x) => [x * 0.1, 0, 10],
  },
};
