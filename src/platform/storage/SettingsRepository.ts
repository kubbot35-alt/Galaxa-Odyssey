import type { IKeyValueStorage } from './IKeyValueStorage';
import { InMemoryStorage } from './InMemoryStorage';
import { WebLocalStorage } from './WebLocalStorage';

/** Converts between a stored string and a typed value. decode may throw on corrupt data. */
export interface IStorageCodec<T> {
    encode(value: T): string;
    decode(raw: string): T;
}

export const jsonCodec = <T>(): IStorageCodec<T> => ({
    encode: (value) => JSON.stringify(value),
    decode: (raw) => JSON.parse(raw) as T,
});

export const stringCodec = <T extends string = string>(): IStorageCodec<T> => ({
    encode: (value) => value,
    decode: (raw) => raw as T,
});

/** Typed, fault-tolerant access to one storage key; the store is resolved lazily so it can be swapped. Never throws; falls back to the default. */
export class SettingsRepository<T> {
    constructor(
        private readonly getStore: () => IKeyValueStorage,
        private readonly key: string,
        private readonly defaultValue: () => T,
        private readonly codec: IStorageCodec<T> = jsonCodec<T>()
    ) {}

    public load(): T {
        try {
            const raw = this.getStore().getItem(this.key);
            return raw === null || raw === '' ? this.defaultValue() : this.codec.decode(raw);
        } catch {
            return this.defaultValue();
        }
    }

    public save(value: T): void {
        try {
            this.getStore().setItem(this.key, this.codec.encode(value));
        } catch {
            // Storage failures must never break gameplay.
        }
    }

    public exists(): boolean {
        try {
            return !!this.getStore().getItem(this.key);
        } catch {
            return false;
        }
    }

    public clear(): void {
        try {
            this.getStore().removeItem(this.key);
        } catch {
            // Ignored, see save.
        }
    }
}

let activeStorage: IKeyValueStorage | null = null;

/** Composition-root hook: the app uses web storage unless a platform/test overrides it. */
export const getStorage = (): IKeyValueStorage => {
    activeStorage ??= new WebLocalStorage();
    return activeStorage;
};

export const setStorage = (storage: IKeyValueStorage | null): void => {
    activeStorage = storage;
};

export const installInMemoryStorage = (initial?: Record<string, string>): InMemoryStorage => {
    const storage = new InMemoryStorage(initial);
    activeStorage = storage;
    return storage;
};

