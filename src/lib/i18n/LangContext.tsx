"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { TRANSLATIONS, type Lang } from "./translations";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangCtx = createContext<LangContextType>({ lang: "es", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("gcrm_lang") as Lang | null;
    if (saved && ["es", "en", "pt"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gcrm_lang", l);
    document.documentElement.setAttribute("lang", l);
  }, []);

  const t = useCallback(
    (key: string) => {
      return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.es[key] ?? key;
    },
    [lang]
  );

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
