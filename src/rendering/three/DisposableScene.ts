import * as THREE from 'three';

/** Disposes geometry and material(s) of every mesh/points/line under `root`. */
export function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const renderable = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    renderable.geometry?.dispose();
    const material = renderable.material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material?.dispose();
    }
  });
}

/**
 * Lifecycle shared by full-screen WebGL scenes: render-loop handle, resize listener
 * and ordered, idempotent teardown. Subclasses only release what they own in `releaseResources`.
 */
export abstract class DisposableScene {
  protected abstract scene: THREE.Scene;
  protected abstract renderer: THREE.WebGLRenderer;
  protected abstract readonly onResize: () => void;

  protected animFrameId: number | null = null;
  private disposed = false;

  /** Subclass-specific cleanup that must run before the scene graph and renderer are disposed. */
  protected releaseResources(): void {}

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.onResize);

    this.releaseResources();
    disposeObjectTree(this.scene);

    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
  }
}
