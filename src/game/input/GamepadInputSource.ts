import type { PlayerSlot } from '../../types/input';
import type { IInputSource, InputCommands } from './IInputSource';
import { IDLE_INPUT, MIRROR_X, type DigitalInput } from './PlayerIntent';

/** Platform-neutral view of one gamepad; any backend (Web Gamepad API, native bridge) can produce it. */
export interface GamepadSnapshot {
    axes: readonly number[];
    buttons: readonly boolean[];
}

export interface IGamepadReader {
    /** Connected pads by index; missing pads are null. */
    read(): ReadonlyArray<GamepadSnapshot | null>;
}

/** Standard-mapping buttons. */
export const GamepadButton = {
    A: 0,
    LB: 4,
    RB: 5,
    RT: 7,
    Start: 9,
    DpadUp: 12,
    DpadDown: 13,
    DpadLeft: 14,
    DpadRight: 15,
} as const;

const DEAD_ZONE = 0.4;

export const navigatorGamepadReader: IGamepadReader = {
    read() {
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return [];
        return Array.from(navigator.getGamepads(), (pad) =>
            pad ? { axes: pad.axes, buttons: pad.buttons.map((b) => b.pressed) } : null
        );
    },
};

/** Pad N controls player N. Physical left/right follow the same game-space mirroring as the keyboard. */
export class GamepadInputSource implements IInputSource {
    private commands: InputCommands | null = null;
    private fireHeld: Record<PlayerSlot, boolean> = { 1: false, 2: false };
    private previous: Record<PlayerSlot, readonly boolean[]> = { 1: [], 2: [] };

    constructor(private readonly reader: IGamepadReader = navigatorGamepadReader) {}

    public connect(commands: InputCommands): void {
        this.commands = commands;
    }

    public getInput(slot: PlayerSlot, isTwoPlayer: boolean): DigitalInput {
        if (slot === 2 && !isTwoPlayer) return IDLE_INPUT;
        const pad = this.padFor(slot);
        if (!pad) return IDLE_INPUT;

        const held = (i: number) => pad.buttons[i] === true;
        const physicalLeft = (pad.axes[0] ?? 0) < -DEAD_ZONE || held(GamepadButton.DpadLeft);
        const physicalRight = (pad.axes[0] ?? 0) > DEAD_ZONE || held(GamepadButton.DpadRight);
        const mirror = MIRROR_X[slot];
        return {
            left: mirror ? physicalRight : physicalLeft,
            right: mirror ? physicalLeft : physicalRight,
            up: (pad.axes[1] ?? 0) < -DEAD_ZONE || held(GamepadButton.DpadUp),
            down: (pad.axes[1] ?? 0) > DEAD_ZONE || held(GamepadButton.DpadDown),
            fire: this.isFire(pad),
            roll: false,
        };
    }

    public poll(isTwoPlayer: boolean): void {
        if (!this.commands) return;
        const slots: PlayerSlot[] = isTwoPlayer ? [1, 2] : [1];
        for (const slot of slots) {
            const pad = this.padFor(slot);
            const fire = pad ? this.isFire(pad) : false;
            if (fire !== this.fireHeld[slot]) {
                this.fireHeld[slot] = fire;
                if (fire) this.commands.fireStart(slot);
                else this.commands.fireEnd(slot);
            }

            const prev = this.previous[slot];
            const pressedNow = (i: number) => pad?.buttons[i] === true && prev[i] !== true;
            if (pressedNow(GamepadButton.Start)) this.commands.pauseToggle();
            if (pressedNow(GamepadButton.LB)) this.commands.weaponCycle(-1);
            if (pressedNow(GamepadButton.RB)) this.commands.weaponCycle(1);
            this.previous[slot] = pad ? [...pad.buttons] : [];
        }
    }

    public reset(): void {
        this.fireHeld = { 1: false, 2: false };
        this.previous = { 1: [], 2: [] };
    }

    public dispose(): void {
        this.commands = null;
    }

    private padFor(slot: PlayerSlot): GamepadSnapshot | null {
        return this.reader.read()[slot - 1] ?? null;
    }

    private isFire(pad: GamepadSnapshot): boolean {
        return pad.buttons[GamepadButton.A] === true || pad.buttons[GamepadButton.RT] === true;
    }
}
