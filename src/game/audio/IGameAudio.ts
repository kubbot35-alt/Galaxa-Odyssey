import type { SoundType } from '../../types/game';

export interface IGameAudio {
    playSound(type: SoundType): void;
    setEnabled(enabled: boolean): void;
    startMenuMusic(): void;
    stopMenuMusic(): void;
}
