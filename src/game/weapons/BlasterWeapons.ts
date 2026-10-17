import { SoundType } from '../../types/game';
import type { PlayerState } from '../entities/GameEntities';
import { fromCenter, fromLeft, fromRight, ProjectileWeapon, type MuzzleSpec } from './ProjectileWeapon';

const BLASTER_COLOR = '#41f0ff';
const blaster = (x: MuzzleSpec['x'], dy = 0): MuzzleSpec => ({ x, dy, vy: -11, color: BLASTER_COLOR });

export class StandardBlaster extends ProjectileWeapon {
    protected muzzles(p: PlayerState): MuzzleSpec[] {
        if (p.weaponLevel === 1) return [blaster(fromCenter())];
        if (p.weaponLevel === 2) return [blaster(fromLeft(8)), blaster(fromRight(8))];
        return [blaster(fromCenter(), -4), blaster(fromLeft(2)), blaster(fromRight(2))];
    }

    protected cooldown(p: PlayerState): number {
        return Math.max(5, 12 - p.weaponLevel * 2);
    }
}

export class TripleShot extends ProjectileWeapon {
    protected readonly sound = SoundType.TRIPLE_SHOT;
    protected readonly energyCost = 1.2;

    protected muzzles(p: PlayerState): MuzzleSpec[] {
        const gold = '#fbbf24';
        const shots: MuzzleSpec[] = [
            { x: fromCenter(), dy: -4, vy: -12, color: gold, size: 5 },
            { x: fromCenter(-10), vx: -3.8, vy: -11.5, color: gold, size: 4 },
            { x: fromCenter(10), vx: 3.8, vy: -11.5, color: gold, size: 4 },
        ];
        if (p.weaponLevel >= 3) {
            const amber = '#f59e0b';
            shots.push(
                { x: fromCenter(-18), dy: 4, vx: -6.2, vy: -10, color: amber, size: 3 },
                { x: fromCenter(18), dy: 4, vx: 6.2, vy: -10, color: amber, size: 3 }
            );
        }
        return shots;
    }

    protected cooldown(): number {
        return 8;
    }
}

export class PlasmaSpread extends ProjectileWeapon {
    protected readonly sound = SoundType.TRIPLE_SHOT;
    protected readonly energyCost = 1.8;

    protected muzzles(): MuzzleSpec[] {
        return [-5.2, -2.6, 0, 2.6, 5.2].map((vx) => ({
            x: fromCenter(),
            vx,
            vy: -11,
            color: '#c084fc',
            size: 5,
        }));
    }

    protected cooldown(): number {
        return 10;
    }
}
