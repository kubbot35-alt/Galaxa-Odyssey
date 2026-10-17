import { MAX_WEAPON_ENERGY } from '../../constants';
import type { PlayerState } from '../GameEntities';

export class PlayerEffects {
    public static update(player: PlayerState, regenerateEnergy: boolean): void {
        if (regenerateEnergy && player.weaponEnergy < MAX_WEAPON_ENERGY) {
            player.weaponEnergy = Math.min(MAX_WEAPON_ENERGY, player.weaponEnergy + 0.08);
        }

        if (player.damageFlash && player.damageFlash > 0) {
            player.damageFlash = Math.max(0, player.damageFlash - 0.04);
        }

        if (player.shieldLag === undefined) {
            player.shieldLag = player.shield;
        }
        if (player.shieldLag > player.shield) {
            player.shieldLag = Math.max(player.shield, player.shieldLag - 1.25);
        } else if (player.shieldLag < player.shield) {
            player.shieldLag = player.shield;
        }

        if (player.hitNoticeTimer && player.hitNoticeTimer > 0) {
            player.hitNoticeTimer--;
            if (player.hitNoticeTimer === 0) {
                player.hitNotice = undefined;
            }
        }
    }
}
