import { EnemyType } from '../../types/game';

/** Row `row` is filled with `type` from `minWave` on; the first matching rule wins. */
export interface EnemyRowRule {
    row: number;
    minWave: number;
    type: EnemyType;
}

export const DEFAULT_ENEMY_ROW_RULES: readonly EnemyRowRule[] = [
    { row: 0, minWave: 2, type: EnemyType.ELITE },
    { row: 1, minWave: 3, type: EnemyType.DIVING },
    { row: 2, minWave: 4, type: EnemyType.SWARM },
];

export const resolveEnemyType = (
    row: number,
    wave: number,
    rules: readonly EnemyRowRule[] = DEFAULT_ENEMY_ROW_RULES
): EnemyType =>
    rules.find((r) => r.row === row && wave >= r.minWave)?.type ?? EnemyType.STANDARD;
