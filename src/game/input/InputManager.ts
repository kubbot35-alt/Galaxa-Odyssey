import type { GameInputActions, PlayerIntent, PlayerSlot, VirtualButtonAction } from '../../types/input';
import { IDLE_INPUT, mergeInputs, toIntent } from './PlayerIntent';
import type { IInputSource, InputCommands, IPlayerIntentProvider } from './IInputSource';
import { KeyboardInputSource } from './KeyboardInputSource';
import { VirtualInputSource } from './VirtualInputSource';

/** Aggregates input sources into per-player intents and forwards their discrete commands. */
export class InputManager implements IPlayerIntentProvider {
    public isTwoPlayer = false;

    private onWeaponCycle?: (dir: 1 | -1) => void;
    private onWeaponSelect?: (modeIdx: number) => void;
    private onPauseToggle?: () => void;
    private onAchievementsToggle?: () => void;
    private onFireStart?: (pIdx: number) => void;
    private onFireEnd?: (pIdx: number) => void;

    private readonly virtual = new VirtualInputSource();
    private readonly sources: IInputSource[];

    private readonly commands: InputCommands = {
        weaponCycle: (dir) => this.onWeaponCycle?.(dir),
        weaponSelect: (modeIdx) => this.onWeaponSelect?.(modeIdx),
        pauseToggle: () => this.onPauseToggle?.(),
        achievementsToggle: () => this.onAchievementsToggle?.(),
        fireStart: (slot) => this.onFireStart?.(slot),
        fireEnd: (slot) => this.onFireEnd?.(slot),
    };

    /** The on-screen button source is always present; `sources` are the physical devices of the platform. */
    constructor(sources: IInputSource[] = [new KeyboardInputSource()]) {
        this.sources = [...sources, this.virtual];
        this.sources.forEach((source) => source.connect(this.commands));
    }

    public addSource(source: IInputSource): void {
        source.connect(this.commands);
        this.sources.push(source);
    }

    public setOnWeaponCycle(cb: (dir: 1 | -1) => void) {
        this.onWeaponCycle = cb;
    }

    public setOnWeaponSelect(cb: (modeIdx: number) => void) {
        this.onWeaponSelect = cb;
    }

    public setOnPauseToggle(cb: () => void) {
        this.onPauseToggle = cb;
    }

    public setOnAchievementsToggle(cb: () => void) {
        this.onAchievementsToggle = cb;
    }

    public setOnFireStart(cb: (pIdx: number) => void) {
        this.onFireStart = cb;
    }

    public setOnFireEnd(cb: (pIdx: number) => void) {
        this.onFireEnd = cb;
    }

    public setVirtualButton(player: PlayerSlot, action: VirtualButtonAction, pressed: boolean) {
        this.virtual.setButton(player, action, pressed);
    }

    public getIntent(slot: PlayerSlot): PlayerIntent {
        if (slot === 2 && !this.isTwoPlayer) return toIntent(IDLE_INPUT);
        return toIntent(mergeInputs(this.sources.map((source) => source.getInput(slot, this.isTwoPlayer))));
    }

    public getPlayer1Actions(): PlayerIntent {
        return this.getIntent(1);
    }

    public getPlayer2Actions(): PlayerIntent {
        return this.getIntent(2);
    }

    public getInputActions(): GameInputActions {
        return {
            p1: this.getIntent(1),
            p2: this.getIntent(2),
            isTwoPlayer: this.isTwoPlayer,
        };
    }

    /** Call once per frame so polled devices can raise their discrete commands. */
    public poll(): void {
        this.sources.forEach((source) => source.poll?.(this.isTwoPlayer));
    }

    public reset() {
        this.sources.forEach((source) => source.reset());
    }

    public dispose() {
        this.sources.forEach((source) => source.dispose());
    }
}
