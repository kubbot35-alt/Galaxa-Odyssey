import * as THREE from 'three';
import { EnemyType } from '../../types/game';
import { GAME_HEIGHT, GAME_WIDTH } from '../../game/constants';
import type { CombatSceneSource, ProjectedTarget } from './combatSceneTypes';

export class CombatTargetProjector {
  public project(
    source: CombatSceneSource,
    camera: THREE.Camera,
    playerPosition: THREE.Vector3,
    viewport: { width: number; height: number },
  ): { targets: ProjectedTarget[]; primaryTarget: ProjectedTarget | null } {
    if (source.enemies.length === 0) {
      return { targets: [], primaryTarget: null };
    }

    const playerX = Number.isFinite(source.player1.x) ? source.player1.x : GAME_WIDTH / 2;
    const playerWidth = Number.isFinite(source.player1.width) ? source.player1.width : 40;
    const playerY = Number.isFinite(source.player1.y) ? source.player1.y : 530;
    const fallbackPlayerPosition = this.map2Dto3D(playerX + playerWidth / 2, playerY);
    const safePlayerPosition =
      Number.isFinite(playerPosition.x) && Number.isFinite(playerPosition.z)
        ? playerPosition
        : fallbackPlayerPosition;
    const canvasWidth = viewport.width || 1000;
    const canvasHeight = viewport.height || 640;

    const targets: ProjectedTarget[] = [];
    let bestScore = Infinity;
    let primaryTarget: ProjectedTarget | null = null;

    for (let index = 0; index < source.enemies.length; index++) {
      const enemy = source.enemies[index];
      if (!enemy) continue;

      const enemyX = Number.isFinite(enemy.x) ? enemy.x : (enemy.startX ?? GAME_WIDTH / 2);
      const enemyY = Number.isFinite(enemy.y) ? enemy.y : (enemy.startY ?? 100);
      const position = this.map2Dto3D(enemyX + 16, enemyY + 16);
      const dx = position.x - safePlayerPosition.x;
      const dz = position.z - safePlayerPosition.z;
      const safeDx = Number.isFinite(dx) ? dx : 0;
      const safeDz = Number.isFinite(dz) ? dz : 0;
      const distanceUnits = Math.hypot(safeDx, safeDz);
      const distanceMeters = Math.round(distanceUnits * 32 + 120);
      const relativeVelocity = enemy.diving ? -145 : -38;

      position.y = 0.3;
      position.project(camera);

      const inFront = Number.isFinite(position.z) && position.z < 1;
      const safeX = Number.isFinite(position.x) ? position.x : 0;
      const safeY = Number.isFinite(position.y) ? position.y : 0;
      const screenX = ((safeX + 1) / 2) * canvasWidth;
      const screenY = ((-safeY + 1) / 2) * canvasHeight;
      const screenPercentX = ((safeX + 1) / 2) * 100;
      const screenPercentY = ((-safeY + 1) / 2) * 100;
      const inView = inFront && safeX >= -1.15 && safeX <= 1.15 && safeY >= -1.15 && safeY <= 1.15;
      const radarX = THREE.MathUtils.clamp(safeDx / 12, -1, 1);
      const radarZ = THREE.MathUtils.clamp(safeDz / 26, 0, 1);
      const safeEnemyStartX = Number.isFinite(enemy.startX) ? Math.round(enemy.startX) : index;

      const projected: ProjectedTarget = {
        id: `tgt-${enemy.type}-${safeEnemyStartX}-${index}`,
        type: enemy.type,
        screenX,
        screenY,
        screenPercentX,
        screenPercentY,
        inView,
        distanceUnits,
        distanceMeters,
        relativeVelocity,
        radarX: Number.isFinite(radarX) ? radarX : 0,
        radarZ: Number.isFinite(radarZ) ? radarZ : 0.5,
        hp: Number.isFinite(enemy.hp) ? enemy.hp : 1,
        maxHp: Number.isFinite(enemy.maxHp) ? enemy.maxHp : 1,
        isDiving: Boolean(enemy.diving),
        enemyX: enemy.x,
        enemyStartX: enemy.startX,
      };

      targets.push(projected);
      let score = Math.abs(safeDx) * 2.2 + distanceUnits * 0.8;
      if (enemy.diving) score -= 8;
      if (enemy.type === EnemyType.ELITE) score -= 3;

      if (score < bestScore) {
        bestScore = score;
        primaryTarget = projected;
      }
    }

    return { targets, primaryTarget };
  }

  private map2Dto3D(x: number, y: number): THREE.Vector3 {
    const validX = Number.isFinite(x) ? x : GAME_WIDTH / 2;
    const validY = Number.isFinite(y) ? y : GAME_HEIGHT / 2;
    const threeX = ((validX - GAME_WIDTH / 2) / (GAME_WIDTH / 2)) * 12;
    const threeZ = 24 - (validY / GAME_HEIGHT) * 26;
    return new THREE.Vector3(threeX, 0, threeZ);
  }
}
