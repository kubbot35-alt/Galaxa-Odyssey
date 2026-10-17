import type { IKeyValueStorage } from './IKeyValueStorage';

/** Volatile storage for tests, SSR and platforms without persistence. */
export class InMemoryStorage implements IKeyValueStorage {
    private readonly data = new Map<string, string>();

    constructor(initial: Record<string, string> = {}) {
        for (const [key, value] of Object.entries(initial)) this.data.set(key, value);
    }

    public getItem(key: string): string | null {
        return this.data.get(key) ?? null;
    }

    public setItem(key: string, value: string): void {
        this.data.set(key, value);
    }

    public removeItem(key: string): void {
        this.data.delete(key);
    }

    public clear(): void {
        this.data.clear();
    }
}
