import { DifficultyLevel, GameEngineSnapshot, GameState } from '../../types/game';
import { PlayerState } from '../entities/GameEntities';

export interface ISnapshotSource {
    gameState: GameState;
    wave: number;
    credits: number;
    twoPlayerMode: boolean;
    difficultyLevel: DifficultyLevel;
    soundEnabled: boolean;
    particlesEnabled: boolean;
    isAchievementsOpen: boolean;
    highScore: number;
    profileScore: number;
    player1: PlayerState;
    player2: PlayerState | null;
}

type PlayerSnapshot = GameEngineSnapshot['player1'];

function buildPlayerSnapshot(player: PlayerState): PlayerSnapshot {
    return {
        lives: player.lives,
        shield: player.shield,
        shieldLag: player.shieldLag ?? player.shield,
        score: player.score,
        weaponLevel: player.weaponLevel,
        weaponMode: player.weaponMode,
        weaponEnergy: player.weaponEnergy,
        unlockedWeaponModes: [...player.unlockedWeaponModes],
        damageFlash: player.damageFlash ?? 0,
        hitNotice: player.hitNotice,
    };
}

export class SnapshotBuilder {
    public static build(source: ISnapshotSource): GameEngineSnapshot {
        return {
            gameState: source.gameState,
            wave: source.wave,
            credits: source.credits,
            twoPlayerMode: source.twoPlayerMode,
            difficulty: source.difficultyLevel,
            soundEnabled: source.soundEnabled,
            particlesEnabled: source.particlesEnabled,
            isAchievementsOpen: source.isAchievementsOpen,
            highScore: source.highScore,
            profileScore: source.profileScore,
            player1: buildPlayerSnapshot(source.player1),
            player2:
                source.twoPlayerMode && source.player2
                    ? buildPlayerSnapshot(source.player2)
                    : undefined,
        };
    }
}
