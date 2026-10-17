import { EnemyType, PowerUpType } from '../../types/game';
import type { Enemy, PowerUp } from '../entities/GameEntities';

export class LootDropService {
    public dropForEnemy(enemy: Enemy, powerUps: PowerUp[]): void {
        const isElite = enemy.type === EnemyType.ELITE;
        const chance = isElite ? 0.45 : 0.14;
        if (Math.random() >= chance) return;

        const roll = Math.random();
        let type: PowerUpType;

        if (isElite) {
            if (roll < 0.38) type = PowerUpType.TOKEN_LASER_BEAM;
            else if (roll < 0.68) type = PowerUpType.TOKEN_TRIPLE_SHOT;
            else if (roll < 0.85) type = PowerUpType.TOKEN_PLASMA_SPREAD;
            else type = PowerUpType.EXTRA_LIFE;
        } else {
            if (roll < 0.28) type = PowerUpType.TOKEN_TRIPLE_SHOT;
            else if (roll < 0.48) type = PowerUpType.TOKEN_LASER_BEAM;
            else if (roll < 0.65) type = PowerUpType.TOKEN_PLASMA_SPREAD;
            else if (roll < 0.82) type = PowerUpType.SHIELD_BOOST;
            else if (roll < 0.93) type = PowerUpType.WEAPON;
            else type = PowerUpType.EXTRA_LIFE;
        }

        powerUps.push({
            x: enemy.x,
            y: enemy.y,
            type,
            bobAngle: Math.random() * Math.PI * 2,
            speed: 1.8 + Math.random() * 0.6,
        });
    }
}
