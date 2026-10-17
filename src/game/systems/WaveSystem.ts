import {
    DifficultyLevel,
    DIFFICULTY_CONFIGS,
    ENEMY_CONFIGS,
} from '../../types/game';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    ENEMY_WIDTH,
    ENEMY_HEIGHT,
} from '../constants';
import { Bomb, Bullet, Enemy, PowerUp } from '../entities/GameEntities';
import { updateAndPrune } from '../entities/collections';
import { isInsideBounds, type IBounds } from '../entities/EntityTraits';
import {
    DEFAULT_WAVE_ACHIEVEMENT_RULES,
    type IAchievementRule,
    type IAchievementSink,
} from '../waves/WaveAchievementRules';
import { DEFAULT_ENEMY_ROW_RULES, resolveEnemyType, type EnemyRowRule } from '../waves/EnemyRowRules';

const BULLET_MARGIN = 20;
const BULLET_BOUNDS: IBounds = {
    minX: -BULLET_MARGIN,
    maxX: GAME_WIDTH + BULLET_MARGIN,
    minY: -BULLET_MARGIN,
    maxY: GAME_HEIGHT + BULLET_MARGIN,
};

export interface WaveAchievementEvaluationParams {
    completedWave: number;
    difficultyLevel: DifficultyLevel;
    tookDamageInCurrentWave: boolean;
    player1Lives: number;
    currentWaveDuration: number;
    unlockAchievement: (id: string) => void;
    incrementProgress: (id: string, amount?: number) => void;
}

export class WaveSystem {
    constructor(
        private readonly achievementRules: readonly IAchievementRule[] = DEFAULT_WAVE_ACHIEVEMENT_RULES,
        private readonly enemyRowRules: readonly EnemyRowRule[] = DEFAULT_ENEMY_ROW_RULES
    ) {}

    public evaluateWaveAchievements(params: WaveAchievementEvaluationParams): void {
        const { unlockAchievement, incrementProgress, ...ctx } = params;
        if (ctx.completedWave < 1) return;

        const sink: IAchievementSink = { unlock: unlockAchievement, increment: incrementProgress };
        for (const rule of this.achievementRules) rule.apply(ctx, sink);
    }

    public createWaveEnemies(wave: number, difficultyLevel: DifficultyLevel): Enemy[] {
        const diff = DIFFICULTY_CONFIGS[difficultyLevel];
        const rows = Math.max(1, Math.min(5, 2 + Math.floor(wave / 2) + diff.additionalRows));

        const cols = 8;
        const spacingX = 64;
        const spacingY = 48;
        const startX = (GAME_WIDTH - cols * spacingX) / 2 + spacingX / 2;
        const startY = 80;

        const enemies: Enemy[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const type = resolveEnemyType(r, wave, this.enemyRowRules);
                const config = ENEMY_CONFIGS[type];
                const hp = config?.hp ?? 1;
                enemies.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    startX: startX + c * spacingX,
                    startY: startY + r * spacingY,
                    angle: 0,
                    type,
                    diving: false,
                    hp,
                    maxHp: hp,
                });
            }
        }
        return enemies;
    }

    public updateBullets(bullets: Bullet[]): void {
        updateAndPrune(
            bullets,
            (b) => {
                b.x += b.vx || 0;
                b.y += b.vy;
            },
            (b) => !isInsideBounds(b, BULLET_BOUNDS)
        );
    }

    public updateEnemiesAndFire(
        enemies: Enemy[],
        bullets: Bullet[],
        wave: number,
        difficultyLevel: DifficultyLevel
    ): void {
        const diff = DIFFICULTY_CONFIGS[difficultyLevel];

        for (const e of enemies) {
            e.angle += 0.04;
            e.x = e.startX + Math.sin(e.angle) * (42 + wave * 2);

            if (!e.diving && Math.random() < 0.001 + wave * 0.0003) {
                e.diving = true;
            }

            if (e.diving) {
                const typeCfg = ENEMY_CONFIGS[e.type];
                e.y += (2.6 + typeCfg.difficulty * 0.6 + Math.min(1.5, wave * 0.08)) * diff.enemySpeedMultiplier;
                e.x += Math.sin(e.angle * 2.5) * (1.8 + Math.min(1.2, wave * 0.05)) * diff.enemySpeedMultiplier;
                if (e.y > 620) {
                    e.y = e.startY;
                    e.x = e.startX;
                    e.diving = false;
                }
            } else {
                e.y += Math.min(0.14, 0.025 + wave * 0.004) * diff.enemySpeedMultiplier;
            }
        }

        const enemyFireChance = Math.min(0.012, (0.0025 + wave * 0.0007) * diff.enemyFireMultiplier);
        for (const e of enemies) {
            if (Math.random() < enemyFireChance) {
                bullets.push({
                    x: e.x + ENEMY_WIDTH / 2,
                    y: e.y + ENEMY_HEIGHT,
                    vx: 0,
                    vy: 5 + diff.enemySpeedMultiplier,
                    isFromPlayer: false,
                });
            }
        }
    }

    public updateBombs(bombs: Bomb[], wave: number, difficultyLevel: DifficultyLevel): void {
        const diff = DIFFICULTY_CONFIGS[difficultyLevel];
        const bombChance = Math.min(0.012, (0.0002 + wave * 0.00008) * diff.bombChanceMultiplier);

        if (Math.random() < bombChance) {
            bombs.push({
                x: 30 + Math.random() * (GAME_WIDTH - 60),
                y: -30,
                speed: Math.round((3 + Math.min(3, wave / 5)) * diff.bombSpeedMultiplier),
            });
        }

        updateAndPrune(
            bombs,
            (bomb) => {
                bomb.y += bomb.speed;
            },
            (bomb) => bomb.y > GAME_HEIGHT + 40
        );
    }

    public updatePowerUps(powerUps: PowerUp[]): void {
        updateAndPrune(
            powerUps,
            (p) => {
                p.bobAngle += 0.05;
                p.x += Math.sin(p.bobAngle) * 0.6;
                p.y += p.speed;
            },
            (p) => p.y > GAME_HEIGHT + 30
        );
    }
}