import type * as THREE from 'three';

/** Owns Three.js resources created for the hangar and disposes each of them exactly once. */
export class HangarResourceTracker {
  private materials = new Set<THREE.Material>();
  private geometries = new Set<THREE.BufferGeometry>();
  private textures = new Set<THREE.Texture>();

  public trackMaterial<T extends THREE.Material>(mat: T): T {
    this.materials.add(mat);
    return mat;
  }

  public trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.add(geo);
    return geo;
  }

  public trackTexture<T extends THREE.Texture>(tex: T): T {
    this.textures.add(tex);
    return tex;
  }

  public disposeAll(): void {
    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    for (const tex of this.textures) {
      tex.dispose();
    }
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }
}
