import { EnemyType, PowerUpType, WeaponMode } from '../../types/game';
import type { IDestructible, IExpiring, IMovable, IPositioned } from './EntityTraits';
import type { WeaponAnnouncementId } from '../combatText';

export interface Star extends IPositioned {
    size: number;
    speed: number;
}

export interface Bullet extends IMovable {
    isFromPlayer: boolean;
    color?: string;
    size?: number;
}

export interface Bomb extends IPositioned {
    speed: number;
}

export interface Enemy extends IPositioned, IDestructible {
    startX: number;
    startY: number;
    angle: number;
    type: EnemyType;
    diving: boolean;
}

export interface PowerUp extends IPositioned {
    type: PowerUpType;
    bobAngle: number;
    speed: number;
}

export interface Particle extends IMovable, IExpiring {
    r: number;
    g: number;
    b: number;
    size: number;
}

export interface PlayerState extends IPositioned {
    width: number;
    height: number;
    lives: number;
    maxLives?: number;
    shield: number;
    score: number;
    weaponLevel: number;
    weaponMode: WeaponMode;
    unlockedWeaponModes: WeaponMode[];
    weaponEnergy: number;
    isLaserActive?: boolean;
    movingLeft: boolean;
    movingRight: boolean;
    movingUp?: boolean;
    movingDown?: boolean;
    lastHitTime?: number;
    recentDamageTaken?: number;
    damageFlash?: number;
    shieldLag?: number;
    hitNotice?: string;
    hitNoticeTimer?: number;
}

export interface WeaponAnnouncement {
    id?: WeaponAnnouncementId;
    level?: number;
    title: string;
    subtitle: string;
    color: string;
    timer: number;
    maxTimer: number;
}

export { PlayerEntityService } from './player/PlayerEntityService';
