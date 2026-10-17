import type * as THREE from 'three';
import type { IHangarSceneEntity } from '../contracts/IHangarSceneEntity';
import { HangarAnimator } from './HangarAnimator';
import { HangarResourceTracker } from './HangarResourceTracker';
import { HangarSceneBuilder } from './HangarSceneBuilder';
import { HANGAR_DIMENSIONS } from './HangarTypes';

/** Facade for the hangar scene: composes the scene builder, animator and resource tracker. */
export class CloneWarsHangar3D implements IHangarSceneEntity {
  public mesh: THREE.Group;
  public landingPad: THREE.Group;

  // Dimensional specs
  public readonly radius = HANGAR_DIMENSIONS.radius;
  public readonly height = HANGAR_DIMENSIONS.height;
  public readonly runwayLength = HANGAR_DIMENSIONS.runwayLength;

  private readonly resources = new HangarResourceTracker();
  private readonly animator: HangarAnimator;
  private disposed = false;

  constructor() {
    const scene = new HangarSceneBuilder(this.resources, HANGAR_DIMENSIONS).build();
    this.mesh = scene.mesh;
    this.landingPad = scene.landingPad;
    this.animator = new HangarAnimator(scene.landingPad, scene.targets, HANGAR_DIMENSIONS);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getLandingPad(): THREE.Group {
    return this.landingPad;
  }

  public getExitGateZ(): number {
    return this.runwayLength / 2 - 1.0;
  }

  public setGateOpen(isOpen: boolean): void {
    this.animator.setGateOpen(isOpen);
  }

  public isGateCleared(): boolean {
    return this.animator.isGateCleared();
  }

  public alignPadToForward(deltaTime: number, speed: number = 4.0): boolean {
    return this.animator.alignPadToForward(deltaTime, speed);
  }

  public resetPadRotation(): void {
    this.animator.resetPadRotation();
  }

  public update(deltaTime: number, rotatePad: boolean = true): void {
    if (this.disposed) {
      return;
    }
    this.animator.update(deltaTime, rotatePad);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    this.mesh.clear();
    this.landingPad.clear();
    this.resources.disposeAll();
  }
}
