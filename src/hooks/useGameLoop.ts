import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';

const TICK_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/**
 * Fixed-timestep simulation (60 ticks/s, independent of display refresh rate)
 * with a separate per-frame render callback.
 */
export function useGameLoop(engine: GameEngine, onRender: (engine: GameEngine) => void): void {
    const onRenderRef = useRef(onRender);
    onRenderRef.current = onRender;

    useEffect(() => {
        let animId = 0;
        let last = performance.now();
        let accumulator = 0;

        const frame = (now: number) => {
            accumulator += Math.min(now - last, TICK_MS * MAX_STEPS_PER_FRAME);
            last = now;

            while (accumulator >= TICK_MS) {
                engine.update();
                accumulator -= TICK_MS;
            }

            onRenderRef.current(engine);
            animId = requestAnimationFrame(frame);
        };

        animId = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(animId);
    }, [engine]);
}
