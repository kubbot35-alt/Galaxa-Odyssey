import * as THREE from 'three';
import type { HangarAnimationTargets, HangarDimensions, SparkSystem } from './HangarTypes';

/** Drives runtime behavior of the hangar: gate state, landing pad rotation and ambient animations. */
export class HangarAnimator {
  private elapsedTime = 0;
  private isGateOpen = false;
  private gateProgress = 0;
  private nextSparkTime = 0.5;

  constructor(
    private readonly landingPad: THREE.Group,
    private readonly targets: HangarAnimationTargets,
    private readonly dimensions: HangarDimensions
  ) {}

  public setGateOpen(isOpen: boolean): void {
    this.isGateOpen = isOpen;
  }

  public isGateCleared(): boolean {
    return this.gateProgress >= 0.75;
  }

  public alignPadToForward(deltaTime: number, speed: number = 4.0): boolean {
    const currentRot = this.landingPad.rotation.y % (Math.PI * 2);
    const diff = Math.atan2(Math.sin(-currentRot), Math.cos(-currentRot));

    if (Math.abs(diff) < 0.02) {
      this.landingPad.rotation.y = 0;
      return true;
    }

    this.landingPad.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime);
    return false;
  }

  public resetPadRotation(): void {
    this.landingPad.rotation.y = 0;
  }

  public update(deltaTime: number, rotatePad: boolean): void {
    this.elapsedTime += deltaTime;
    this.updateGate(deltaTime);

    if (rotatePad) {
      this.landingPad.rotation.y += 0.22 * deltaTime;
    }

    this.updateBeaconLights();
    this.updateCrewAnimations(deltaTime);
    this.updateServiceDrones(deltaTime);
    this.updateWeldingSparks(deltaTime);
    this.updateDustMotes();
  }

  private updateGate(deltaTime: number): void {
    if (this.isGateOpen) {
      this.gateProgress = Math.min(1.0, this.gateProgress + deltaTime * 1.5);
    } else {
      this.gateProgress = Math.max(0.0, this.gateProgress - deltaTime * 1.5);
    }

    const forceField = this.targets.forceField;
    if (forceField && forceField.material) {
      const mat = forceField.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(this.elapsedTime * 2.0) * 0.02;
      mat.opacity = Math.max(0.01, (0.2 + pulse) * (1.0 - this.gateProgress));
      forceField.visible = this.gateProgress < 0.98;
    }
  }

  private updateBeaconLights(): void {
    const beaconGlow = 0.85 + Math.sin(this.elapsedTime * 1.5) * 0.1;
    for (const beacon of this.targets.beaconLights) {
      (beacon.material as THREE.MeshBasicMaterial).opacity = beaconGlow;
    }
  }

  private updateCrewAnimations(deltaTime: number): void {
    if (this.targets.astromechHead) {
      this.targets.astromechHead.rotation.y = Math.sin(this.elapsedTime * 1.2) * 0.8;
    }

    if (this.targets.holoPlanet) {
      this.targets.holoPlanet.rotation.y += 0.45 * deltaTime;
    }

    for (const off of this.targets.deckCrewOfficers) {
      const breath = 1.0 + Math.sin(this.elapsedTime * 1.5 + off.seed) * 0.015;
      off.group.scale.y = breath;
      off.head.rotation.y = Math.sin(this.elapsedTime * 0.6 + off.seed) * 0.35;
      off.head.rotation.x = Math.sin(this.elapsedTime * 0.9 + off.seed) * 0.06;
    }

    for (const tech of this.targets.deckCrewTechs) {
      const sway = Math.sin(this.elapsedTime * 1.2 + tech.seed) * 0.02;
      tech.group.rotation.z = sway;
      tech.arm.rotation.x = 0.6 + Math.sin(this.elapsedTime * 2.0 + tech.seed) * 0.22;
      tech.arm.rotation.z = Math.cos(this.elapsedTime * 1.5 + tech.seed) * 0.12;
    }
  }

  private updateServiceDrones(deltaTime: number): void {
    for (const drone of this.targets.serviceDrones) {
      const t = this.elapsedTime * drone.speed + drone.seed;
      const hoverY = drone.basePos.y + Math.sin(this.elapsedTime * 2.2 + drone.seed) * 0.14;
      const posX = drone.basePos.x + Math.sin(t) * drone.orbitRadius;
      const posZ = drone.basePos.z + Math.cos(t) * drone.orbitRadius;
      drone.group.position.set(posX, hoverY, posZ);

      drone.group.rotation.y = t + Math.PI / 2;
      drone.group.rotation.z = Math.sin(t) * 0.08;

      drone.ring.rotation.z += 2.4 * deltaTime;
    }
  }

  private updateWeldingSparks(deltaTime: number): void {
    const sparks = this.targets.sparks;
    if (!sparks) {
      return;
    }

    this.nextSparkTime -= deltaTime;
    if (this.nextSparkTime <= 0) {
      this.triggerWeldingSparks(sparks);
      this.nextSparkTime = 0.8 + Math.random() * 1.4;
    }

    const { points, positions, velocities } = sparks;
    const gravity = 9.8;
    for (let i = 0; i < velocities.length; i++) {
      const vel = velocities[i];
      if (vel.life > 0) {
        vel.life -= deltaTime;
        vel.y -= gravity * deltaTime;

        positions[i * 3] += vel.x * deltaTime;
        positions[i * 3 + 1] += vel.y * deltaTime;
        positions[i * 3 + 2] += vel.z * deltaTime;

        // Floor bounce
        if (positions[i * 3 + 1] < 0.05) {
          positions[i * 3 + 1] = 0.05;
          vel.y = -vel.y * 0.35;
          vel.x *= 0.6;
          vel.z *= 0.6;
        }
      } else {
        positions[i * 3 + 1] = -100; // Hide below floor
      }
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  private triggerWeldingSparks(sparks: SparkSystem): void {
    const { positions, velocities } = sparks;

    // High maintenance catwalk weld origins
    const weldOrigins = [
      new THREE.Vector3(-12.5, 11.2, -7.5),
      new THREE.Vector3(13.2, 10.8, 6.2),
      new THREE.Vector3(0, this.dimensions.height - 3.2, 3.8),
    ];
    const origin = weldOrigins[Math.floor(Math.random() * weldOrigins.length)];

    const burstSize = 18 + Math.floor(Math.random() * 12);
    let activated = 0;

    for (let i = 0; i < velocities.length && activated < burstSize; i++) {
      if (velocities[i].life <= 0) {
        positions[i * 3] = origin.x + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

        velocities[i] = {
          x: (Math.random() - 0.5) * 4.5,
          y: -1.0 - Math.random() * 3.5,
          z: (Math.random() - 0.5) * 4.5,
          life: 0.7 + Math.random() * 0.8,
          maxLife: 1.2,
        };
        activated++;
      }
    }
  }

  private updateDustMotes(): void {
    const dust = this.targets.dust;
    if (!dust) {
      return;
    }

    const ceiling = this.dimensions.height - 3.5;
    const posAttr = dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let d = 0; d < posAttr.count; d++) {
      let y = posAttr.getY(d) + Math.sin(this.elapsedTime + d) * 0.008;
      if (y < 0.2) y = ceiling;
      if (y > ceiling) y = 0.2;
      posAttr.setY(d, y);
    }
    posAttr.needsUpdate = true;
  }
}
