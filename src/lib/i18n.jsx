import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries } from '@/lib/i18n/locales';
import { foundersDict } from '@/lib/foundersI18n';
import { communityDict } from '@/lib/communityI18n';

const LanguageContext = createContext({ lang: 'it', t: (k) => k, setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('ibd_lang');
    if (saved && dictionaries[saved]) return saved;
    const navLang = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'it';
    const primary = String(navLang).toLowerCase().split('-')[0];
    return dictionaries[primary] ? primary : 'it';
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem('ibd_lang', l);
  }, []);

  const t = useCallback((key) => {
    return (dictionaries[lang] && dictionaries[lang][key])
      || (dictionaries.it[key])
      || (foundersDict[lang] && foundersDict[lang][key])
      || (foundersDict.it[key])
      || (communityDict[lang] && communityDict[lang][key])
      || (communityDict.it[key])
      || key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}