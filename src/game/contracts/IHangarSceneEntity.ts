import type * as THREE from 'three';

/** Runtime contract shared by the hangar presentation and launch sequence. */
export interface IHangarSceneEntity {
  getMesh(): THREE.Group;
  getLandingPad(): THREE.Group;
  setGateOpen(isOpen: boolean): void;
  isGateCleared(): boolean;
  alignPadToForward(deltaTime: number, speed?: number): boolean;
  resetPadRotation(): void;
  update(deltaTime: number, rotatePad?: boolean): void;
  dispose(): void;
}
