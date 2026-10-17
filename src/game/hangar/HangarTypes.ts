import type * as THREE from 'three';

export interface HangarDimensions {
  readonly radius: number;
  readonly height: number;
  readonly runwayLength: number;
}

export const HANGAR_DIMENSIONS: HangarDimensions = {
  radius: 30,
  height: 16,
  runwayLength: 52,
};

export interface SparkVelocity {
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
}

export interface SparkSystem {
  points: THREE.Points;
  positions: Float32Array;
  velocities: SparkVelocity[];
}

export interface DeckOfficerRig {
  group: THREE.Group;
  head: THREE.Mesh;
  seed: number;
}

export interface DeckTechRig {
  group: THREE.Group;
  arm: THREE.Mesh;
  seed: number;
}

export interface ServiceDroneRig {
  group: THREE.Group;
  ring: THREE.Mesh;
  basePos: THREE.Vector3;
  orbitRadius: number;
  speed: number;
  seed: number;
}

/** Scene parts that are driven at runtime; populated while the scene is built. */
export interface HangarAnimationTargets {
  forceField: THREE.Mesh | null;
  beaconLights: THREE.Mesh[];
  astromechHead: THREE.Group | null;
  holoPlanet: THREE.Group | null;
  deckCrewOfficers: DeckOfficerRig[];
  deckCrewTechs: DeckTechRig[];
  serviceDrones: ServiceDroneRig[];
  sparks: SparkSystem | null;
  dust: THREE.Points | null;
}

export function createAnimationTargets(): HangarAnimationTargets {
  return {
    forceField: null,
    beaconLights: [],
    astromechHead: null,
    holoPlanet: null,
    deckCrewOfficers: [],
    deckCrewTechs: [],
    serviceDrones: [],
    sparks: null,
    dust: null,
  };
}

/** Result of building the static hangar scene. */
export interface HangarScene {
  mesh: THREE.Group;
  landingPad: THREE.Group;
  targets: HangarAnimationTargets;
}
