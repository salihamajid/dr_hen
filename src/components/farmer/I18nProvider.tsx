"use client";

import { createContext, useContext } from "react";
import { translate, type I18nKey, type Lang, type Vars } from "@/lib/i18n";
import { translateMessage } from "@/lib/i18n/messages";

const LangContext = createContext<Lang>("EN");

// Client components translate through this; server components use getT(). Both read the same strings.
// Outside the farmer area (the admin screens) there is no provider, so everything stays English.
export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useT() {
  const lang = useContext(LangContext);
  return (key: I18nKey, vars?: Vars): string => translate(lang, key, vars);
}

/** Translates an error message that came back from the API. */
export function useMsg() {
  const lang = useContext(LangContext);
  return (text: string | null | undefined): string => translateMessage(lang, text);
}

export function useLang(): Lang {
  return useContext(LangContext);
}
