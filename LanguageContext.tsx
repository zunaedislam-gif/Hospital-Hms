/**
 * Pattern HMS - Multilingual Language Context (English & Bangla)
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Language,
  TranslationSchema,
  translations,
  formatLocalizedNumber,
  formatLocalizedCurrency,
  toBengaliDigits
} from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isBangla: boolean;
  tObj: TranslationSchema;
  t: (path: string, fallback?: string) => string;
  formatNumber: (value: number | string) => string;
  formatMoney: (amount: number, currencyCode?: string) => string;
}

const STORAGE_KEY = 'pattern_hms_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') {
        return saved;
      }
    } catch {
      // localStorage may fail in strict iframe mode
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      document.documentElement.setAttribute('data-lang', newLang);
    } catch (e) {
      console.warn('Could not store language preference', e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  }, [language, setLanguage]);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-lang', language);
    } catch (e) {
      // Ignore
    }
  }, [language]);

  const tObj = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  /**
   * Helper function to safely traverse nested translation paths e.g. "header.searchPlaceholder"
   */
  const t = useCallback((path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let enCurrent: any = translations.en;
        for (const k of keys) {
          if (enCurrent && typeof enCurrent === 'object' && k in enCurrent) {
            enCurrent = enCurrent[k];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : (fallback || path);
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  }, [language]);

  const formatNumber = useCallback((val: number | string): string => {
    return formatLocalizedNumber(val, language);
  }, [language]);

  const formatMoney = useCallback((amount: number, currencyCode = 'BDT'): string => {
    return formatLocalizedCurrency(amount, language, currencyCode);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isBangla: language === 'bn',
        tObj,
        t,
        formatNumber,
        formatMoney
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
