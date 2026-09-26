"use client";

import { createContext, useContext } from "react";
import { DICTIONARIES, type I18nKey, type Lang } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";

const LangContext = createContext<Lang>("EN");

// Client components translate through this; server components use getT(). Both read the same dictionaries.
export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useT() {
  const lang = useContext(LangContext);
  const dict = DICTIONARIES[lang];
  return (key: I18nKey): string => dict[key] ?? en[key];
}

export function useLang(): Lang {
  return useContext(LangContext);
}
