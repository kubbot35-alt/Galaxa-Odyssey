import type { Bomb, Enemy } from '../entities/GameEntities';
import { removeItem } from '../entities/collections';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import { SoundType } from '../../types/game';
import type { CollisionEvent, ICollisionContext } from './CollisionSystem';
import { EnemyRewardService } from './EnemyRewardService';
import { PlayerDamageService } from './PlayerDamageService';
import { PowerUpApplicationService } from './PowerUpApplicationService';

export class CollisionOutcomeHandler {
    private readonly enemyRewardService: EnemyRewardService;
    private readonly playerDamageService: PlayerDamageService;
    private readonly powerUpApplicationService: PowerUpApplicationService;

    constructor(private readonly audio: IGameAudio = new GameAudioService()) {
        this.enemyRewardService = new EnemyRewardService(audio);
        this.playerDamageService = new PlayerDamageService(audio);
        this.powerUpApplicationService = new PowerUpApplicationService(audio);
    }

    public handle(event: CollisionEvent, ctx: ICollisionContext): void {
        switch (event.type) {
            case 'laser-bomb-hit':
                ctx.addLaserSparks(event.laserX, event.bombCenterY, '#ff37a6', 5);
                this.removeBomb(event.bomb, ctx);
                ctx.addExplosion(event.bomb.x + 12, event.bomb.y + 12, 255, 70, 80, 40);
                this.audio.playSound(SoundType.EXPLOSION);
                ctx.incrementProgress('bomb_defuser', 1);
                return;
            case 'laser-enemy-hit':
                ctx.addLaserSparks(event.laserX, event.enemyCenterY, '#ff37a6', 3);
                event.enemy.hp -= 0.35;
                if (event.enemy.hp <= 0) {
                    this.removeEnemy(event.enemy, ctx);
                    ctx.addExplosion(event.enemy.x + 16, event.enemy.y + 16, 255, 55, 166, 30);
                    this.enemyRewardService.handleEnemyDestroyed(event.enemy, ctx);
                }
                return;
            case 'player-bullet-bomb-hit':
                this.removeBullet(event.bullet, ctx);
                this.removeBomb(event.bomb, ctx);
                ctx.addExplosion(event.bomb.x + 12, event.bomb.y + 12, 255, 70, 80, 45);
                this.audio.playSound(SoundType.EXPLOSION);
                ctx.incrementProgress('bomb_defuser', 1);
                ctx.incrementProgress('bomb_demolisher', 1);
                return;
            case 'player-bullet-enemy-hit':
                this.removeBullet(event.bullet, ctx);
                event.enemy.hp -= 1;
                if (event.enemy.hp <= 0) {
                    this.removeEnemy(event.enemy, ctx);
                    ctx.addExplosion(event.enemy.x + 16, event.enemy.y + 16, 255, 0, 255, 25);
                    this.enemyRewardService.handleEnemyDestroyed(event.enemy, ctx);
                } else {
                    ctx.addLaserSparks(event.enemy.x + 16, event.enemy.y + 16, '#37f5ff', 3);
                }
                return;
            case 'enemy-bullet-player-hit':
                this.removeBullet(event.bullet, ctx);
                this.playerDamageService.damagePlayer(
                    event.player,
                    this.playerDamageService.calculateDamage(ctx),
                    ctx
                );
                return;
            case 'bomb-player-hit':
                this.removeBomb(event.bomb, ctx);
                ctx.addExplosion(event.player.x + 20, event.player.y + 20, 255, 70, 80, 50);
                this.audio.playSound(SoundType.EXPLOSION);
                this.playerDamageService.damagePlayer(event.player, 100, ctx);
                return;
            case 'enemy-player-hit':
                this.removeEnemy(event.enemy, ctx);
                ctx.addExplosion(event.enemy.x + 16, event.enemy.y + 16, 255, 120, 60, 30);
                this.audio.playSound(SoundType.EXPLOSION);
                this.playerDamageService.damagePlayer(
                    event.player,
                    this.playerDamageService.calculateDamage(ctx),
                    ctx
                );
                return;
            case 'players-dead':
                ctx.onAllPlayersDead();
                return;
            case 'power-up-player-hit':
                this.powerUpApplicationService.collectPowerUp(event.powerUp, event.player, ctx);
                return;
        }
    }

    private removeBullet(bullet: ICollisionContext['bullets'][number], ctx: ICollisionContext): void {
        removeItem(ctx.bullets, bullet);
    }

    private removeBomb(bomb: Bomb, ctx: ICollisionContext): void {
        removeItem(ctx.bombs, bomb);
    }

    private removeEnemy(enemy: Enemy, ctx: ICollisionContext): void {
        removeItem(ctx.enemies, enemy);
    }
}
