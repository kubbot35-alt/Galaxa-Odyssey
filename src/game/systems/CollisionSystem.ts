import { DifficultyLevel } from '../../types/game';
import {
    BOMB_SIZE,
    ENEMY_HEIGHT,
    ENEMY_WIDTH,
    LASER_BEAM_WIDTH,
    POWERUP_TOKEN_SIZE,
} from '../constants';
import { Bomb, Bullet, Enemy, PlayerState, PowerUp, WeaponAnnouncement } from '../entities/GameEntities';

export interface ICollisionDetectionContext {
    player1: PlayerState;
    player2: PlayerState | null;
    twoPlayerMode: boolean;
    bullets: Bullet[];
    bombs: Bomb[];
    enemies: Enemy[];
    powerUps: PowerUp[];
}

export interface ICollisionContext extends ICollisionDetectionContext {
    difficultyLevel: DifficultyLevel;
    wave: number;
    credits: number;
    profileScore: number;
    highScore: number;
    infiniteLives: boolean;
    tookDamageInCurrentWave: boolean;
    weaponAnnouncement: WeaponAnnouncement | null;
    addExplosion: (x: number, y: number, r: number, g: number, b: number, count: number) => void;
    addLaserSparks: (x: number, y: number, colorHex: string, count?: number) => void;
    unlockAchievement: (id: string) => void;
    incrementProgress: (id: string, amount?: number) => void;
    onAllPlayersDead: () => void;
    notifyChange: () => void;
}

export type CollisionEvent =
    | { type: 'laser-bomb-hit'; bomb: Bomb; laserX: number; bombCenterY: number }
    | { type: 'laser-enemy-hit'; enemy: Enemy; laserX: number; enemyCenterY: number }
    | { type: 'player-bullet-bomb-hit'; bullet: Bullet; bomb: Bomb }
    | { type: 'player-bullet-enemy-hit'; bullet: Bullet; enemy: Enemy }
    | { type: 'enemy-bullet-player-hit'; bullet: Bullet; player: PlayerState }
    | { type: 'bomb-player-hit'; bomb: Bomb; player: PlayerState }
    | { type: 'enemy-player-hit'; enemy: Enemy; player: PlayerState }
    | { type: 'players-dead' }
    | { type: 'power-up-player-hit'; powerUp: PowerUp; player: PlayerState };

