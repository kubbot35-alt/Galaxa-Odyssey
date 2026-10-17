import type { Bullet, PlayerState } from '../entities/GameEntities';
import type { IGameAudio } from '../audio/IGameAudio';

export interface WeaponFireContext {
    player: PlayerState;
    bullets: Bullet[];
    audio: IGameAudio;
}

/** One firing mode. Returns the cooldown (ticks) to apply, or undefined to leave the cooldown untouched. */
export interface IWeaponStrategy {
    fire(ctx: WeaponFireContext): number | undefined;
}
