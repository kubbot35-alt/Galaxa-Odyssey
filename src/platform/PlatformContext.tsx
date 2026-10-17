import React, { createContext, useContext, useMemo } from 'react';
import { createWebPlatform, type PlatformServices } from './PlatformServices';
import { AudioPortProvider } from './audio/AudioPortContext';

const PlatformContext = createContext<PlatformServices | null>(null);

/** Single composition point for the UI tree: provides the platform and its audio port. */
export const PlatformProvider: React.FC<React.PropsWithChildren<{ platform?: PlatformServices }>> = ({ platform, children }) => {
    const value = useMemo(() => platform ?? createWebPlatform(), [platform]);
    return (
        <PlatformContext.Provider value={value}>
            <AudioPortProvider port={value.audio}>{children}</AudioPortProvider>
        </PlatformContext.Provider>
    );
};

export const usePlatform = (): PlatformServices => {
    const platform = useContext(PlatformContext);
    if (!platform) throw new Error('usePlatform must be used inside PlatformProvider');
    return platform;
};
