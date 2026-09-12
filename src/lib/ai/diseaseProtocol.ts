// Single source of truth for the client's approved medicine list and disease
// protocol, transcribed exactly from the AL AZIZ POULTRY PHARMACEUTICALS one-pager.
//
// This file backs THREE things that must never drift apart:
//   1. prisma/seed.ts        — Medicine + MedicineProtocol table rows
//   2. lib/ai/replySchema.ts — the enum the AI model is constrained to
//   3. the server-side reply templating — the actual medicine names a farmer
//      ever sees are looked up from DISEASE_PROTOCOL here, not copied from
//      the model's own prose.

export type DiseaseCode = "ND" | "IB" | "CRD" | "COCCIDIOSIS" | "AI_H9" | "OTHER" | "UNKNOWN";

export const APPROVED_MEDICINES = [
  // Own manufacturing — ST Vet Pharma
  "Mentofar",
  "Rhincol",
  "Tilfarsin",
  "Doxypol",
  "Cincofar",
  "Neofar",
  "Florozar",
  // Premium Spanish imports — Supers Diana
  "Super ESEL",
  "Vitamin C Pure Ascorbic Acid",
  "ADEK-C Oral Solution",
  "Diavitamin",
  "Livdiana Oral Solution",
] as const;

export type ApprovedMedicine = (typeof APPROVED_MEDICINES)[number];

export const MEDICINE_MANUFACTURER: Record<ApprovedMedicine, string> = {
  Mentofar: "ST Vet Pharma",
  Rhincol: "ST Vet Pharma",
  Tilfarsin: "ST Vet Pharma",
  Doxypol: "ST Vet Pharma",
  Cincofar: "ST Vet Pharma",
  Neofar: "ST Vet Pharma",
  Florozar: "ST Vet Pharma",
  "Super ESEL": "Supers Diana",
  "Vitamin C Pure Ascorbic Acid": "Supers Diana",
  "ADEK-C Oral Solution": "Supers Diana",
  Diavitamin: "Supers Diana",
  "Livdiana Oral Solution": "Supers Diana",
};

interface DiseaseProtocolEntry {
  diseaseName: string;
  /** The medicine combo the server will template into the farmer-facing reply. */
  medicines: ApprovedMedicine[];
  /** Clinical rationale, inlined into the AI system prompt for diagnosis reasoning. */
  notes: string;
  isAntibiotic: boolean;
}

export const DISEASE_PROTOCOL: Record<Exclude<DiseaseCode, "OTHER" | "UNKNOWN">, DiseaseProtocolEntry> = {
  ND: {
    diseaseName: "Newcastle Disease (Ranikhet)",
    medicines: ["Super ESEL", "Vitamin C Pure Ascorbic Acid"],
    notes:
      "Viral disease — no antibiotic is given. Super ESEL combats cellular tissue breakdown & structural muscular dystrophy; Vitamin C controls acute flock viral stress phases. Focus is exclusively on stopping secondary bacterial complications and supportive care.",
    isAntibiotic: false,
  },
  IB: {
    diseaseName: "Infectious Bronchitis (IB)",
    medicines: ["Mentofar", "ADEK-C Oral Solution", "Vitamin C Pure Ascorbic Acid"],
    notes:
      "Mentofar or Rhincol rapidly alleviates severe respiratory tract congestion and mucous plugs. ADEK-C Oral Solution regenerates protective respiratory tract epithelial tissue linings. Vitamin C Pure Ascorbic Acid suppresses clinical fever spikes.",
    isAntibiotic: true,
  },
  CRD: {
    diseaseName: "Chronic Respiratory Disease (CRD)",
    medicines: ["Tilfarsin", "Diavitamin", "ADEK-C Oral Solution"],
    notes:
      "Tilfarsin, Doxypol, or Cincofar form a broad systemic anti-mycoplasma line targeting severe air sac cul-de-sac environments. Diavitamin replenishes complete amino acid configurations & restores physiological appetite. ADEK-C accelerates overall mucous barrier recovery. Critical Respiratory Recovery Protocol: co-administer Tilfarsin/Doxypol alongside ADEK-C via fresh drinking water loops.",
    isAntibiotic: true,
  },
  COCCIDIOSIS: {
    diseaseName: "Coccidiosis",
    medicines: ["Neofar", "ADEK-C Oral Solution"],
    notes:
      "Neofar combats protozoan replication cycles across intestinal epithelium sectors. CRITICAL COMBINATION — do not omit ADEK-C Oral Solution: its Vitamin K content actively stops field gut hemorrhages and bleeding, and Vitamin A mends local cell walls.",
    isAntibiotic: false,
  },
  AI_H9: {
    diseaseName: "Avian Influenza (AI / H9)",
    medicines: ["Mentofar", "Florozar", "Livdiana Oral Solution", "Vitamin C Pure Ascorbic Acid", "Super ESEL"],
    notes:
      "Dual treatment strategy of Mentofar + Florozar clears airway blockages while countering deep respiratory opportunists. Livdiana Oral Solution incentivizes immediate liver detoxification to avoid complete metabolic collapse. Vitamin C and Super ESEL provide broader supportive/immune care.",
    isAntibiotic: true,
  },
};

export const DISEASE_CODES = Object.keys(DISEASE_PROTOCOL) as Array<keyof typeof DISEASE_PROTOCOL>;

/** Every medicine name that is allowed to reach a farmer, for any disease. */
export function medicinesForDisease(code: DiseaseCode): ApprovedMedicine[] {
  if (code === "OTHER" || code === "UNKNOWN") return [];
  return DISEASE_PROTOCOL[code].medicines;
}
