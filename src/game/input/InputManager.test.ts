import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager keyboard adapter', () => {
    let listeners: Map<string, EventListener>;
    let addEventListener: ReturnType<typeof vi.fn>;
    let removeEventListener: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        listeners = new Map();
        addEventListener = vi.fn((type: string, listener: EventListener) => {
            listeners.set(type, listener);
        });
        removeEventListener = vi.fn();
        vi.stubGlobal('window', {
            addEventListener,
            removeEventListener,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('translates keyboard commands and exposes pressed keys through input state', () => {
        const manager = new InputManager();
        const cycleWeapon = vi.fn();
        const startFire = vi.fn();
        const endFire = vi.fn();
        manager.setOnWeaponCycle(cycleWeapon);
        manager.setOnFireStart(startFire);
        manager.setOnFireEnd(endFire);

        listeners.get('keydown')?.({ key: 'q', code: 'KeyQ' } as KeyboardEvent);
        listeners.get('keydown')?.({ key: ' ', code: 'Space' } as KeyboardEvent);

        expect(cycleWeapon).toHaveBeenCalledWith(-1);
        expect(startFire).toHaveBeenCalledWith(1);
        expect(manager.getIntent(1).fire).toBe(true);

        listeners.get('keyup')?.({ key: ' ', code: 'Space' } as KeyboardEvent);

        expect(endFire).toHaveBeenCalledWith(1);
        expect(manager.getIntent(1).fire).toBe(false);
        manager.dispose();
    });

    it('removes the registered DOM listeners when disposed', () => {
        const manager = new InputManager();

        manager.dispose();

        expect(addEventListener).toHaveBeenCalledTimes(2);
        expect(removeEventListener).toHaveBeenCalledTimes(2);
        expect(removeEventListener).toHaveBeenCalledWith('keydown', listeners.get('keydown'));
        expect(removeEventListener).toHaveBeenCalledWith('keyup', listeners.get('keyup'));
    });
});

describe('input sources', () => {
    const press = (manager: InputManager, listeners: Map<string, EventListener>, key: string, code: string, down = true) =>
        listeners.get(down ? 'keydown' : 'keyup')?.({ key, code } as KeyboardEvent);

    let listeners: Map<string, EventListener>;
    beforeEach(() => {
        listeners = new Map();
        vi.stubGlobal('window', {
            addEventListener: (type: string, l: EventListener) => listeners.set(type, l),
            removeEventListener: vi.fn(),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('maps single-player WASD and arrows with the original mirrored horizontal axis', () => {
        const m = new InputManager();
        press(m, listeners, 'ArrowRight'.toLowerCase(), 'ArrowRight');
        expect(m.getIntent(1).moveX).toBe(-1);
        press(m, listeners, 'arrowright', 'ArrowRight', false);
        press(m, listeners, 'w', 'KeyW');
        expect(m.getIntent(1).moveY).toBe(1);
        m.dispose();
    });

    it('gives WASD to player 2 only in two-player mode and idles player 2 otherwise', () => {
        const m = new InputManager();
        press(m, listeners, 'a', 'KeyA');
        expect(m.getIntent(1).moveX).toBe(1);
        expect(m.getIntent(2)).toEqual({ moveX: 0, moveY: 0, fire: false, roll: false });

        m.isTwoPlayer = true;
        expect(m.getIntent(1).moveX).toBe(0);
        expect(m.getIntent(2).moveX).toBe(-1);
        m.dispose();
    });

    it('merges keyboard and touch: opposite inputs cancel, fire is OR-ed', () => {
        const m = new InputManager();
        press(m, listeners, 'arrowleft', 'ArrowLeft');
        expect(m.getIntent(1).moveX).toBe(1);
        m.setVirtualButton(1, 'left', true);
        expect(m.getIntent(1).moveX).toBe(1);
        m.setVirtualButton(1, 'right', true);
        expect(m.getIntent(1).moveX).toBe(0);
        m.setVirtualButton(1, 'fire', true);
        expect(m.getIntent(1).fire).toBe(true);
        m.dispose();
    });

    it('raises fire commands from virtual buttons and clears state on reset', () => {
        const m = new InputManager([]);
        const start = vi.fn();
        const end = vi.fn();
        m.setOnFireStart(start);
        m.setOnFireEnd(end);
        m.setVirtualButton(2, 'fire', true);
        m.setVirtualButton(2, 'fire', false);
        expect(start).toHaveBeenCalledWith(2);
        expect(end).toHaveBeenCalledWith(2);

        m.isTwoPlayer = true;
        m.setVirtualButton(2, 'left', true);
        expect(m.getIntent(2).moveX).toBe(-1);
        m.reset();
        expect(m.getIntent(2).moveX).toBe(0);
    });

    it('accepts any custom device without DOM access', () => {
        const m = new InputManager([]);
        let commands: Parameters<InputManager['addSource']>[0] extends { connect(c: infer C): void } ? C : never;
        m.addSource({
            connect: (c) => { commands = c; },
            getInput: () => ({ left: false, right: true, up: false, down: false, fire: true, roll: false }),
            reset: () => {},
            dispose: () => {},
        });
        const pause = vi.fn();
        m.setOnPauseToggle(pause);
        commands!.pauseToggle();
        expect(pause).toHaveBeenCalled();
        expect(m.getIntent(1)).toMatchObject({ moveX: 1, fire: true });
    });
});