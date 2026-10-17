import type { IKeyValueStorage } from './IKeyValueStorage';

/** Browser localStorage adapter; degrades to a no-op when storage is unavailable or throws. */
export class WebLocalStorage implements IKeyValueStorage {
    private get store(): Storage | null {
        try {
            return typeof localStorage === 'undefined' ? null : localStorage;
        } catch {
            return null;
        }
    }

    public getItem(key: string): string | null {
        try {
            return this.store?.getItem(key) ?? null;
        } catch {
            return null;
        }
    }

    public setItem(key: string, value: string): void {
        try {
            this.store?.setItem(key, value);
        } catch {
            // Quota or privacy-mode errors are intentionally ignored.
        }
    }

    public removeItem(key: string): void {
        try {
            this.store?.removeItem(key);
        } catch {
            // Ignored, see setItem.
        }
    }
}
