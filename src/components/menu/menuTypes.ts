import { StorageKeys } from '../../platform/storage/StorageKeys';

export type MenuTab = 'main' | 'deploy' | 'loadout' | 'diagnostics' | 'manual';

export interface CameraPresetOption {
  id: string;
  label: string;
}

export const TOP_BAR_CAMERA_PRESETS: CameraPresetOption[] = [
  { id: 'default', label: '3/4 Hero' },
  { id: 'hangar', label: 'Hangar Bay' },
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'engines', label: 'Engines' },
  { id: 'orbital', label: 'Orbit' },
];

export const CINEMATIC_CAMERA_PRESETS: CameraPresetOption[] = [
  { id: 'hangar', label: 'Hangar Bay' },
  { id: 'default', label: 'Statek 3/4' },
  { id: 'cockpit', label: 'Kokpit' },
  { id: 'weapons', label: 'Działa' },
  { id: 'engines', label: 'Silniki' },
  { id: 'orbital', label: 'Orbita' },
];

export const TAB_CAMERA_PRESET: Record<MenuTab, string> = {
  main: 'default',
  deploy: 'cinematic',
  loadout: 'weapons',
  diagnostics: 'cockpit',
  manual: 'engines',
};

export const SHIP_SKIN_STORAGE_KEY = StorageKeys.shipSkin;
export const INTRO_SEEN_STORAGE_KEY = StorageKeys.introSeen;
