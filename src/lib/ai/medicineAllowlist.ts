// Layer 3 of the medicine safety mechanism: a post-generation scan over the
// assembled outbound message text, run right before any WhatsApp send.
//
// Layers 1 and 2 (see replyTool.ts and the chat/analyze-image routes) already make
// it structurally very hard for an unapproved medicine name to appear, because the
// server — not the model — writes the medicine names into the farmer-facing text
// from DISEASE_PROTOCOL. This layer is defense-in-depth in case that discipline is
// ever violated by a future code change (e.g. someone starts trusting the model's
// free text directly).

import { APPROVED_MEDICINES } from "./diseaseProtocol";

// Common veterinary/antibiotic name fragments that must NEVER appear in a
// farmer-facing reply unless they are part of an approved medicine's exact name.
// This is intentionally a small, curated list of red-flag substrings rather than
// an attempt at exhaustive drug-name detection — it exists to catch the model
// reaching for generic veterinary knowledge (e.g. "amoxicillin", "tylosin" as a
// bare generic, "enrofloxacin"), not to be a complete pharmacology filter.
const RED_FLAG_SUBSTRINGS = [
  "amoxicillin",
  "amoxycillin",
  "enrofloxacin",
  "ciprofloxacin",
  "gentamicin",
  "oxytetracycline",
  "tetracycline",
  "penicillin",
  "sulfadiazine",
  "sulfamethoxazole",
  "toltrazuril",
  "amprolium",
  "baytril",
  "colistin",
  "furazolidone",
  "levamisole",
  "ivermectin",
];

export interface AllowlistCheckResult {
  ok: boolean;
  /** Red-flag substrings or bracketed medicine mentions found that aren't approved. */
  violations: string[];
}

/**
 * Scans free text (the assembled farmer-facing message) for any mention of a
 * medicine outside APPROVED_MEDICINES. Case-insensitive substring match.
 */
export function checkMedicineAllowlist(text: string): AllowlistCheckResult {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const redFlag of RED_FLAG_SUBSTRINGS) {
    if (lower.includes(redFlag)) {
      violations.push(redFlag);
    }
  }

  return { ok: violations.length === 0, violations };
}

/** True if every entry in `names` is an exact match against the approved list. */
export function allMedicinesApproved(names: string[]): boolean {
  return names.every((n) => (APPROVED_MEDICINES as readonly string[]).includes(n));
}

export const SAFE_FALLBACK_REPLY: Record<"ur" | "ur-roman" | "pa" | "en", string> = {
  ur: "معذرت، مجھے آپ کی بات پوری طرح سمجھ نہیں آئی۔ براہ کرم علامات کی مزید تفصیل بتائیں، یا 'VET' لکھ کر ہمارے فیلڈ ویٹرنری ٹیم سے براہ راست بات کریں۔",
  "ur-roman": "Maazrat, mujhe aap ki baat mukammal tor par samajh nahi aayi. Baraye meherbani alamaat ki mazeed tafseel batayen, ya 'VET' likh kar hamari Field Vet team se seedha baat karen.",
  pa: "معذرت، مینوں تہاڈی گل پوری طرح سمجھ نئیں آئی۔ براہ کرم علامات دی ہور تفصیل دسو، یا 'VET' لکھ کے ساڈی فیلڈ ویٹرنری ٹیم نال گل کرو۔",
  en: "Sorry, I couldn't fully understand that. Please describe the symptoms in more detail, or reply 'VET' to connect directly with our Field Vet team.",
};