export class CollisionSystem {
    public intersects(
        x1: number,
        y1: number,
        w1: number,
        h1: number,
        x2: number,
        y2: number,
        w2: number,
        h2: number
    ): boolean {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    public *detectAllCollisions(ctx: ICollisionDetectionContext): Generator<CollisionEvent> {
        yield* this.detectLaserHits(ctx);
        yield* this.detectBulletHits(ctx);
        yield* this.detectEnemyAndHazardHits(ctx);
        yield* this.detectPowerUpHits(ctx);
    }

    private *detectLaserHits(ctx: ICollisionDetectionContext): Generator<CollisionEvent> {
        if (!ctx.player1.isLaserActive || ctx.player1.lives <= 0) return;

        const laserX = ctx.player1.x + ctx.player1.width / 2;
        const laserBottom = ctx.player1.y;

        for (let bmi = ctx.bombs.length - 1; bmi >= 0; bmi--) {
            const bomb = ctx.bombs[bmi];
            const bombCenterX = bomb.x + 12;
            const bombCenterY = bomb.y + 12;

            if (
                Math.abs(bombCenterX - laserX) < LASER_BEAM_WIDTH / 2 + 12 &&
                bombCenterY >= 0 &&
                bombCenterY <= laserBottom
            ) {
                yield { type: 'laser-bomb-hit', bomb, laserX, bombCenterY };
            }
        }

        for (let ei = ctx.enemies.length - 1; ei >= 0; ei--) {
            const enemy = ctx.enemies[ei];
            const enemyCenterX = enemy.x + 16;
            const enemyCenterY = enemy.y + 16;

            if (
                Math.abs(enemyCenterX - laserX) < LASER_BEAM_WIDTH / 2 + 16 &&
                enemyCenterY >= 0 &&
                enemyCenterY <= laserBottom
            ) {
                yield { type: 'laser-enemy-hit', enemy, laserX, enemyCenterY };
            }
        }
    }

    private *detectBulletHits(ctx: ICollisionDetectionContext): Generator<CollisionEvent> {
        for (let bi = ctx.bullets.length - 1; bi >= 0; bi--) {
            const bullet = ctx.bullets[bi];
            if (!bullet.isFromPlayer) continue;

            let bulletHit = false;
            for (let bmi = ctx.bombs.length - 1; bmi >= 0; bmi--) {
                const bomb = ctx.bombs[bmi];
                if (this.intersects(bullet.x - 4, bullet.y, 8, 14, bomb.x, bomb.y, BOMB_SIZE, BOMB_SIZE)) {
                    yield { type: 'player-bullet-bomb-hit', bullet, bomb };
                    bulletHit = true;
                    break;
                }
            }
            if (bulletHit) continue;

            for (let ei = ctx.enemies.length - 1; ei >= 0; ei--) {
                const enemy = ctx.enemies[ei];
                if (this.intersects(bullet.x - 4, bullet.y, 8, 14, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
                    yield { type: 'player-bullet-enemy-hit', bullet, enemy };
                    break;
                }
            }
        }
    }

    private *detectEnemyAndHazardHits(ctx: ICollisionDetectionContext): Generator<CollisionEvent> {
        const playersToCheck = [ctx.player1];
        if (ctx.twoPlayerMode && ctx.player2) playersToCheck.push(ctx.player2);

        for (const player of playersToCheck) {
            if (player.lives <= 0) continue;

            for (let bi = ctx.bullets.length - 1; bi >= 0; bi--) {
                const bullet = ctx.bullets[bi];
                if (bullet.isFromPlayer) continue;
                if (this.intersects(bullet.x - 3, bullet.y, 6, 12, player.x, player.y, player.width, player.height)) {
                    yield { type: 'enemy-bullet-player-hit', bullet, player };
                    break;
                }
            }

            for (let bmi = ctx.bombs.length - 1; bmi >= 0; bmi--) {
                const bomb = ctx.bombs[bmi];
                if (this.intersects(bomb.x, bomb.y, BOMB_SIZE, BOMB_SIZE, player.x, player.y, player.width, player.height)) {
                    yield { type: 'bomb-player-hit', bomb, player };
                    break;
                }
            }

            for (let ei = ctx.enemies.length - 1; ei >= 0; ei--) {
                const enemy = ctx.enemies[ei];
                if (this.intersects(enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, player.x, player.y, player.width, player.height)) {
                    yield { type: 'enemy-player-hit', enemy, player };
                    break;
                }
            }
        }

        const p1Dead = ctx.player1.lives <= 0;
        const p2Dead = !ctx.twoPlayerMode || !ctx.player2 || ctx.player2.lives <= 0;
        if (p1Dead && p2Dead) {
            yield { type: 'players-dead' };
        }
    }

    private *detectPowerUpHits(ctx: ICollisionDetectionContext): Generator<CollisionEvent> {
        const playersToCheck = [ctx.player1];
        if (ctx.twoPlayerMode && ctx.player2) playersToCheck.push(ctx.player2);

        for (const player of playersToCheck) {
            if (player.lives <= 0) continue;
            for (let pi = ctx.powerUps.length - 1; pi >= 0; pi--) {
                const powerUp = ctx.powerUps[pi];
                if (
                    this.intersects(
                        powerUp.x,
                        powerUp.y,
                        POWERUP_TOKEN_SIZE,
                        POWERUP_TOKEN_SIZE,
                        player.x,
                        player.y,
                        player.width,
                        player.height
                    )
                ) {
                    yield { type: 'power-up-player-hit', powerUp, player };
                }
            }
        }
    }
}
