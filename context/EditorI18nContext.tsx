"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'fr' | 'en';

interface EditorI18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const EditorI18nContext = createContext<EditorI18nContextType>({ lang: 'fr', setLang: () => {} });

export function EditorI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('editor.lang') as Lang | null;
      if (stored === 'fr' || stored === 'en') setLangState(stored);
      else {
        const nav = navigator.language?.toLowerCase() || 'fr';
        setLangState(nav.startsWith('en') ? 'en' : 'fr');
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem('editor.lang', l); } catch {}
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <EditorI18nContext.Provider value={value}>{children}</EditorI18nContext.Provider>;
}

export function useEditorI18n() { return useContext(EditorI18nContext); }
