/**
 * Interfejs intencji wejściowych pojedynczego gracza.
 * Wartości osi są znormalizowane w zakresie [-1, 1].
 */
export interface PlayerInputState {
    // Wektor ruchu w osi X (-1: w lewo, 1: w prawo, 0: spoczynek)
    moveX: number;
    // Wektor ruchu w osi Y (-1: w dół, 1: w górę, 0: spoczynek)
    moveY: number;
    // Intencja prowadzenia ognia
    fire: boolean;
    // Intencja wykonania uniku / beczki (roll)
    roll?: boolean;
}

/**
 * Globalny stan akcji wejściowych dla całego silnika gry.
 */
export interface GameInputActions {
    p1: PlayerInputState;
    p2: PlayerInputState;
    isTwoPlayer: boolean;
}

/**
 * Identyfikator wirtualnych przycisków / akcji dotykowych
 */
export type VirtualButtonAction = 'left' | 'right' | 'up' | 'down' | 'fire' | 'roll';

/** Lokalny gracz, którego dotyczy wejście. */
export type PlayerSlot = 1 | 2;

/** Znormalizowana intencja gracza — do niej sprowadzane jest wejście z każdego urządzenia. */
export type PlayerIntent = PlayerInputState;
