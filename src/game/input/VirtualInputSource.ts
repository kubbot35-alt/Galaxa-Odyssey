import type { PlayerSlot, VirtualButtonAction } from '../../types/input';
import { IDLE_INPUT, MIRROR_X, type DigitalInput } from './PlayerIntent';
import type { IInputSource, InputCommands } from './IInputSource';

type ButtonState = Record<VirtualButtonAction, boolean>;

const idleButtons = (): ButtonState => ({ left: false, right: false, up: false, down: false, fire: false, roll: false });

/** Device-agnostic on-screen buttons; also the entry point for gamepad or native bridges that press "virtual" buttons. */
export class VirtualInputSource implements IInputSource {
    private buttons: Record<PlayerSlot, ButtonState> = { 1: idleButtons(), 2: idleButtons() };
    private commands: InputCommands | null = null;

    public connect(commands: InputCommands): void {
        this.commands = commands;
    }

    public setButton(slot: PlayerSlot, action: VirtualButtonAction, pressed: boolean): void {
        this.buttons[slot][action] = pressed;
        if (action !== 'fire') return;
        if (pressed) this.commands?.fireStart(slot);
        else this.commands?.fireEnd(slot);
    }

    public getInput(slot: PlayerSlot, isTwoPlayer: boolean): DigitalInput {
        if (slot === 2 && !isTwoPlayer) return IDLE_INPUT;

        const b = this.buttons[slot];
        return {
            left: MIRROR_X[slot] ? b.right : b.left,
            right: MIRROR_X[slot] ? b.left : b.right,
            up: b.up,
            down: b.down,
            fire: b.fire,
            roll: b.roll,
        };
    }

    public reset(): void {
        this.buttons = { 1: idleButtons(), 2: idleButtons() };
    }

    public dispose(): void {
        this.commands = null;
    }
}
