import { SoundType, WeaponMode } from '../../types/game';
import { Bullet, PlayerState } from '../entities/GameEntities';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import { createDefaultWeaponRegistry, type WeaponRegistry } from '../weapons/WeaponRegistry';

export class WeaponSystem {
    public fireCooldown = 0;
    public secondPlayerFireCooldown = 0;

    constructor(
        private readonly audio: IGameAudio = new GameAudioService(),
        private readonly weapons: WeaponRegistry = createDefaultWeaponRegistry()
    ) {}

    public setWeaponMode(player: PlayerState, mode: WeaponMode): boolean {
        if (player.unlockedWeaponModes.includes(mode)) {
            player.weaponMode = mode;
            player.isLaserActive = false;
            return true;
        }
        return false;
    }

    public cycleWeaponMode(player: PlayerState, direction: 1 | -1 = 1): boolean {
        const modes = player.unlockedWeaponModes;
        if (modes.length <= 1) return false;

        const currIdx = modes.indexOf(player.weaponMode);
        const nextIdx = (currIdx + direction + modes.length) % modes.length;
        player.weaponMode = modes[nextIdx];
        player.isLaserActive = false;
        this.audio.playSound(SoundType.SHOOT);
        return true;
    }

    public firePlayer1(player: PlayerState, bullets: Bullet[]): void {
        if (player.lives <= 0) return;

        player.isLaserActive = false;
        const cooldown = this.weapons[player.weaponMode].fire({ player, bullets, audio: this.audio });
        if (cooldown !== undefined) this.fireCooldown = cooldown;
    }

    public firePlayer2(player2: PlayerState | null, bullets: Bullet[]): void {
        if (!player2 || player2.lives <= 0) return;
        this.secondPlayerFireCooldown = this.weapons[WeaponMode.STANDARD].fire({
            player: player2,
            bullets,
            audio: this.audio,
        }) ?? 0;
    }
}
