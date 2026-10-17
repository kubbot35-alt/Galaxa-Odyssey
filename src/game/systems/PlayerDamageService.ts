import { DIFFICULTY_CONFIGS, SoundType } from '../../types/game';
import { MAX_SHIELD } from '../constants';
import type { PlayerState } from '../entities/GameEntities';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import type { ICollisionContext } from './CollisionSystem';
import { HIT_NOTICE } from '../combatText';

export class PlayerDamageService {
    constructor(private readonly audio: IGameAudio = new GameAudioService()) {}

    public calculateDamage(ctx: ICollisionContext): number {
        const difficulty = DIFFICULTY_CONFIGS[ctx.difficultyLevel];
        return Math.max(
            1,
            Math.round(Math.min(70, 40 + Math.floor(ctx.wave / 3)) * difficulty.damageMultiplier)
        );
    }

    public damagePlayer(player: PlayerState, damage: number, ctx: ICollisionContext): void {
        ctx.tookDamageInCurrentWave = true;
        player.lastHitTime = Date.now();
        player.recentDamageTaken = damage;
        player.damageFlash = 1.0;

        if (ctx.infiniteLives) {
            player.shield = MAX_SHIELD;
            player.hitNotice = HIT_NOTICE.SHIELD_DEFLECTED;
            player.hitNoticeTimer = 40;
            return;
        }

        if (player.shield > 0) {
            player.shield = Math.max(0, player.shield - damage);
            player.hitNotice = HIT_NOTICE.shieldDamage(damage);
            player.hitNoticeTimer = 45;
            return;
        }

        player.lives -= 1;
        player.shield = MAX_SHIELD;
        player.hitNotice = HIT_NOTICE.CRITICAL_HULL_HIT;
        player.hitNoticeTimer = 60;
        ctx.addExplosion(player.x + 20, player.y + 20, 80, 210, 255, 32);
        this.audio.playSound(SoundType.EXPLOSION);
    }
}
