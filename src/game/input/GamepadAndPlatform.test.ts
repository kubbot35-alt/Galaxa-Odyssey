import { describe, expect, it, vi } from 'vitest';
import { GamepadInputSource, GamepadButton, type GamepadSnapshot, type IGamepadReader } from './GamepadInputSource';
import { InputManager } from './InputManager';
import { GameEngine } from '../GameEngine';
import { createInMemoryPlatform } from '../../platform/PlatformServices';
import { InMemoryAudioPort } from '../../platform/audio/InMemoryAudioPort';
import { InMemoryStorage } from '../../platform/storage/InMemoryStorage';
import { StorageKeys } from '../../platform/storage/StorageKeys';
import { getStorage } from '../../platform/storage/SettingsRepository';

const pad = (axes: number[] = [0, 0], pressed: number[] = []): GamepadSnapshot => ({
    axes,
    buttons: Array.from({ length: 16 }, (_, i) => pressed.includes(i)),
});

const fakeReader = (pads: Array<GamepadSnapshot | null>): IGamepadReader & { pads: typeof pads } => ({
    pads,
    read() {
        return this.pads;
    },
});

describe('GamepadInputSource', () => {
    it('maps the stick with the same player 1 mirroring as the keyboard', () => {
        const reader = fakeReader([pad([-1, -1])]);
        const m = new InputManager([new GamepadInputSource(reader)]);
        expect(m.getIntent(1)).toMatchObject({ moveX: 1, moveY: 1 });
        reader.pads[0] = pad([0.1, 0.2]);
        expect(m.getIntent(1)).toMatchObject({ moveX: 0, moveY: 0 });
    });

    it('does not mirror player 2 and ignores pad 2 in single-player', () => {
        const reader = fakeReader([null, pad([-1, 0])]);
        const m = new InputManager([new GamepadInputSource(reader)]);
        expect(m.getIntent(2).moveX).toBe(0);
        m.isTwoPlayer = true;
        expect(m.getIntent(2).moveX).toBe(-1);
    });

    it('raises fire edges and one-shot commands from poll()', () => {
        const reader = fakeReader([pad()]);
        const m = new InputManager([new GamepadInputSource(reader)]);
        const start = vi.fn();
        const end = vi.fn();
        const pause = vi.fn();
        const cycle = vi.fn();
        m.setOnFireStart(start);
        m.setOnFireEnd(end);
        m.setOnPauseToggle(pause);
        m.setOnWeaponCycle(cycle);

        reader.pads[0] = pad([0, 0], [GamepadButton.A, GamepadButton.Start, GamepadButton.RB]);
        m.poll();
        m.poll();
        expect(start).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(1);
        expect(pause).toHaveBeenCalledTimes(1);
        expect(cycle).toHaveBeenCalledWith(1);
        expect(m.getIntent(1).fire).toBe(true);

        reader.pads[0] = pad();
        m.poll();
        expect(end).toHaveBeenCalledWith(1);
    });
});

describe('platform injection into GameEngine', () => {
    it('uses the injected storage, audio and input sources instead of browser globals', () => {
        const storage = new InMemoryStorage();
        const audio = new InMemoryAudioPort();
        const source = new GamepadInputSource(fakeReader([pad()]));
        const create = vi.fn(() => [source]);
        const engine = new GameEngine(undefined, createInMemoryPlatform({ storage, audio, createInputSources: create }));

        expect(create).toHaveBeenCalledTimes(1);
        expect(getStorage()).toBe(storage);

        engine.saveProfile();
        expect(storage.getItem(StorageKeys.profile)).not.toBeNull();
        expect(() => engine.update()).not.toThrow();
        expect(() => engine.inputManager.poll()).not.toThrow();
    });
});
