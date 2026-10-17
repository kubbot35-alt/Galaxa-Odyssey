import * as THREE from 'three';
import type { HangarMaterials } from './HangarMaterials';
import type { HangarResourceTracker } from './HangarResourceTracker';
import { HangarPropGroup } from './HangarPropGroup';
import type { HangarAnimationTargets, HangarDimensions, SparkSystem, SparkVelocity } from './HangarTypes';

/** Creates a cohesive group of hangar props using the shared resource tracker and animation targets. */
export class HangarEffectProps extends HangarPropGroup {
  constructor(
    tracker: HangarResourceTracker,
    materials: HangarMaterials,
    targets: HangarAnimationTargets,
    private readonly dimensions: HangarDimensions
  ) {
    super(tracker, materials, targets);
  }

  public createServiceDrone(pos: THREE.Vector3, orbitRadius: number, speed: number): THREE.Group {
    const drone = new THREE.Group();
    drone.position.copy(pos);

    // Central chassis orb
    const bodyGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.35, 16, 16));
    const body = new THREE.Mesh(bodyGeo, this.materials.archSteel);
    drone.add(body);

    // Rotating outer diagnostic scanner ring
    const ringGeo = this.tracker.trackGeometry(new THREE.TorusGeometry(0.55, 0.05, 8, 24));
    const ring = new THREE.Mesh(ringGeo, this.materials.cyanGlow);
    drone.add(ring);

    // Top sensor antenna
    const antGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6));
    const ant = new THREE.Mesh(antGeo, this.materials.archSteel);
    ant.position.y = 0.45;
    drone.add(ant);

    // Blinking eye
    const eye = new THREE.Mesh(this.tracker.trackGeometry(new THREE.SphereGeometry(0.08, 8, 8)), this.materials.cyanGlow);
    eye.position.set(0, 0, 0.32);
    drone.add(eye);
    this.targets.beaconLights.push(eye);

    // Soft downward scanner cone
    const scanGeo = this.tracker.trackGeometry(new THREE.ConeGeometry(0.5, 1.8, 12, 1, true));
    scanGeo.translate(0, -0.9, 0);
    const scanMat = this.tracker.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const scanCone = new THREE.Mesh(scanGeo, scanMat);
    drone.add(scanCone);

    this.targets.serviceDrones.push({
      group: drone,
      ring,
      basePos: pos.clone(),
      orbitRadius,
      speed,
      seed: Math.random() * 100,
    });

    return drone;
  }

  public createSparkSystem(): SparkSystem {
    const sparkCount = 120;
    const sparkGeo = this.tracker.trackGeometry(new THREE.BufferGeometry());
    const positions = new Float32Array(sparkCount * 3);
    const sparkColors = new Float32Array(sparkCount * 3);
    const velocities: SparkVelocity[] = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // Inactive below deck
      positions[i * 3 + 2] = 0;

      sparkColors[i * 3] = 1.0;
      sparkColors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      sparkColors[i * 3 + 2] = 0.3;

      velocities.push({ x: 0, y: 0, z: 0, life: 0, maxLife: 0 });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMat = this.tracker.trackMaterial(
      new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    return { points: new THREE.Points(sparkGeo, sparkMat), positions, velocities };
  }

  public createDustMotes(): THREE.Points {
    const dustCount = 350;
    const { radius, height } = this.dimensions;
    const dustGeo = this.tracker.trackGeometry(new THREE.BufferGeometry());
    const dustPos = new Float32Array(dustCount * 3);

    for (let d = 0; d < dustCount; d++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.85);
      dustPos[d * 3] = Math.sin(angle) * dist;
      dustPos[d * 3 + 1] = 0.5 + Math.random() * (height - 3.5);
      dustPos[d * 3 + 2] = Math.cos(angle) * dist;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = this.tracker.trackMaterial(
      new THREE.PointsMaterial({
        size: 0.12,
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    return new THREE.Points(dustGeo, dustMat);
  }

  public createExitForceField(): THREE.Mesh {
    const gateGeo = this.tracker.trackGeometry(new THREE.PlaneGeometry(24, 13));
    const gateMat = this.tracker.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    const forceField = new THREE.Mesh(gateGeo, gateMat);
    forceField.position.set(0, 6.5, this.dimensions.runwayLength / 2 - 1.2);
    return forceField;
  }
}
