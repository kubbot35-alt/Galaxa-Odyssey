import { PowerUpType, SoundType, WeaponMode } from '../../types/game';
import { MAX_SHIELD, MAX_WEAPON_ENERGY } from '../constants';
import type { PlayerState, PowerUp } from '../entities/GameEntities';
import { removeItem } from '../entities/collections';
import { GameAudioService } from '../audio/GameAudioService';
import type { IGameAudio } from '../audio/IGameAudio';
import type { ICollisionContext } from './CollisionSystem';

export class PowerUpApplicationService {
    constructor(private readonly audio: IGameAudio = new GameAudioService()) {}

    public collectPowerUp(powerUp: PowerUp, player: PlayerState, ctx: ICollisionContext): void {
        if (!removeItem(ctx.powerUps, powerUp)) return;

        ctx.incrementProgress('power_surge', 1);
        ctx.incrementProgress('token_collector', 1);

        if (powerUp.type === PowerUpType.TOKEN_TRIPLE_SHOT) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.TRIPLE_SHOT)) {
                player.unlockedWeaponModes.push(WeaponMode.TRIPLE_SHOT);
            }
            player.weaponMode = WeaponMode.TRIPLE_SHOT;
            player.weaponEnergy = MAX_WEAPON_ENERGY;
            player.isLaserActive = false;
            ctx.weaponAnnouncement = {
                id: 'TRIPLE_SHOT',
                title: '🔱 TRIPLE SHOT ENGAGED!',
                subtitle: '3-Way Angled Fan Cannons Activated',
                color: '#fbbf24',
                timer: 130,
                maxTimer: 130,
            };
            ctx.unlockAchievement('triple_threat');
            this.audio.playSound(SoundType.TOKEN_COLLECT);
        } else if (powerUp.type === PowerUpType.TOKEN_LASER_BEAM) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.LASER_BEAM)) {
                player.unlockedWeaponModes.push(WeaponMode.LASER_BEAM);
            }
            player.weaponMode = WeaponMode.LASER_BEAM;
            player.weaponEnergy = MAX_WEAPON_ENERGY;
            ctx.weaponAnnouncement = {
                id: 'LASER_BEAM',
                title: '⚡ HYPER LASER BEAM ENGAGED!',
                subtitle: 'Piercing Coherent Laser Column Activated',
                color: '#ff37a6',
                timer: 130,
                maxTimer: 130,
            };
            ctx.unlockAchievement('laser_master');
            this.audio.playSound(SoundType.TOKEN_COLLECT);
        } else if (powerUp.type === PowerUpType.TOKEN_PLASMA_SPREAD) {
            if (!player.unlockedWeaponModes.includes(WeaponMode.PLASMA_SPREAD)) {
                player.unlockedWeaponModes.push(WeaponMode.PLASMA_SPREAD);
            }
            player.weaponMode = WeaponMode.PLASMA_SPREAD;
            player.weaponEnergy = MAX_WEAPON_ENERGY;
            player.isLaserActive = false;
            ctx.weaponAnnouncement = {
                id: 'PLASMA_SPREAD',
                title: '🔮 PLASMA SPREAD ENGAGED!',
                subtitle: '5-Way Heavy Disruption Bolts Activated',
                color: '#c084fc',
                timer: 130,
                maxTimer: 130,
            };
            ctx.unlockAchievement('plasma_conduit');
            this.audio.playSound(SoundType.TOKEN_COLLECT);
        } else if (powerUp.type === PowerUpType.SHIELD_BOOST) {
            if (player.shield < 25) {
                ctx.unlockAchievement('shield_sentinel');
            }
            player.shield = MAX_SHIELD;
            ctx.weaponAnnouncement = {
                id: 'SHIELD_RESTORED',
                title: '🛡️ MAXIMUM SHIELD RESTORED',
                subtitle: 'Deflector System Overcharged to 100%',
                color: '#38bdf8',
                timer: 100,
                maxTimer: 100,
            };
            this.audio.playSound(SoundType.POWER_UP);
        } else if (powerUp.type === PowerUpType.EXTRA_LIFE) {
            player.lives += 1;
            ctx.weaponAnnouncement = {
                id: 'EXTRA_LIFE',
                title: '❤️ EXTRA PILOT LIFE ACQUIRED',
                subtitle: 'Hull Backup Unit Online',
                color: '#4ade80',
                timer: 100,
                maxTimer: 100,
            };
            this.audio.playSound(SoundType.POWER_UP);
        } else if (powerUp.type === PowerUpType.WEAPON) {
            player.weaponLevel = Math.min(3, player.weaponLevel + 1);
            if (player.weaponLevel >= 3) {
                ctx.unlockAchievement('full_arsenal');
            }
            ctx.weaponAnnouncement = {
                id: 'CANNON_LEVEL',
                level: player.weaponLevel,
                title: `⭐ CANNON LEVEL ${player.weaponLevel}`,
                subtitle: 'Primary Firepower Tier Upgraded',
                color: '#22d3ee',
                timer: 100,
                maxTimer: 100,
            };
            this.audio.playSound(SoundType.POWER_UP);
        }

        ctx.notifyChange();
    }
}
