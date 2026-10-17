import { soundEngine } from './soundEngine';
import type { SoundType } from '../../types/game';
import type { IGameAudio } from './IGameAudio';

export class GameAudioService implements IGameAudio {
    public playSound(type: SoundType): void {
        soundEngine.playSound(type);
    }

    public setEnabled(enabled: boolean): void {
        soundEngine.setSoundEnabled(enabled);
    }

    public startMenuMusic(): void {
        soundEngine.startMenuMusic();
    }

    public stopMenuMusic(): void {
        soundEngine.stopMenuMusic();
    }
}
