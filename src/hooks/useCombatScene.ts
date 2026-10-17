import { useEffect, useRef } from 'react';
import { SpaceCombat3DScene } from '../rendering/three/SpaceCombat3DScene';
import type { ShipSkinId } from '../config/visuals/hangarVisuals';
import type { SupportedLocale } from '../config/content/locales';

/** Owns the lifecycle of the Three.js combat scene attached to the returned container ref. */
export function useCombatScene(selectedSkin: ShipSkinId, locale: SupportedLocale) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<SpaceCombat3DScene | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new SpaceCombat3DScene(container, selectedSkin);
        sceneRef.current = scene;

        const ro = new ResizeObserver(() => {
            window.dispatchEvent(new Event('resize'));
        });
        ro.observe(container);

        return () => {
            ro.disconnect();
            scene.dispose();
            sceneRef.current = null;
        };
    }, [selectedSkin]);

    useEffect(() => {
        sceneRef.current?.setLocale(locale);
    }, [locale]);

    return { containerRef, sceneRef };
}
