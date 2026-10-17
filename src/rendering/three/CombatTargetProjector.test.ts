import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PlayerEntityService } from '../../game/entities/GameEntities';
import { EnemyType } from '../../types/game';
import type { CombatSceneSource } from './combatSceneTypes';
import { CombatTargetProjector } from './CombatTargetProjector';

const createFrame = (enemies: CombatSceneSource['enemies']): CombatSceneSource => ({
  wave: 1,
  twoPlayerMode: false,
  player1: PlayerEntityService.createPlayer(380, 1, false, false),
  player2: null,
  enemies,
  bullets: [],
  bombs: [],
  powerUps: [],
});

describe('CombatTargetProjector', () => {
  it('returns no primary target when there are no enemies', () => {
    const projector = new CombatTargetProjector();
    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 1000);

    expect(projector.project(createFrame([]), camera, new THREE.Vector3(), { width: 800, height: 600 }))
      .toEqual({ targets: [], primaryTarget: null });
  });

  it('projects enemy telemetry without exposing the game entity instance', () => {
    const projector = new CombatTargetProjector();
    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 1000);
    camera.position.set(0, 3.8, -8.2);
    camera.lookAt(0, 0.6, 14);
    const frame = createFrame([{
      x: 390,
      y: 100,
      startX: 380,
      startY: 100,
      angle: 0,
      type: EnemyType.STANDARD,
      diving: true,
      hp: 2,
      maxHp: 3,
    }]);

    const result = projector.project(frame, camera, new THREE.Vector3(), { width: 800, height: 600 });

    expect(result.targets).toHaveLength(1);
    expect(result.primaryTarget).toBe(result.targets[0]);
    expect(result.targets[0]).toMatchObject({
      enemyX: 390,
      enemyStartX: 380,
      isDiving: true,
      relativeVelocity: -145,
    });
    expect(result.targets[0]).not.toHaveProperty('enemyRef');
  });
});
