'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import arMessages from '../../../messages/ar.json';
import enMessages from '../../../messages/en.json';

export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';

interface AppContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  theme: Theme;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  t: (path: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const dictionaries = {
  ar: arMessages,
  en: enMessages,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [theme, setThemeState] = useState<Theme>('light'); // Premium Light mode default!

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem('borsaty_lang') as Language;
    if (savedLang === 'ar' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
    const savedTheme = localStorage.getItem('borsaty_theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply direction and html classes
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem('borsaty_lang', language);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('borsaty_theme', theme);
  }, [language, theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: unknown = dictionaries[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    return typeof current === 'string' ? current : path;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        theme,
        setLanguage,
        toggleTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
