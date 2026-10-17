import type { PlayerIntent, PlayerSlot } from '../../types/input';
import type { DigitalInput } from './PlayerIntent';

/** Discrete (non-continuous) commands any input source can raise. */
export interface InputCommands {
    weaponCycle(direction: 1 | -1): void;
    weaponSelect(modeIndex: number): void;
    pauseToggle(): void;
    achievementsToggle(): void;
    fireStart(slot: PlayerSlot): void;
    fireEnd(slot: PlayerSlot): void;
}

/**
 * A device adapter (keyboard, touch overlay, gamepad, native bridge...).
 * It reports continuous state as a PlayerIntent and raises discrete commands.
 * Axes are in game space: moveX < 0 decreases x, moveY > 0 moves up the screen.
 */
export interface IInputSource {
    getInput(slot: PlayerSlot, isTwoPlayer: boolean): DigitalInput;
    connect(commands: InputCommands): void;
    /** Optional per-frame hook for devices that must be polled (gamepads). */
    poll?(isTwoPlayer: boolean): void;
    reset(): void;
    dispose(): void;
}

/** Read side used by gameplay systems; keeps them independent from concrete devices. */
export interface IPlayerIntentProvider {
    getIntent(slot: PlayerSlot): PlayerIntent;
}
