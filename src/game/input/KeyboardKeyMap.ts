/**
 * Keyboard layout as data. Entries are matched against the lower-cased `key` and the raw `code`
 * of pressed keys. Left/right are in game space, so player 1's horizontal keys are mirrored
 * (arrow-right = game-space left); player 2 is not. This reproduces the original behaviour.
 * Entries such as 'keyd' or 'numpad4' never match a raw `code` (it keeps its case) and are kept as-is.
 */
export type KeyboardAction = 'left' | 'right' | 'up' | 'down' | 'fire' | 'roll';
export type SlotKeyMap = Readonly<Record<KeyboardAction, readonly string[]>>;

export interface KeyboardLayout {
    p1: SlotKeyMap;
    /** Extra player 1 keys, active only in single-player (WASD is player 2's in co-op). */
    p1SoloExtra: Readonly<Partial<Record<KeyboardAction, readonly string[]>>>;
    p2: SlotKeyMap;
}

export const DEFAULT_KEYBOARD_LAYOUT: KeyboardLayout = {
    p1: {
        left: ['arrowright'],
        right: ['arrowleft'],
        up: ['arrowup'],
        down: ['arrowdown'],
        fire: ['space', ' '],
        roll: ['shiftleft'],
    },
    p1SoloExtra: {
        left: ['d', 'keyd'],
        right: ['a', 'keya'],
        up: ['w', 'keyw'],
        down: ['s', 'keys'],
    },
    p2: {
        left: ['a', 'keya', 'numpad4', 'j'],
        right: ['d', 'keyd', 'numpad6', 'l'],
        up: ['w', 'keyw', 'numpad8', 'i'],
        down: ['s', 'keys', 'numpad5', 'k'],
        fire: ['f', 'keyf', 'numpad0', 'enter'],
        roll: ['numpad1'],
    },
};
