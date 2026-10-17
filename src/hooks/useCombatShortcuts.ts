import { useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState } from '../types/game';
import { useUiSound } from '../platform/audio/useUiSound';

interface CombatShortcutsOptions {
    engine: GameEngine;
    onStateUpdate: () => void;
    onToggleView: () => void;
    onToggleRadar: () => void;
    onReturnToHangar?: () => void;
    onToggleFullscreen?: () => void;
}

/** UI/view keyboard shortcuts and pause/menu flow keys for the combat screen. */
export function useCombatShortcuts({
    engine,
    onStateUpdate,
    onToggleView,
    onToggleRadar,
    onReturnToHangar,
    onToggleFullscreen,
}: CombatShortcutsOptions): void {
    const ui = useUiSound();
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (engine.isAchievementsOpen) {
                if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
                    engine.closeAchievements();
                    onStateUpdate();
                }
                return;
            }

            if (engine.gameState === GameState.PLAYING) {
                if (e.key === 'v' || e.key === 'V') {
                    onToggleView();
                } else if (e.key === 'r' || e.key === 'R') {
                    ui.click();
                    onToggleRadar();
                } else if ((e.key === 'f' || e.key === 'F') && !engine.twoPlayerMode) {
                    onToggleFullscreen?.();
                }
            }

            if (e.key === 'Escape') {
                if (engine.gameState === GameState.PLAYING) {
                    engine.pauseGame();
                    onStateUpdate();
                } else if (engine.gameState === GameState.PAUSED) {
                    engine.resumeGame();
                    onStateUpdate();
                }
            }

            if (e.key === 'Enter') {
                if (engine.gameState === GameState.PAUSED) {
                    engine.resumeGame();
                    onStateUpdate();
                } else if (engine.gameState === GameState.GAMEOVER) {
                    if (onReturnToHangar) onReturnToHangar();
                    else engine.returnToMenu();
                    onStateUpdate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [engine, onStateUpdate, onToggleView, onToggleRadar, onReturnToHangar, onToggleFullscreen]);
}
