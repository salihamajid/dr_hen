import { translate, type I18nKey, type Lang, type Vars } from "../i18n";

/**
 * An alert's wording is saved at the moment it fires, in both languages, so it stays a fixed
 * health record. `vars` is a function because some parts (a severity word, "too high") are
 * themselves words that differ per language.
 */
export function both(key: I18nKey, vars: (lang: Lang) => Vars) {
  return { en: translate("EN", key, vars("EN")), ur: translate("UR", key, vars("UR")) };
}

export const word = (lang: Lang, key: I18nKey) => translate(lang, key);
