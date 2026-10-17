/** In-place removal helpers; arrays are shared by reference with the engine, so they are never reallocated. */

/** Removes every item matching the predicate. */
export function removeWhere<T>(list: T[], predicate: (item: T) => boolean): void {
    for (let i = list.length - 1; i >= 0; i--) {
        if (predicate(list[i])) list.splice(i, 1);
    }
}

/** Removes one item by reference; returns whether it was present. */
export function removeItem<T>(list: T[], item: T): boolean {
    const index = list.indexOf(item);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
}

/**
 * Advances each item with `step`, then drops those matching `isDead` (checked after the step).
 * Single backwards pass keeps indices valid while removing.
 */
export function updateAndPrune<T>(list: T[], step: (item: T) => void, isDead: (item: T) => boolean): void {
    for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        step(item);
        if (isDead(item)) list.splice(i, 1);
    }
}
