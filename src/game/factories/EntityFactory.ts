import * as THREE from 'three';

/** Creates auxiliary scene lights. */
export class EntityFactory {
  public static createDirectionalLight(
    color: THREE.ColorRepresentation = 0xffffff,
    intensity: number = 1.5,
    position: THREE.Vector3 = new THREE.Vector3(10, 20, 15)
  ): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.copy(position);
    light.castShadow = true;
    return light;
  }

  public static createAmbientLight(
    color: THREE.ColorRepresentation = 0x223344,
    intensity: number = 1.0
  ): THREE.AmbientLight {
    return new THREE.AmbientLight(color, intensity);
  }
}
