/** Anything with a position on the 2D playfield. */
export interface IPositioned {
    x: number;
    y: number;
}

/** Positioned entity moving with a per-tick velocity. */
export interface IMovable extends IPositioned {
    vx: number;
    vy: number;
}

export interface IDestructible {
    hp: number;
    maxHp: number;
}

/** Entity that expires after a number of ticks. */
export interface IExpiring {
    life: number;
    maxLife: number;
}

export interface IBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export const isInsideBounds = (e: IPositioned, b: IBounds): boolean =>
    e.x >= b.minX && e.x <= b.maxX && e.y >= b.minY && e.y <= b.maxY;
