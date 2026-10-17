import * as THREE from 'three';
import type { HangarMaterials } from './HangarMaterials';
import type { HangarResourceTracker } from './HangarResourceTracker';
import { HangarCrewProps } from './HangarCrewProps';
import { HangarEffectProps } from './HangarEffectProps';
import { HangarFacilityProps } from './HangarFacilityProps';
import { HangarVehicleProps } from './HangarVehicleProps';
import type { HangarAnimationTargets, HangarDimensions, SparkSystem } from './HangarTypes';

/** Creates the individual props populating the hangar; animated parts are registered in the shared targets. */
export class HangarPropFactory {
  private readonly vehicleProps: HangarVehicleProps;
  private readonly facilityProps: HangarFacilityProps;
  private readonly crewProps: HangarCrewProps;
  private readonly effectProps: HangarEffectProps;

  constructor(
    tracker: HangarResourceTracker,
    materials: HangarMaterials,
    targets: HangarAnimationTargets,
    dimensions: HangarDimensions
  ) {
    this.vehicleProps = new HangarVehicleProps(tracker, materials, targets);
    this.facilityProps = new HangarFacilityProps(tracker, materials, targets);
    this.crewProps = new HangarCrewProps(tracker, materials, targets);
    this.effectProps = new HangarEffectProps(tracker, materials, targets, dimensions);
  }

  public createGunship(): THREE.Group {
    return this.vehicleProps.createGunship();
  }

  public createAstromechDroid(): THREE.Group {
    return this.vehicleProps.createAstromechDroid();
  }

  public createHoloTable(): THREE.Group {
    return this.facilityProps.createHoloTable();
  }

  public createCurvedGantry(segments: number, radius: number): THREE.Group {
    return this.facilityProps.createCurvedGantry(segments, radius);
  }

  public createCargoCluster(pos: THREE.Vector3): THREE.Group {
    return this.facilityProps.createCargoCluster(pos);
  }

  public createCloakedOfficer(pos: THREE.Vector3): THREE.Group {
    return this.crewProps.createCloakedOfficer(pos);
  }

  public createDeckCrewTechnician(pos: THREE.Vector3): THREE.Group {
    return this.crewProps.createDeckCrewTechnician(pos);
  }

  public createServiceDrone(pos: THREE.Vector3, orbitRadius: number, speed: number): THREE.Group {
    return this.effectProps.createServiceDrone(pos, orbitRadius, speed);
  }

  public createSparkSystem(): SparkSystem {
    return this.effectProps.createSparkSystem();
  }

  public createDustMotes(): THREE.Points {
    return this.effectProps.createDustMotes();
  }

  public createExitForceField(): THREE.Mesh {
    return this.effectProps.createExitForceField();
  }
}
