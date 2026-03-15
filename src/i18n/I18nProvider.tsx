import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { strings, type StringKey } from './strings';

type Locale = 'en' | 'he';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: StringKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const LOCALE_KEY = 'greencheck.locale';

function detectLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  if (deviceLocale === 'he' || deviceLocale === 'iw') return 'he';
  return 'en';
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    void (async () => {
      try {
        I18nManager.allowRTL(true);
      } catch {
        // no-op
      }

      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        const initial = saved === 'en' || saved === 'he' ? saved : detectLocale();
        setLocaleState(initial);

        // keep direction aligned when possible (mainly native)
        if (Platform.OS !== 'web') {
          const wantRTL = initial === 'he';
          if (I18nManager.isRTL !== wantRTL) {
            I18nManager.forceRTL(wantRTL);
          }
        }
      } catch {
        setLocaleState(detectLocale());
      }
    })();
  }, []);

  async function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    await AsyncStorage.setItem(LOCALE_KEY, newLocale);

    if (Platform.OS !== 'web') {
      try {
        const wantRTL = newLocale === 'he';
        if (I18nManager.isRTL !== wantRTL) {
          I18nManager.forceRTL(wantRTL);
        }
      } catch {
        // no-op
      }
    }
  }

  function t(key: StringKey, params?: Record<string, string | number>): string {
    const translation: string = strings[key]?.[locale] ?? strings[key]?.en ?? key;
    if (!params) return translation;

    let result = translation;
    for (const [param, value] of Object.entries(params)) {
      result = result.replace(`{${param}}`, String(value));
    }
    return result;
  }

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'en',
      setLocale: async () => {},
      t: (key: StringKey) => String(key),
    };
  }
  return context;
}
