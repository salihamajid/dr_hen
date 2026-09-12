// Provider-agnostic contract for Dr. Hen's AI brain. app/api/ai/* and
// lib/whatsapp/handleInboundWebhook.ts depend ONLY on diagnose.ts (which depends
// only on this file's types + providers/index.ts's factory) — never on a concrete
// provider SDK directly. Swapping AI vendors later means writing one new file
// under providers/ and flipping the AI_PROVIDER env var; nothing here changes.

import type { DiseaseCode } from "./diseaseProtocol";

export type Role = "user" | "assistant";

export interface ChatTurn {
  role: Role;
  text?: string;
  image?: { base64: string; mimeType: string };
}

export type LanguageCode = "ur" | "pa" | "en";

export interface DiagnosisResult {
  detectedLanguage: LanguageCode;
  diseaseCode: DiseaseCode;
  confidence: "low" | "medium" | "high";
  escalateToVet: boolean;
  symptomsSummary: string;
  explanationForFarmer: string;
}

export interface AIProvider {
  runDiagnosis(turns: ChatTurn[]): Promise<DiagnosisResult>;
}
