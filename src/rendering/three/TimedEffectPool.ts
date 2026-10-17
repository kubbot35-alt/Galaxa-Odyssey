import type * as THREE from 'three';

export interface TimedEffect {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

/** Short-lived mesh effects: ages them, lets the caller animate, and frees the mesh on expiry. */
export class TimedEffectPool<T extends TimedEffect> {
  private items: T[] = [];

  constructor(private readonly parent: THREE.Object3D) {}

  public get size(): number {
    return this.items.length;
  }

  public add(effect: T): void {
    this.items.push(effect);
  }

  public update(delta: number, animate: (effect: T) => void): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const effect = this.items[i];
      effect.life -= delta;
      animate(effect);
      if (effect.life <= 0) {
        this.release(effect);
        this.items.splice(i, 1);
      }
    }
  }

  public clear(): void {
    this.items.forEach((e) => this.release(e));
    this.items = [];
  }

  private release(effect: T): void {
    this.parent.remove(effect.mesh);
    effect.mesh.geometry?.dispose();
    (effect.mesh.material as THREE.Material | undefined)?.dispose();
  }
}
