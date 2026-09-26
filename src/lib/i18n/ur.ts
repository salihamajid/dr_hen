import { STRINGS } from "./strings";
import type { Dict } from "./en";

// Urdu, from the same [English, Urdu] pairs as English, so no key can be missing in one language.
export const ur = Object.fromEntries(Object.entries(STRINGS).map(([k, v]) => [k, v[1]])) as Dict;
