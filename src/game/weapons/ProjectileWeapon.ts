import { SoundType } from '../../types/game';
import type { Bullet, PlayerState } from '../entities/GameEntities';
import type { IWeaponStrategy, WeaponFireContext } from './IWeaponStrategy';

/** Where and how one projectile leaves the ship, relative to the player's top edge. */
export interface MuzzleSpec {
    /** Offset from the ship's left edge. */
    x: (p: PlayerState) => number;
    dy?: number;
    vx?: number;
    vy: number;
    color: string;
    size?: number;
}

export const fromCenter = (offset = 0) => (p: PlayerState) => p.x + p.width / 2 + offset;
export const fromLeft = (offset: number) => (p: PlayerState) => p.x + offset;
export const fromRight = (offset: number) => (p: PlayerState) => p.x + p.width - offset;

/** Template: subclasses declare the muzzle pattern, sound, cooldown and energy cost. */
export abstract class ProjectileWeapon implements IWeaponStrategy {
    protected readonly sound: SoundType = SoundType.SHOOT;
    protected readonly energyCost: number = 0;

    protected abstract muzzles(p: PlayerState): MuzzleSpec[];
    protected abstract cooldown(p: PlayerState): number;

    public fire({ player, bullets, audio }: WeaponFireContext): number {
        audio.playSound(this.sound);
        for (const m of this.muzzles(player)) {
            bullets.push(this.createBullet(player, m));
        }
        if (this.energyCost > 0) {
            player.weaponEnergy = Math.max(0, player.weaponEnergy - this.energyCost);
        }
        return this.cooldown(player);
    }

    private createBullet(p: PlayerState, m: MuzzleSpec): Bullet {
        const bullet: Bullet = {
            x: m.x(p),
            y: p.y + (m.dy ?? 0),
            vx: m.vx ?? 0,
            vy: m.vy,
            isFromPlayer: true,
            color: m.color,
        };
        if (m.size !== undefined) bullet.size = m.size;
        return bullet;
    }
}
