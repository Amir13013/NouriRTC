'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, TranslationKey, translations } from './i18n';

const STORAGE_KEY = 'chatflow_lang';
const VALID: Language[] = ['fr', 'en', 'es'];

export function useLanguage() {
  const [lang, setLangState] = useState<Language>('fr');

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language;
    if (stored && VALID.includes(stored)) setLangState(stored);
  }, []);

  // Listen for changes from other components on the same page
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as Language;
      if (stored && VALID.includes(stored)) setLangState(stored);
    };
    window.addEventListener('chatflow:lang-change', handler);
    return () => window.removeEventListener('chatflow:lang-change', handler);
  }, []);

  const setLang = useCallback((l: Language) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
    window.dispatchEvent(new Event('chatflow:lang-change'));
  }, []);

  // t() returns the translated string for the current language
  const t = useCallback((key: TranslationKey): string => {
    return (translations[lang] as any)[key] ?? (translations.fr as any)[key] ?? key;
  }, [lang]);

  return { lang, setLang, t };
}
