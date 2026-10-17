import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { CloneWarsHangar3D } from './CloneWarsHangar3D';

const fakeContext = new Proxy(
    {},
    {
        get: (_target, prop) => (prop === 'createLinearGradient' || prop === 'createRadialGradient'
            ? () => ({ addColorStop: () => undefined })
            : () => undefined),
        set: () => true,
    }
);

describe('CloneWarsHangar3D', () => {
    beforeAll(() => {
        vi.stubGlobal('document', {
            createElement: () => ({ width: 0, height: 0, getContext: () => fakeContext }),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('exposes the scene graph and dimensions', () => {
        const hangar = new CloneWarsHangar3D();
        expect(hangar.getMesh()).toBe(hangar.mesh);
        expect(hangar.getLandingPad().parent).toBe(hangar.getMesh());
        expect(hangar.getExitGateZ()).toBe(25);
        hangar.dispose();
    });

    it('opens the gate and aligns the pad through the animator', () => {
        const hangar = new CloneWarsHangar3D();
        expect(hangar.isGateCleared()).toBe(false);
        hangar.setGateOpen(true);
        hangar.update(0.6, false);
        expect(hangar.isGateCleared()).toBe(true);

        hangar.getLandingPad().rotation.y = 1;
        expect(hangar.alignPadToForward(0.01)).toBe(false);
        for (let i = 0; i < 100; i++) hangar.alignPadToForward(0.1);
        expect(hangar.getLandingPad().rotation.y).toBe(0);
        hangar.dispose();
    });

    it('disposes every resource exactly once and ignores updates afterwards', () => {
        const counts = new Map<object, number>();
        for (const proto of [THREE.BufferGeometry.prototype, THREE.Material.prototype, THREE.Texture.prototype]) {
            const original = proto.dispose;
            vi.spyOn(proto, 'dispose').mockImplementation(function (this: object) {
                counts.set(this, (counts.get(this) ?? 0) + 1);
                original.call(this);
            });
        }

        const hangar = new CloneWarsHangar3D();
        hangar.dispose();
        hangar.dispose();

        expect(counts.size).toBeGreaterThan(0);
        for (const n of counts.values()) expect(n).toBe(1);
        expect(hangar.getMesh().children).toHaveLength(0);
        expect(() => hangar.update(0.016)).not.toThrow();
    });
});
