import { MAX_SHIELD, MAX_WEAPON_ENERGY } from '../constants';
import type { PlayerState } from '../GameEngine';

const percentOf = (value: number, max: number) => Math.max(0, Math.min(100, Math.round((value / max) * 100)));

export function calculateCombatHudMetrics(player: PlayerState) {
    const shieldPercent = percentOf(player.shield, MAX_SHIELD);

    return {
        shieldPercent,
        shieldLagPercent: Math.max(shieldPercent, percentOf(player.shieldLag ?? player.shield, MAX_SHIELD)),
        energyPercent: percentOf(player.weaponEnergy, MAX_WEAPON_ENERGY),
        isTakingDamage: !!(player.damageFlash && player.damageFlash > 0.1),
    };
}
