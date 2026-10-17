import { useEffect } from 'react';

export function useIntroKeyboardShortcuts(onSkip: () => void, onLaunchImmediate?: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        (onLaunchImmediate ?? onSkip)();
      } else if (event.code === 'Space' || event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLaunchImmediate, onSkip]);
}
