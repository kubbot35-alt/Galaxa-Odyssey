import { describe, expect, it } from 'vitest';
import { WeaponMode } from '../../types/game';
import { InMemoryAudioPort } from '../../platform/audio/InMemoryAudioPort';
import { PlayerEntityService } from '../entities/GameEntities';
import type { Bullet } from '../entities/GameEntities';
import { WeaponSystem } from './WeaponSystem';

const setup = (level = 1) => {
    const audio = new InMemoryAudioPort();
    const system = new WeaponSystem(audio);
    const player = PlayerEntityService.createPlayer(100, level, false, false);
    const bullets: Bullet[] = [];
    return { audio, system, player, bullets };
};

describe('WeaponSystem strategies', () => {
    it('standard blaster scales bullets and cooldown with weapon level', () => {
        for (const [level, count, cooldown] of [[1, 1, 10], [2, 2, 8], [3, 3, 6]] as const) {
            const { system, player, bullets } = setup(level);
            system.firePlayer1(player, bullets);
            expect(bullets).toHaveLength(count);
            expect(system.fireCooldown).toBe(cooldown);
        }
    });

    it('triple shot adds side shots at level 3 and drains energy', () => {
        const { system, player, bullets } = setup(3);
        player.weaponMode = WeaponMode.TRIPLE_SHOT;
        const before = player.weaponEnergy;
        system.firePlayer1(player, bullets);
        expect(bullets).toHaveLength(5);
        expect(system.fireCooldown).toBe(8);
        expect(player.weaponEnergy).toBeCloseTo(before - 1.2);
    });

    it('plasma spread fires five bullets', () => {
        const { system, player, bullets } = setup();
        player.weaponMode = WeaponMode.PLASMA_SPREAD;
        system.firePlayer1(player, bullets);
        expect(bullets.map((b) => b.vx)).toEqual([-5.2, -2.6, 0, 2.6, 5.2]);
        expect(system.fireCooldown).toBe(10);
    });

    it('laser drains energy without bullets, then falls back to the blaster', () => {
        const { system, player, bullets } = setup();
        player.weaponMode = WeaponMode.LASER_BEAM;
        system.firePlayer1(player, bullets);
        expect(player.isLaserActive).toBe(true);
        expect(bullets).toHaveLength(0);

        player.weaponEnergy = 1;
        system.firePlayer1(player, bullets);
        expect(player.isLaserActive).toBe(false);
        expect(bullets).toHaveLength(1);
    });

    it('player 2 always uses the standard blaster', () => {
        const { system, player, bullets } = setup(2);
        system.firePlayer2(player, bullets);
        expect(bullets).toHaveLength(2);
    });
});
