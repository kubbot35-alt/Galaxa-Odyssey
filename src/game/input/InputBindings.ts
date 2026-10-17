import { GameState, WeaponMode } from '../../types/game';
import { InputManager } from './InputManager';

export interface IInputActions {
    gameState: GameState;
    twoPlayerMode: boolean;
    spaceHeld: boolean;
    secondPlayerFireHeld: boolean;
    fireCooldown: number;
    secondPlayerFireCooldown: number;
    player1: { isLaserActive?: boolean };
    cycleWeaponMode: (direction: 1 | -1) => void;
    setWeaponMode: (mode: WeaponMode) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    toggleAchievements: () => void;
    firePlayer1: () => void;
    firePlayer2: () => void;
}

const WEAPON_HOTKEYS: readonly WeaponMode[] = [
    WeaponMode.STANDARD,
    WeaponMode.TRIPLE_SHOT,
    WeaponMode.LASER_BEAM,
    WeaponMode.PLASMA_SPREAD,
];

/** Łączy zdarzenia InputManagera z akcjami silnika. */
export class InputBindings {
    public static bind(input: InputManager, actions: IInputActions): void {
        const isPlaying = () => actions.gameState === GameState.PLAYING;

        input.setOnWeaponCycle((dir: 1 | -1) => {
            if (isPlaying()) actions.cycleWeaponMode(dir);
        });

        input.setOnWeaponSelect((modeIdx: number) => {
            const mode = WEAPON_HOTKEYS[modeIdx];
            if (isPlaying() && mode) actions.setWeaponMode(mode);
        });

        input.setOnPauseToggle(() => {
            if (actions.gameState === GameState.PLAYING) actions.pauseGame();
            else if (actions.gameState === GameState.PAUSED) actions.resumeGame();
        });

        input.setOnAchievementsToggle(() => actions.toggleAchievements());

        input.setOnFireStart((pIdx: number) => {
            if (!isPlaying()) return;
            if (pIdx === 1) {
                actions.spaceHeld = true;
                if (actions.fireCooldown === 0) actions.firePlayer1();
            } else if (pIdx === 2 && actions.twoPlayerMode) {
                actions.secondPlayerFireHeld = true;
                if (actions.secondPlayerFireCooldown === 0) actions.firePlayer2();
            }
        });

        input.setOnFireEnd((pIdx: number) => {
            if (pIdx === 1) {
                actions.spaceHeld = false;
                actions.player1.isLaserActive = false;
            } else if (pIdx === 2) {
                actions.secondPlayerFireHeld = false;
            }
        });
    }
}
