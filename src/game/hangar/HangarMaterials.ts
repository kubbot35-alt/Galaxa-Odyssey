import * as THREE from 'three';
import type { HangarResourceTracker } from './HangarResourceTracker';
import { generateDeckPlateTexture, generateRunwayTexture, generateWallArmorTexture } from './HangarTextures';

/** Shared material palette used across the hangar scene. */
export interface HangarMaterials {
  deck: THREE.Material;
  runway: THREE.Material;
  wall: THREE.Material;
  archSteel: THREE.Material;
  republicRed: THREE.Material;
  republicWhite: THREE.Material;
  darkSteel: THREE.Material;
  chrome: THREE.Material;
  amberBeacon: THREE.Material;
  cyanGlow: THREE.Material;
  cloak: THREE.Material;
}

export function createHangarMaterials(tracker: HangarResourceTracker): HangarMaterials {
  const deckTexture = generateDeckPlateTexture(tracker);
  const runwayTexture = generateRunwayTexture(tracker);
  const wallTexture = generateWallArmorTexture(tracker);

  // Realistic PBR palette (Standard & Physical)
  const deck = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      map: deckTexture,
      roughness: 0.28,
      metalness: 0.82,
      envMapIntensity: 1.2,
    })
  );

  const runway = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      map: runwayTexture,
      roughness: 0.30,
      metalness: 0.72,
      envMapIntensity: 1.1,
    })
  );

  const wall = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.32,
      metalness: 0.78,
      envMapIntensity: 1.0,
    })
  );

  const archSteel = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.90,
      roughness: 0.20,
      envMapIntensity: 1.3,
    })
  );

  const republicRed = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      metalness: 0.35,
      roughness: 0.28,
      envMapIntensity: 1.2,
    })
  );

  const republicWhite = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.30,
      roughness: 0.25,
      envMapIntensity: 1.2,
    })
  );

  const darkSteel = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.2,
    })
  );

  const chrome = tracker.trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.08,
      envMapIntensity: 1.5,
    })
  );

  const amberBeacon = tracker.trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
    })
  );

  const cyanGlow = tracker.trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    })
  );

  const cloak = tracker.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 }));

  return {
    deck,
    runway,
    wall,
    archSteel,
    republicRed,
    republicWhite,
    darkSteel,
    chrome,
    amberBeacon,
    cyanGlow,
    cloak,
  };
}
