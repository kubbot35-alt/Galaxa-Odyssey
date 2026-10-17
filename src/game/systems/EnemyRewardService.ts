import { EnemyType, ENEMY_CONFIGS, SoundType } from '../../types/game';
import type { Enemy } from '../entities/GameEntities';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import { LootDropService } from './LootDropService';
import type { ICollisionContext } from './CollisionSystem';

export class EnemyRewardService {
    private readonly lootDropService = new LootDropService();

    constructor(private readonly audio: IGameAudio = new GameAudioService()) {}

    public handleEnemyDestroyed(enemy: Enemy, ctx: ICollisionContext): void {
        const cfg = ENEMY_CONFIGS[enemy.type];
        this.audio.playSound(SoundType.EXPLOSION);

        ctx.player1.score += cfg.score;
        ctx.credits += cfg.credits;
        ctx.profileScore += cfg.score;
        ctx.highScore = Math.max(ctx.highScore, ctx.player1.score);

        ctx.incrementProgress('alien_exterminator', 1);
        if (enemy.diving) {
            ctx.incrementProgress('sharpshooter', 1);
        }

        if (enemy.type === EnemyType.ELITE) {
            ctx.incrementProgress('elite_hunter', 1);
            ctx.incrementProgress('ace_interceptor', 1);
            ctx.incrementProgress('boss_slayer', 1);
        }

        if (ctx.player1.score >= 3000) {
            ctx.unlockAchievement('high_roller');
        }
        if (ctx.player1.score >= 10000) {
            ctx.unlockAchievement('galactic_legend');
        }
        if (ctx.twoPlayerMode && ctx.player1.score + (ctx.player2?.score || 0) >= 2000) {
            ctx.unlockAchievement('wingman_savior');
        }
        if (ctx.credits >= 1000) {
            ctx.unlockAchievement('credit_tycoon');
        }

        this.lootDropService.dropForEnemy(enemy, ctx.powerUps);
    }
}
