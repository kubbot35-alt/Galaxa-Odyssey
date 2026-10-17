import { soundEngine, type ISoundEngine } from '../../game/audio/soundEngine';
import type { SoundType } from '../../types/game';
import type { IAudioPort } from './IAudioPort';

/** Web Audio implementation delegating to the sound engine. */
export class WebAudioPort implements IAudioPort {
    constructor(private readonly engine: ISoundEngine = soundEngine) {}

    public setEnabled(enabled: boolean): void { this.engine.setSoundEnabled(enabled); }
    public isEnabled(): boolean { return this.engine.isSoundEnabled(); }
    public resume(): Promise<void> { return this.engine.resumeContext(); }
    public playSound(type: SoundType): void { this.engine.playSound(type); }
    public startMenuMusic(): void { this.engine.startMenuMusic(); }
    public stopMenuMusic(): void { this.engine.stopMenuMusic(); }
    public playUiHover(): void { this.engine.playUiHover(); }
    public playUiClick(): void { this.engine.playUiClick(); }
    public playWarpJump(): void { this.engine.playWarpJump(); }
    public playTargetAcquiringBeep(): void { this.engine.playTargetAcquiringBeep(); }
    public playTargetLockedAlert(): void { this.engine.playTargetLockedAlert(); }
    public playCinematicIntroSoundscape(): void { this.engine.playCinematicIntroSoundscape(); }
    public stopCinematicIntroSoundscape(): void { this.engine.stopCinematicIntroSoundscape(); }
    public startHangarAmbience(): void { this.engine.startHangarAmbience(); }
    public stopHangarAmbience(): void { this.engine.stopHangarAmbience(); }
}
