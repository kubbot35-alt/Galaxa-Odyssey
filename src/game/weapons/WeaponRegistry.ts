import { WeaponMode } from '../../types/game';
import type { IWeaponStrategy } from './IWeaponStrategy';
import { PlasmaSpread, StandardBlaster, TripleShot } from './BlasterWeapons';
import { LaserBeam } from './LaserBeam';

export type WeaponRegistry = Record<WeaponMode, IWeaponStrategy>;

/** Adding a weapon = new strategy + one entry here (Record forces every WeaponMode to be covered). */
export const createDefaultWeaponRegistry = (): WeaponRegistry => {
    const standard = new StandardBlaster();
    return {
        [WeaponMode.STANDARD]: standard,
        [WeaponMode.TRIPLE_SHOT]: new TripleShot(),
        [WeaponMode.PLASMA_SPREAD]: new PlasmaSpread(),
        [WeaponMode.LASER_BEAM]: new LaserBeam(standard),
    };
};
