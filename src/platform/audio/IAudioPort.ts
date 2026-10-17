import type { SoundType } from '../../types/game';
import type { IGameAudio } from '../../game/audio/IGameAudio';

/** Full audio contract (gameplay + UI + ambience); superset of IGameAudio. */
export interface IAudioPort extends IGameAudio {
    isEnabled(): boolean;
    resume(): Promise<void>;
    playUiHover(): void;
    playUiClick(): void;
    playWarpJump(): void;
    playTargetAcquiringBeep(): void;
    playTargetLockedAlert(): void;
    playCinematicIntroSoundscape(): void;
    stopCinematicIntroSoundscape(): void;
    startHangarAmbience(): void;
    stopHangarAmbience(): void;
    playSound(type: SoundType): void;
}
