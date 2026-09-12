// Provider-agnostic description of the structured diagnosis output. Each concrete
// provider (see providers/geminiProvider.ts) translates DIAGNOSIS_FIELDS into its
// own native schema format (Gemini's responseSchema, a future provider's tool
// schema, etc.) — this file is the single description both translate from.
//
// parseDiagnosisResult() is the defensive re-validator: no provider's "structured
// output" guarantee is trusted blindly — every enum is re-checked against the
// known set here before anything downstream uses it. This is what makes Layer 1
// of the medicine safety mechanism a real guarantee rather than an assumption
// about model behavior.

import { DISEASE_CODES, type DiseaseCode } from "./diseaseProtocol";
import type { DiagnosisResult, LanguageCode } from "./provider";

export const LANGUAGE_CODES = ["ur", "pa", "en"] as const;
export const ALL_DISEASE_CODES: DiseaseCode[] = [...DISEASE_CODES, "OTHER", "UNKNOWN"];
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

/**
 * A minimal, provider-agnostic JSON-Schema-shaped description. Providers that
 * support structured/constrained output (Gemini's responseSchema, or a future
 * provider's own equivalent) translate this into their own types; providers that
 * don't can fall back to prompting for JSON and parsing the text, since
 * parseDiagnosisResult() below never trusts the raw shape anyway.
 */
export const DIAGNOSIS_FIELDS = {
  detectedLanguage: { type: "string", enum: LANGUAGE_CODES, description: "The primary language the farmer wrote/spoke in." },
  diseaseCode: {
    type: "string",
    enum: ALL_DISEASE_CODES,
    description:
      "Best-guess diagnosis among the 5 known diseases, OTHER if poultry-related but not one of these, or UNKNOWN if there isn't enough information yet.",
  },
  confidence: { type: "string", enum: CONFIDENCE_LEVELS, description: "Confidence in the diagnosis." },
  escalateToVet: {
    type: "boolean",
    description: "True if the farmer explicitly asked for the vet, or the case is severe/urgent/ambiguous enough for a human to take over.",
  },
  symptomsSummary: { type: "string", description: "Short English summary of symptoms/context, for the internal record." },
  explanationForFarmer: {
    type: "string",
    description:
      "Warm, simple explanation of the disease/symptoms/precautions, in the farmer's detectedLanguage. Must NEVER mention any medicine or drug name.",
  },
} as const;

export const DIAGNOSIS_REQUIRED_FIELDS = Object.keys(DIAGNOSIS_FIELDS) as Array<keyof typeof DIAGNOSIS_FIELDS>;

/**
 * Re-validates a provider's raw parsed JSON against the known enums. Anything
 * unrecognized is coerced to a safe default rather than trusted.
 */
export function parseDiagnosisResult(raw: unknown): DiagnosisResult {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const detectedLanguage: LanguageCode = (LANGUAGE_CODES as readonly string[]).includes(obj.detectedLanguage as string)
    ? (obj.detectedLanguage as LanguageCode)
    : "en";

  const diseaseCode: DiseaseCode = ALL_DISEASE_CODES.includes(obj.diseaseCode as DiseaseCode)
    ? (obj.diseaseCode as DiseaseCode)
    : "UNKNOWN";

  const confidence = (CONFIDENCE_LEVELS as readonly string[]).includes(obj.confidence as string)
    ? (obj.confidence as (typeof CONFIDENCE_LEVELS)[number])
    : "low";

  return {
    detectedLanguage,
    diseaseCode,
    confidence,
    escalateToVet: Boolean(obj.escalateToVet),
    symptomsSummary: typeof obj.symptomsSummary === "string" ? obj.symptomsSummary : "",
    explanationForFarmer: typeof obj.explanationForFarmer === "string" ? obj.explanationForFarmer : "",
  };
}
