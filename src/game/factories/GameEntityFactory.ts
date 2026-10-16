import * as THREE from 'three';
import { Hangar3D } from '../hangar/Hangar3D';
import { CloneWarsHangar3D } from '../hangar/CloneWarsHangar3D';
import { Spaceship3D, SpaceshipOptions } from '../../components/3d/Spaceship3D';
import { ShipSkinId, SHIP_SKINS } from '../../components/3d/SpaceHangarScene';
import { WeaponMode } from '../../types/game';

/**
 * HangarFactory - SRP: Responsible exclusively for instantiating and configuring Hangar3D and CloneWarsHangar3D instances.
 */
export class HangarFactory {
  public static createHangar(): Hangar3D {
    return new Hangar3D();
  }

  public static createCloneWarsHangar(): CloneWarsHangar3D {
    return new CloneWarsHangar3D();
  }
}

/**
 * SpaceshipFactory - SRP: Responsible exclusively for instantiating Spaceship3D models with skins.
 */
export class SpaceshipFactory {
  public static createPlayerShip(skinId: ShipSkinId = 'titanium'): Spaceship3D {
    const config = SHIP_SKINS[skinId];
    const visualConfig: SpaceshipOptions = {
      hullColor: config?.hullColor ?? 0x1c1917,
      wingColor: config?.armorColor ?? 0x292524,
      cockpitColor: config?.cockpitColor ?? 0xd97706,
      flameColor: config?.engineGlow ?? 0xfbbf24,
    };
    return new Spaceship3D(visualConfig);
  }

  public static createWingmanShip(): Spaceship3D {
    const wingmanConfig: SpaceshipOptions = {
      hullColor: 0x2e1065,
      wingColor: 0x4c1d95,
      cockpitColor: 0xf43f5e,
      flameColor: 0xf43f5e,
      isPlayer2: true,
    };
    return new Spaceship3D(wingmanConfig);
  }
}

/**
 * ProjectileFactory - SRP: Responsible exclusively for creating 3D weapon meshes.
 */
export class ProjectileFactory {
  public static createLaserBolt(color: number = 0x38bdf8, isPlayer: boolean = true): THREE.Mesh {
    const geom = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8);
    geom.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isPlayer ? 0.95 : 0.85,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Mesh(geom, mat);
  }

  public static createPlasmaOrb(color: number = 0xf59e0b): THREE.Mesh {
    const geom = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Mesh(geom, mat);
  }
}

/**
 * CombatObstacleFactory - SRP: Responsible exclusively for creating celestial obstacles & space debris.
 */
export class CombatObstacleFactory {
  public static createAsteroidMesh(size: number = 2.0): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(size, 1);
    // Procedurally perturb vertices to create jagged asteroid surface
    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const factor = 1.0 + (Math.sin(vx * 3) + Math.cos(vy * 3) + Math.sin(vz * 3)) * 0.12;
      posAttr.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });

    return new THREE.Mesh(geom, mat);
  }
}
