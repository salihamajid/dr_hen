// Layer 2 of the medicine safety mechanism: the outbound WhatsApp message's
// medicine names are ALWAYS written by this function from DISEASE_PROTOCOL, never
// copied from the model's own free text. The model (see replySchema.ts) supplies
// the diagnosis, language, and a medicine-free explanation; this function appends
// the approved medicine list in the farmer's language and templated wording.

import { DISEASE_PROTOCOL, medicinesForDisease, type DiseaseCode } from "./diseaseProtocol";
import type { DiagnosisResult, LanguageCode } from "./provider";
import { checkMedicineAllowlist, SAFE_FALLBACK_REPLY } from "./medicineAllowlist";

const MEDICINE_LABEL: Record<LanguageCode, string> = {
  ur: "تجویز کردہ ادویات",
  "ur-roman": "Tajveez kardah dawaiyan",
  pa: "تجویز کیتیاں دوائیاں",
  en: "Recommended medicines",
};

const VET_ESCALATION_NOTE: Record<LanguageCode, string> = {
  ur: "میں آپ کو ہماری فیلڈ ویٹرنری ٹیم سے جوڑ رہا ہوں، وہ جلد آپ سے رابطہ کریں گے۔",
  "ur-roman": "Main aap ko hamari Field Vet team se jorh raha hoon, woh jald aap se rabta karen ge.",
  pa: "میں تہانوں ساڈی فیلڈ ویٹرنری ٹیم نال جوڑ رہا واں، اوہ چھیتی تہاڈے نال رابطہ کرن گے۔",
  en: "I'm connecting you with our Field Vet team — they will reach out to you shortly.",
};

export interface BuiltReply {
  text: string;
  diseaseCode: DiseaseCode;
  medicines: string[];
  escalateToVet: boolean;
}

/**
 * Builds the final farmer-facing message text. Medicine names come exclusively
 * from DISEASE_PROTOCOL[diseaseCode] — the model's explanationForFarmer is used
 * only for the surrounding tone/description, and is itself still scanned by
 * checkMedicineAllowlist() as defense-in-depth before being included.
 */
export function buildFarmerReply(diagnosis: DiagnosisResult): BuiltReply {
  const lang = diagnosis.detectedLanguage;

  if (diagnosis.escalateToVet) {
    const explanation = safeExplanation(diagnosis.explanationForFarmer, lang);
    return {
      text: [explanation, VET_ESCALATION_NOTE[lang]].filter(Boolean).join("\n\n"),
      diseaseCode: diagnosis.diseaseCode,
      medicines: [],
      escalateToVet: true,
    };
  }

  const explanation = safeExplanation(diagnosis.explanationForFarmer, lang);
  const medicines = medicinesForDisease(diagnosis.diseaseCode);

  if (medicines.length === 0) {
    // OTHER / UNKNOWN — no protocol to template, just deliver the (allowlist-checked) explanation.
    return { text: explanation, diseaseCode: diagnosis.diseaseCode, medicines: [], escalateToVet: false };
  }

  const medicineLines = `${MEDICINE_LABEL[lang]}:\n` + medicines.map((m) => `- ${m}`).join("\n");
  const notesLine = DISEASE_PROTOCOL[diagnosis.diseaseCode as keyof typeof DISEASE_PROTOCOL]?.notesForFarmer[lang];

  const text = [explanation, medicineLines, notesLine].filter(Boolean).join("\n\n");

  return { text, diseaseCode: diagnosis.diseaseCode, medicines, escalateToVet: false };
}

/**
 * Defense-in-depth: even though the model was instructed never to name a medicine
 * in explanationForFarmer, scan it before use and fall back to a safe canned
 * response if it ever slips through.
 */
function safeExplanation(explanation: string, lang: LanguageCode): string {
  if (!explanation.trim()) return SAFE_FALLBACK_REPLY[lang];
  const { ok } = checkMedicineAllowlist(explanation);
  return ok ? explanation : SAFE_FALLBACK_REPLY[lang];
}
