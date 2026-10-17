import type { SoundType } from '../../types/game';
import type { IAudioPort } from './IAudioPort';

/** Silent audio that records every call; for tests and headless platforms. */
export class InMemoryAudioPort implements IAudioPort {
    public readonly calls: Array<{ method: string; args: unknown[] }> = [];
    private enabled = true;

    private record(method: string, ...args: unknown[]): void {
        this.calls.push({ method, args });
    }

    public callsTo(method: string): number {
        return this.calls.filter((c) => c.method === method).length;
    }

    public setEnabled(enabled: boolean): void { this.enabled = enabled; this.record('setEnabled', enabled); }
    public isEnabled(): boolean { return this.enabled; }
    public resume(): Promise<void> { this.record('resume'); return Promise.resolve(); }
    public playSound(type: SoundType): void { this.record('playSound', type); }
    public startMenuMusic(): void { this.record('startMenuMusic'); }
    public stopMenuMusic(): void { this.record('stopMenuMusic'); }
    public playUiHover(): void { this.record('playUiHover'); }
    public playUiClick(): void { this.record('playUiClick'); }
    public playWarpJump(): void { this.record('playWarpJump'); }
    public playTargetAcquiringBeep(): void { this.record('playTargetAcquiringBeep'); }
    public playTargetLockedAlert(): void { this.record('playTargetLockedAlert'); }
    public playCinematicIntroSoundscape(): void { this.record('playCinematicIntroSoundscape'); }
    public stopCinematicIntroSoundscape(): void { this.record('stopCinematicIntroSoundscape'); }
    public startHangarAmbience(): void { this.record('startHangarAmbience'); }
    public stopHangarAmbience(): void { this.record('stopHangarAmbience'); }
}
