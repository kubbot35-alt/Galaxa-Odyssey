import { describe, it, expect } from 'vitest';

describe('Smoke test środowiska', () => {
    it('powinien poprawnie wykonać podstawową asercję', () => {
        expect(1 + 1).toBe(2);
    });
});