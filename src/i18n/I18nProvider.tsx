import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { strings, type StringKey } from './strings';

type Locale = 'en' | 'he';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: StringKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  if (deviceLocale === 'he' || deviceLocale === 'iw') {
    return 'he';
  }
  return 'en';
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    I18nManager.allowRTL(true);
    const detected = detectLocale();
    setLocaleState(detected);
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    const isRTL = newLocale === 'he';
    I18nManager.forceRTL(isRTL);
  }

  function t(key: StringKey, params?: Record<string, string | number>): string {
    const translation = strings[key]?.[locale] ?? strings[key]?.en ?? key;
    if (!params) return translation;

    let result = translation;
    for (const [param, value] of Object.entries(params)) {
      result = result.replace(`{${param}}`, String(value));
    }
    return result;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
