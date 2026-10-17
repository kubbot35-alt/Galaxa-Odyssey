import * as THREE from 'three';

export interface CameraTargetPreset {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
}

export type ShipSkinId = 'stealth' | 'titanium' | 'cyberpunk' | 'hyperion';

export interface ShipSkinConfig {
    id: ShipSkinId;
    name: string;
    hullColor: number;
    armorColor: number;
    trimColor: number;
    trimEmissive: number;
    engineGlow: number;
    cockpitColor: number;
    metalness: number;
    roughness: number;
}

/**
 * Konfiguracje skórek (malowań) myśliwca w hangarze 3D
 */
export const SHIP_SKINS: Record<ShipSkinId, ShipSkinConfig> = {
    stealth: {
        id: 'stealth',
        name: 'VOID STEALTH',
        hullColor: 0x0a0f1d,
        armorColor: 0x141e33,
        trimColor: 0x38bdf8,
        trimEmissive: 0x0284c7,
        engineGlow: 0x38bdf8,
        cockpitColor: 0x0284c7,
        metalness: 0.92,
        roughness: 0.22,
    },
    titanium: {
        id: 'titanium',
        name: 'SOLAR TITANIUM',
        hullColor: 0x1c1917,
        armorColor: 0x292524,
        trimColor: 0xf59e0b,
        trimEmissive: 0xd97706,
        engineGlow: 0xfbbf24,
        cockpitColor: 0xd97706,
        metalness: 0.96,
        roughness: 0.18,
    },
    cyberpunk: {
        id: 'cyberpunk',
        name: 'CYBER PULSE',
        hullColor: 0x180b2c,
        armorColor: 0x271047,
        trimColor: 0xf43f5e,
        trimEmissive: 0xe11d48,
        engineGlow: 0xa855f7,
        cockpitColor: 0xec4899,
        metalness: 0.9,
        roughness: 0.2,
    },
    hyperion: {
        id: 'hyperion',
        name: 'HYPERION ARCTIC',
        hullColor: 0xededed,
        armorColor: 0xcfd8dc,
        trimColor: 0x0284c7,
        trimEmissive: 0x0369a1,
        engineGlow: 0x67e8f9,
        cockpitColor: 0x0ea5e9,
        metalness: 0.85,
        roughness: 0.25,
    },
};

/**
 * Presety pozycji i celów kamer dla widoków inspekcyjnych w hangarze
 */
export const CAMERA_PRESETS: Record<string, CameraTargetPreset> = {
    default: {
        position: new THREE.Vector3(0, 2.3, 6.2),
        lookAt: new THREE.Vector3(0, 1.1, 0),
    },
    weapons: {
        position: new THREE.Vector3(2.6, 1.9, 3.4),
        lookAt: new THREE.Vector3(0.8, 1.0, 0.4),
    },
    cockpit: {
        position: new THREE.Vector3(-1.2, 2.6, 3.0),
        lookAt: new THREE.Vector3(0, 1.35, 0.8),
    },
    engines: {
        position: new THREE.Vector3(-2.6, 2.2, -4.2),
        lookAt: new THREE.Vector3(0, 1.2, -1.0),
    },
    cinematic: {
        position: new THREE.Vector3(5.2, 4.2, 7.8),
        lookAt: new THREE.Vector3(0, 1.4, 0),
    },
    orbital: {
        position: new THREE.Vector3(0, 9.5, 17.0),
        lookAt: new THREE.Vector3(0, 2.0, -1.0),
    },
    hangar: {
        position: new THREE.Vector3(0, 7.5, 14.8),
        lookAt: new THREE.Vector3(0, 3.2, 0),
    },
};