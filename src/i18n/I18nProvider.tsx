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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      I18nManager.allowRTL(true);
    } catch (error) {
      console.warn('I18nManager.allowRTL failed:', error);
    }
    
    try {
      const detected = detectLocale();
      setLocaleState(detected);
    } catch (error) {
      console.warn('Locale detection failed, using English:', error);
    }
    
    setInitialized(true);
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    try {
      const isRTL = newLocale === 'he';
      I18nManager.forceRTL(isRTL);
    } catch (error) {
      console.warn('I18nManager.forceRTL failed:', error);
    }
  }

  function t(key: StringKey, params?: Record<string, string | number>): string {
    try {
      const translation = strings[key]?.[locale] ?? strings[key]?.en ?? key;
      if (!params) return translation;

      let result = translation;
      for (const [param, value] of Object.entries(params)) {
        result = result.replace(`{${param}}`, String(value));
      }
      return result;
    } catch (error) {
      console.warn('Translation failed for key:', key, error);
      return String(key);
    }
  }

  if (!initialized) {
    return null;
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
    console.error('useI18n called outside of I18nProvider');
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: StringKey) => String(key),
    };
  }
  return context;
}
