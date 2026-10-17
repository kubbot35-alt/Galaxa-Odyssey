import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    DEFAULT_LOCALE,
    isSupportedLocale,
    LOCALE_STORAGE_KEY,
    LOCALES,
    type SupportedLocale,
    type TranslationSchema,
} from './index';
import { getStorage, SettingsRepository, stringCodec } from '../../../platform/storage/SettingsRepository';

interface LocaleContextValue {
    locale: SupportedLocale;
    setLocale: (locale: SupportedLocale) => void;
    t: TranslationSchema;
}

const localeRepo = new SettingsRepository<string | null>(getStorage, LOCALE_STORAGE_KEY, () => null, stringCodec<string>());

const LocaleContext = createContext<LocaleContextValue | null>(null);

const readStoredLocale = (): SupportedLocale => {
    const storedLocale = localeRepo.load();
    return isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
};

export const LocaleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [locale, setLocaleState] = useState<SupportedLocale>(readStoredLocale);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = (nextLocale: SupportedLocale) => {
        localeRepo.save(nextLocale);
        setLocaleState(nextLocale);
    };

    const t = LOCALES[locale];

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
};

export const useLocale = (): LocaleContextValue => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};
