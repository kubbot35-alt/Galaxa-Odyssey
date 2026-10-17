import type { PlayerSlot } from '../../types/input';
import { IDLE_INPUT, type DigitalInput } from './PlayerIntent';
import type { IInputSource, InputCommands } from './IInputSource';
import KeyboardInput from './KeyboardInput';
import { DEFAULT_KEYBOARD_LAYOUT, type KeyboardAction, type KeyboardLayout } from './KeyboardKeyMap';

const ACTIONS: readonly KeyboardAction[] = ['left', 'right', 'up', 'down', 'fire', 'roll'];

/** Web keyboard device: DOM events in, pressed state and commands out. */
export class KeyboardInputSource implements IInputSource {
    private keys: Record<string, boolean> = {};
    private commands: InputCommands | null = null;
    private readonly keyboard: KeyboardInput;

    constructor(private readonly layout: KeyboardLayout = DEFAULT_KEYBOARD_LAYOUT) {
        this.keyboard = new KeyboardInput({
            onKeyChange: (key, code, pressed) => {
                this.keys[key] = pressed;
                this.keys[code] = pressed;
            },
            onWeaponCycle: (dir) => this.commands?.weaponCycle(dir),
            onWeaponSelect: (index) => this.commands?.weaponSelect(index),
            onPauseToggle: () => this.commands?.pauseToggle(),
            onAchievementsToggle: () => this.commands?.achievementsToggle(),
            onFireStart: (slot) => this.commands?.fireStart(slot as PlayerSlot),
            onFireEnd: (slot) => this.commands?.fireEnd(slot as PlayerSlot),
        });
    }

    public connect(commands: InputCommands): void {
        this.commands = commands;
    }

    public getInput(slot: PlayerSlot, isTwoPlayer: boolean): DigitalInput {
        if (slot === 2 && !isTwoPlayer) return IDLE_INPUT;

        const input = {} as DigitalInput;
        for (const action of ACTIONS) {
            input[action] = this.isAnyDown(this.keysFor(slot, action, isTwoPlayer));
        }
        return input;
    }

    public reset(): void {
        this.keys = {};
    }

    public dispose(): void {
        this.keyboard.dispose();
    }

    private keysFor(slot: PlayerSlot, action: KeyboardAction, isTwoPlayer: boolean): readonly string[] {
        if (slot === 2) return this.layout.p2[action];
        const extra = isTwoPlayer ? undefined : this.layout.p1SoloExtra[action];
        return extra ? [...this.layout.p1[action], ...extra] : this.layout.p1[action];
    }

    private isAnyDown(keys: readonly string[]): boolean {
        return keys.some((key) => this.keys[key] === true);
    }
}
