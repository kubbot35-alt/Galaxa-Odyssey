import type { IKeyValueStorage } from './storage/IKeyValueStorage';
import type { IAudioPort } from './audio/IAudioPort';
import type { IInputSource } from '../game/input/IInputSource';
import { WebLocalStorage } from './storage/WebLocalStorage';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { WebAudioPort } from './audio/WebAudioPort';
import { InMemoryAudioPort } from './audio/InMemoryAudioPort';
import { KeyboardInputSource } from '../game/input/KeyboardInputSource';
import { GamepadInputSource } from '../game/input/GamepadInputSource';

/** Everything platform-specific the game needs; one object per target (web, tests, native shell...). */
export interface PlatformServices {
    storage: IKeyValueStorage;
    audio: IAudioPort;
    /** Called once per engine: the physical input devices of the platform. */
    createInputSources(): IInputSource[];
}

export const createWebPlatform = (): PlatformServices => ({
    storage: new WebLocalStorage(),
    audio: new WebAudioPort(),
    createInputSources: () => [new KeyboardInputSource(), new GamepadInputSource()],
});

/** Headless platform: no DOM, no sound, no devices. */
export const createInMemoryPlatform = (overrides: Partial<PlatformServices> = {}): PlatformServices => ({
    storage: new InMemoryStorage(),
    audio: new InMemoryAudioPort(),
    createInputSources: () => [],
    ...overrides,
});
