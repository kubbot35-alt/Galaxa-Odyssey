import { describe, expect, it } from 'vitest';
import { removeItem, removeWhere, updateAndPrune } from './collections';
import { isInsideBounds } from './EntityTraits';
import { PlayerEntityService } from './player/PlayerEntityService';
import { GAME_WIDTH } from '../constants';

describe('collections', () => {
    it('removeWhere and removeItem mutate in place', () => {
        const list = [1, 2, 3, 4];
        const ref = list;
        removeWhere(list, (n) => n % 2 === 0);
        expect(ref).toEqual([1, 3]);
        expect(removeItem(list, 3)).toBe(true);
        expect(removeItem(list, 99)).toBe(false);
        expect(list).toEqual([1]);
    });

    it('updateAndPrune steps before checking death', () => {
        const items = [{ y: 0 }, { y: 9 }];
        updateAndPrune(items, (i) => { i.y += 2; }, (i) => i.y > 10);
        expect(items).toEqual([{ y: 2 }]);
    });

    it('isInsideBounds is inclusive', () => {
        const b = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
        expect(isInsideBounds({ x: 10, y: 0 }, b)).toBe(true);
        expect(isInsideBounds({ x: 11, y: 0 }, b)).toBe(false);
    });
});

describe('PlayerEntityService facade', () => {
    it('creates a centered single player or two separated players', () => {
        const solo = PlayerEntityService.createPlayers(false, 1, false, false);
        expect(solo.player2).toBeNull();
        const duo = PlayerEntityService.createPlayers(true, 1, true, false);
        expect(duo.player1.lives).toBe(6);
        expect(duo.player1.x).toBeLessThan(duo.player2!.x);
    });

    it('clamps movement to the playfield', () => {
        const p = PlayerEntityService.createPlayer(10, 1, false, false);
        PlayerEntityService.updateMovement(p, true, false, false, false);
        expect(p.x).toBe(10);
        p.x = GAME_WIDTH;
        PlayerEntityService.updateMovement(p, false, true, false, false);
        expect(p.x).toBe(GAME_WIDTH - p.width - 10);
    });

    it('lags the shield bar and expires hit notices', () => {
        const p = PlayerEntityService.createPlayer(10, 1, false, false);
        PlayerEntityService.updateEffectsAndEnergy(p, true);
        p.shield -= 10;
        p.hitNotice = 'x';
        p.hitNoticeTimer = 1;
        PlayerEntityService.updateEffectsAndEnergy(p, true);
        expect(p.shieldLag).toBeCloseTo(p.shield + 8.75);
        expect(p.hitNotice).toBeUndefined();
    });
});
