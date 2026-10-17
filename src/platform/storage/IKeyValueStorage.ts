/** Synchronous string key-value store; the platform boundary for persistence. */
export interface IKeyValueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
