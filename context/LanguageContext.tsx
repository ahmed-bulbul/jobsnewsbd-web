'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/lib/types';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (bn: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'bn',
  setLang: () => {},
  t: (bn) => bn,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bn');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'bn') setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback(
    (bn: string, en: string) => (lang === 'bn' ? bn : en),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
