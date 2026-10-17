import * as THREE from 'three';
import { EnemyType, PowerUpType } from '../../types/game';

export type EnemyVisualFactory = () => THREE.Group;
type PowerUpColor = number;

export class CombatEntityFactory {
  private readonly enemyFactories: Partial<Record<EnemyType, EnemyVisualFactory>> = {
    [EnemyType.ELITE]: () => this.createEnemyModel(true),
  };

  private readonly powerUpColors: Partial<Record<PowerUpType, PowerUpColor>> = {
    [PowerUpType.TOKEN_TRIPLE_SHOT]: 0xfbbf24,
    [PowerUpType.TOKEN_LASER_BEAM]: 0xff37a6,
    [PowerUpType.TOKEN_PLASMA_SPREAD]: 0xc084fc,
    [PowerUpType.EXTRA_LIFE]: 0x4ade80,
  };

  public registerEnemyFactory(type: EnemyType, factory: EnemyVisualFactory): void {
    this.enemyFactories[type] = factory;
  }

  public registerPowerUpColor(type: PowerUpType, color: PowerUpColor): void {
    this.powerUpColors[type] = color;
  }

  public createEnemy(type: EnemyType): THREE.Group {
    return (this.enemyFactories[type] ?? (() => this.createEnemyModel(false)))();
  }

  public createBullet(colorHex: number, isPlayer: boolean): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, isPlayer ? 1.4 : 1.0, 8);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.rotation.x = Math.PI / 2;
    return bullet;
  }

  public createBomb(): THREE.Group {
    const group = new THREE.Group();
    const coreGeometry = new THREE.SphereGeometry(0.55, 12, 12);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    group.add(new THREE.Mesh(coreGeometry, coreMaterial));

    const spikeGeometry = new THREE.ConeGeometry(0.12, 0.6, 6);
    const spikeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0);
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }
    return group;
  }

  public createPowerUp(type: PowerUpType): THREE.Group {
    const color = this.powerUpColors[type] ?? 0x38bdf8;

    const group = new THREE.Group();
    const tokenGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 6);
    const tokenMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.75,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const token = new THREE.Mesh(tokenGeometry, tokenMaterial);
    token.rotation.x = Math.PI / 2;
    group.add(token);

    const ringGeometry = new THREE.TorusGeometry(0.9, 0.05, 8, 24);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(ringGeometry, ringMaterial));
    return group;
  }

  private createEnemyModel(isElite: boolean): THREE.Group {
    const group = new THREE.Group();
    const baseColor = isElite ? 0x9333ea : 0xef4444;
    const accentColor = isElite ? 0xf43f5e : 0xf59e0b;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.85,
      roughness: 0.25,
      emissive: accentColor,
      emissiveIntensity: 0.35,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.9,
    });

    if (isElite) {
      const main = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.8), bodyMaterial);
      group.add(main);

      const bladeGeometry = new THREE.ConeGeometry(0.5, 1.4, 4);
      const leftBlade = new THREE.Mesh(bladeGeometry, bodyMaterial);
      leftBlade.rotation.x = -Math.PI / 2;
      leftBlade.position.set(0.9, 0, -0.6);
      group.add(leftBlade);
      const rightBlade = leftBlade.clone();
      rightBlade.position.x = -0.9;
      group.add(rightBlade);

      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), glowMaterial);
      core.position.set(0, 0.35, 0);
      group.add(core);

      const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.8, 10), glowMaterial);
      turbine.rotation.x = Math.PI / 2;
      turbine.position.set(0.5, 0, 1);
      group.add(turbine);
      const secondTurbine = turbine.clone();
      secondTurbine.position.x = -0.5;
      group.add(secondTurbine);
    } else {
      const drone = new THREE.Mesh(new THREE.TetrahedronGeometry(1, 1), bodyMaterial);
      drone.rotation.x = Math.PI;
      drone.scale.set(1.2, 0.6, 1.4);
      group.add(drone);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.14), glowMaterial);
      eye.position.set(0, 0, -0.7);
      group.add(eye);
    }
    return group;
  }
}
