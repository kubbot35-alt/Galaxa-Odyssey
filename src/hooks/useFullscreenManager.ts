import { useCallback, useEffect, useState } from 'react';

export const useFullscreenManager = (disabled: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  );

  const toggleFullscreen = useCallback(() => {
    const transition = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();

    void transition
      .then(() => setIsFullscreen(Boolean(document.fullscreenElement)))
      .catch((error: unknown) => {
        console.error('Unable to change fullscreen mode.', error);
      });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !disabled &&
        (event.key === 'f' || event.key === 'F') &&
        !event.repeat &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, toggleFullscreen]);

  return { isFullscreen, toggleFullscreen };
};
