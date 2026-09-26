import { en, type Dict } from "./en";

// Urdu strings. DELIBERATELY still English: the client hasn't supplied reviewed Urdu copy, and
// unreviewed machine Urdu on a farm-health screen is worse than English. The language switch,
// right-to-left layout, Urdu font and this lookup are all live, so filling a key in below is
// the ONLY step needed for that string to appear in Urdu. (The "language.urdu" label is the
// native name of the language, which is not a translation.)
const reviewedUrdu: Partial<Dict> = {
  // "nav.dashboard": "ڈیش بورڈ",   <- example shape; add only after a native speaker approves it
};

export const ur: Dict = { ...en, ...reviewedUrdu };
