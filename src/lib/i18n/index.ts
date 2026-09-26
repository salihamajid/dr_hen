import { en, type Dict, type I18nKey } from "./en";
import { ur } from "./ur";

export type Lang = "EN" | "UR";
export type { Dict, I18nKey };

export const DICTIONARIES: Record<Lang, Dict> = { EN: en, UR: ur };

export const isLang = (v: unknown): v is Lang => v === "EN" || v === "UR";

/** Cookie holding the language choice of someone who isn't logged in (login/signup pages). */
export const LANG_COOKIE = "dr_hen_lang";

export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "UR" ? "rtl" : "ltr";
}

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? String(vars[name]) : whole));
}

export function translate(lang: Lang | null | undefined, key: I18nKey, vars?: Vars): string {
  const dict = DICTIONARIES[lang ?? "EN"];
  return interpolate(dict[key] ?? en[key], vars);
}

/** Server-side translator. Falls back to English for any missing key. */
export function getT(lang: Lang | null | undefined) {
  return (key: I18nKey, vars?: Vars): string => translate(lang, key, vars);
}

export type T = ReturnType<typeof getT>;
