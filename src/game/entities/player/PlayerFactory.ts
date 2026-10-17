import { WeaponMode } from '../../../types/game';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    MAX_SHIELD,
    MAX_WEAPON_ENERGY,
} from '../../constants';
import type { PlayerState } from '../GameEntities';

export class PlayerFactory {
    public static createPlayer(
        x: number,
        ownedWeaponLevel: number,
        doubleLives: boolean,
        infiniteLives: boolean
    ): PlayerState {
        return {
            x,
            y: GAME_HEIGHT - PLAYER_HEIGHT - 30,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            lives: infiniteLives ? 999999 : doubleLives ? 6 : 3,
            shield: MAX_SHIELD,
            score: 0,
            weaponLevel: ownedWeaponLevel,
            weaponMode: WeaponMode.STANDARD,
            unlockedWeaponModes: [WeaponMode.STANDARD],
            weaponEnergy: MAX_WEAPON_ENERGY,
            movingLeft: false,
            movingRight: false,
            movingUp: false,
            movingDown: false,
        };
    }

    public static createPlayers(
        twoPlayerMode: boolean,
        ownedWeaponLevel: number,
        doubleLives: boolean,
        infiniteLives: boolean
    ): { player1: PlayerState; player2: PlayerState | null } {
        const make = (x: number) => this.createPlayer(x, ownedWeaponLevel, doubleLives, infiniteLives);

        if (twoPlayerMode) {
            return {
                player1: make(GAME_WIDTH / 2 - PLAYER_WIDTH - 30),
                player2: make(GAME_WIDTH / 2 + 30),
            };
        }
        return { player1: make(GAME_WIDTH / 2 - PLAYER_WIDTH / 2), player2: null };
    }
}
