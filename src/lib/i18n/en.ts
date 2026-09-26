import { STRINGS } from "./strings";

export type I18nKey = keyof typeof STRINGS;
export type Dict = Record<I18nKey, string>;

// Derived from strings.ts, where each key holds [English, Urdu] side by side.
export const en = Object.fromEntries(Object.entries(STRINGS).map(([k, v]) => [k, v[0]])) as Dict;
