import { WeaponMode } from '../../types/game';
import { PlayerEntityService, PlayerState } from '../entities/GameEntities';
import type { IPlayerIntentProvider } from '../input/IInputSource';

export interface IPlayerControlContext {
    player1: PlayerState;
    player2: PlayerState | null;
    twoPlayerMode: boolean;
    spaceHeld: boolean;
    secondPlayerFireHeld: boolean;
    fireCooldown: number;
    secondPlayerFireCooldown: number;
    firePlayer1: () => void;
    firePlayer2: () => void;
}

/** Ruch, efekty i auto-ogień graczy w pojedynczej klatce. */
export class PlayerController {
    constructor(private readonly input: IPlayerIntentProvider) {}

    public update(ctx: IPlayerControlContext): void {
        this.updatePlayer1(ctx);
        this.updatePlayer2(ctx);
    }

    private updatePlayer1(ctx: IPlayerControlContext): void {
        const p1 = ctx.player1;
        const intent = this.input.getIntent(1);
        PlayerEntityService.updateMovement(p1, intent.moveX < 0, intent.moveX > 0, intent.moveY > 0, intent.moveY < 0);
        PlayerEntityService.updateEffectsAndEnergy(p1, true);

        if (ctx.fireCooldown > 0) ctx.fireCooldown--;
        const isFiring = intent.fire || ctx.spaceHeld;
        if (isFiring && p1.lives > 0) {
            if (p1.weaponMode === WeaponMode.LASER_BEAM || ctx.fireCooldown === 0) {
                ctx.firePlayer1();
            }
        } else {
            p1.isLaserActive = false;
        }
    }

    private updatePlayer2(ctx: IPlayerControlContext): void {
        const p2 = ctx.player2;
        if (!ctx.twoPlayerMode || !p2 || p2.lives <= 0) return;

        const intent = this.input.getIntent(2);
        PlayerEntityService.updateMovement(p2, intent.moveX < 0, intent.moveX > 0, intent.moveY > 0, intent.moveY < 0);
        PlayerEntityService.updateEffectsAndEnergy(p2, false);

        if (ctx.secondPlayerFireCooldown > 0) ctx.secondPlayerFireCooldown--;
        const isFiring = intent.fire || ctx.secondPlayerFireHeld;
        if (isFiring && ctx.secondPlayerFireCooldown === 0) {
            ctx.firePlayer2();
        }
    }
}
