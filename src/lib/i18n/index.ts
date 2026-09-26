import { en, type Dict, type I18nKey } from "./en";
import { ur } from "./ur";

export type Lang = "EN" | "UR";
export type { Dict, I18nKey };

export const DICTIONARIES: Record<Lang, Dict> = { EN: en, UR: ur };

export const isLang = (v: unknown): v is Lang => v === "EN" || v === "UR";

export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "UR" ? "rtl" : "ltr";
}

/** Server-side translator. Falls back to English for any missing key. */
export function getT(lang: Lang | null | undefined) {
  const dict = DICTIONARIES[lang ?? "EN"];
  return (key: I18nKey): string => dict[key] ?? en[key];
}

export type T = ReturnType<typeof getT>;
