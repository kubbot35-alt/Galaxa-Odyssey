import { PlayerEffects } from './PlayerEffects';
import { PlayerFactory } from './PlayerFactory';
import { PlayerMovement } from './PlayerMovement';

/** Facade kept for existing callers; each concern lives in its own class. */
export class PlayerEntityService {
    public static readonly createPlayer = PlayerFactory.createPlayer.bind(PlayerFactory);
    public static readonly createPlayers = PlayerFactory.createPlayers.bind(PlayerFactory);
    public static readonly updateMovement = PlayerMovement.update;
    public static readonly updateEffectsAndEnergy = PlayerEffects.update;
}
