import { useMemo } from 'react';
import { useAudioPort } from './AudioPortContext';

export interface UiSound {
    click: () => void;
    hover: () => void;
}

/** Stable UI feedback sounds (click / hover) bound to the current audio port. */
export const useUiSound = (): UiSound => {
    const audio = useAudioPort();
    return useMemo(
        () => ({ click: () => audio.playUiClick(), hover: () => audio.playUiHover() }),
        [audio]
    );
};
