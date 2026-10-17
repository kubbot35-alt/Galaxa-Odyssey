import { SoundType } from '../../types/game';
import type { IWeaponStrategy, WeaponFireContext } from './IWeaponStrategy';

const MIN_ENERGY = 2;
const ENERGY_DRAIN = 0.4;
const SOUND_EVERY_N_TICKS = 7;

/** Continuous beam; degrades to the fallback weapon when the capacitor is drained. */
export class LaserBeam implements IWeaponStrategy {
    private soundTimer = 0;

    constructor(private readonly fallback: IWeaponStrategy) {}

    public fire(ctx: WeaponFireContext): number | undefined {
        const { player, audio } = ctx;
        if (player.weaponEnergy <= MIN_ENERGY) {
            player.isLaserActive = false;
            return this.fallback.fire(ctx);
        }

        player.isLaserActive = true;
        player.weaponEnergy = Math.max(0, player.weaponEnergy - ENERGY_DRAIN);
        this.soundTimer++;
        if (this.soundTimer % SOUND_EVERY_N_TICKS === 0) {
            audio.playSound(SoundType.LASER);
        }
        return undefined;
    }
}
