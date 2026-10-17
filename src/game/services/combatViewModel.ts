import type { GameState, WeaponMode } from '../../types/game';
import { MAX_SHIELD, MAX_WEAPON_ENERGY } from '../constants';
import type { PlayerState, WeaponAnnouncement } from '../entities/GameEntities';

/** Minimal read-only contract the combat HUD needs from a game engine. */
export interface CombatEngineSource {
    gameState: GameState;
    wave: number;
    credits: number;
    twoPlayerMode: boolean;
    weaponAnnouncement: WeaponAnnouncement | null;
    player1: PlayerState;
    player2: PlayerState | null;
}

export interface CombatViewModel {
    gameState: GameState;
    wave: number;
    credits: number;
    score: number;
    lives: number;
    shield: number;
    maxShield: number;
    weaponEnergy: number;
    maxWeaponEnergy: number;
    weaponMode: WeaponMode;
    unlockedWeaponModes: WeaponMode[];
    bankAngle: number;
    hitNotice?: string;
    weaponAnnouncement: WeaponAnnouncement | null;
    player2: { lives: number } | null;
}

export function selectCombatViewModel(engine: CombatEngineSource): CombatViewModel {
    const p1 = engine.player1;

    return {
        gameState: engine.gameState,
        wave: engine.wave,
        credits: engine.credits,
        score: p1.score,
        lives: p1.lives,
        shield: p1.shield,
        maxShield: MAX_SHIELD,
        weaponEnergy: p1.weaponEnergy,
        maxWeaponEnergy: MAX_WEAPON_ENERGY,
        weaponMode: p1.weaponMode,
        unlockedWeaponModes: p1.unlockedWeaponModes,
        bankAngle: p1.movingLeft ? -0.35 : p1.movingRight ? 0.35 : 0,
        hitNotice: p1.hitNotice,
        weaponAnnouncement: engine.weaponAnnouncement,
        player2: engine.twoPlayerMode && engine.player2 ? { lives: engine.player2.lives } : null,
    };
}
