import React, { createContext, useContext } from 'react';
import type { IAudioPort } from './IAudioPort';
import { WebAudioPort } from './WebAudioPort';

const defaultPort: IAudioPort = new WebAudioPort();

const AudioPortContext = createContext<IAudioPort>(defaultPort);

/** Supplies the platform audio implementation; without it the Web Audio port is used. */
export const AudioPortProvider: React.FC<React.PropsWithChildren<{ port: IAudioPort }>> = ({ port, children }) => (
    <AudioPortContext.Provider value={port}>{children}</AudioPortContext.Provider>
);

export const useAudioPort = (): IAudioPort => useContext(AudioPortContext);
