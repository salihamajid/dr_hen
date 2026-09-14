// Single source of truth for the client's approved medicine list and disease
// protocol, transcribed exactly from the AL AZIZ POULTRY PHARMACEUTICALS one-pager.
//
// This file backs THREE things that must never drift apart:
//   1. prisma/seed.ts        — Medicine + MedicineProtocol table rows
//   2. lib/ai/replySchema.ts — the enum the AI model is constrained to
//   3. the server-side reply templating — the actual medicine names a farmer
//      ever sees are looked up from DISEASE_PROTOCOL here, not copied from
//      the model's own prose.

import type { LanguageCode } from "./provider";

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
  /** Clinical rationale, inlined into the AI system prompt for diagnosis reasoning (English only — never sent to a farmer). */
  notes: string;
  /** Same rationale, in farmer-appropriate wording, per language/script — this is what actually gets appended to the farmer-facing reply. */
  notesForFarmer: Record<LanguageCode, string>;
  isAntibiotic: boolean;
}

export const DISEASE_PROTOCOL: Record<Exclude<DiseaseCode, "OTHER" | "UNKNOWN">, DiseaseProtocolEntry> = {
  ND: {
    diseaseName: "Newcastle Disease (Ranikhet)",
    medicines: ["Super ESEL", "Vitamin C Pure Ascorbic Acid"],
    notes:
      "Viral disease — no antibiotic is given. Super ESEL combats cellular tissue breakdown & structural muscular dystrophy; Vitamin C controls acute flock viral stress phases. Focus is exclusively on stopping secondary bacterial complications and supportive care.",
    notesForFarmer: {
      en: "This is a viral disease, so no antibiotic is given. Super ESEL helps repair damaged tissue and muscles; Vitamin C helps the flock cope with the viral stress. The focus is supportive care and preventing other infections from joining in.",
      ur: "یہ ایک وائرل بیماری ہے، اس لیے اینٹی بائیوٹک نہیں دی جاتی۔ سپر ایسل جسم کے خراب ٹشوز اور پٹھوں کی مرمت میں مدد کرتا ہے؛ وٹامن سی فلاک کو وائرل تناؤ سے نکالنے میں مدد دیتا ہے۔ توجہ صرف معاون دیکھ بھال اور دیگر انفیکشنز کو روکنے پر ہے۔",
      "ur-roman":
        "Yeh aik viral bimari hai, is liye antibiotic nahi di jati. Super ESEL jism ke kharab tissues aur pathon ki marammat mein madad karta hai; Vitamin C flock ko viral stress se nikalne mein madad deta hai. Zor sirf supportive care aur doosri infections ko rokne par hai.",
      pa: "ایہہ اک وائرل بیماری اے، ایس لئی اینٹی بائیوٹک نئیں دِتی جاندی۔ سپر ایسل جسم دے خراب ٹشوز تے پٹھاں دی مرمت وچ مدد کردا اے؛ وٹامن سی فلاک نوں وائرل تناؤ توں کڈھن وچ مدد دیندا اے۔ زور صرف مددگار دیکھ بھال تے ہور انفیکشنز نوں روکن اُتے اے۔",
    },
    isAntibiotic: false,
  },
  IB: {
    diseaseName: "Infectious Bronchitis (IB)",
    medicines: ["Mentofar", "ADEK-C Oral Solution", "Vitamin C Pure Ascorbic Acid"],
    notes:
      "Mentofar or Rhincol rapidly alleviates severe respiratory tract congestion and mucous plugs. ADEK-C Oral Solution regenerates protective respiratory tract epithelial tissue linings. Vitamin C Pure Ascorbic Acid suppresses clinical fever spikes.",
    notesForFarmer: {
      en: "Mentofar or Rhincol quickly clears the severe congestion and mucus blocking the airway. ADEK-C Oral Solution helps rebuild the airway's protective lining. Vitamin C Pure Ascorbic Acid brings the fever down.",
      ur: "مینٹوفار یا رِنکول سانس کی نالی کی شدید بندش اور بلغم کو جلدی کم کرتے ہیں۔ اے ڈی ای کے-سی اورل سولوشن سانس کی نالی کی حفاظتی تہہ کو دوبارہ بناتا ہے۔ وٹامن سی خالص ایسکوربک ایسڈ تیز بخار کو کم کرتا ہے۔",
      "ur-roman":
        "Mentofar ya Rhincol saans ki nali ki shadeed bandish aur balgham ko jaldi kam karte hain. ADEK-C Oral Solution saans ki nali ki hifazati parat ko dobara banata hai. Vitamin C Pure Ascorbic Acid tez bukhar ko kam karta hai.",
      pa: "مینٹوفار یا رِنکول ساہ دی نالی دی شدید بندش تے بلغم نوں چھیتی گھٹ کردے نیں۔ اے ڈی ای کے-سی اورل سولوشن ساہ دی نالی دی حفاظتی تہہ نوں دوبارہ بناندا اے۔ وٹامن سی خالص ایسکوربک ایسڈ تیز بخار نوں گھٹ کردا اے۔",
    },
    isAntibiotic: true,
  },
  CRD: {
    diseaseName: "Chronic Respiratory Disease (CRD)",
    medicines: ["Tilfarsin", "Diavitamin", "ADEK-C Oral Solution"],
    notes:
      "Tilfarsin, Doxypol, or Cincofar form a broad systemic anti-mycoplasma line targeting severe air sac cul-de-sac environments. Diavitamin replenishes complete amino acid configurations & restores physiological appetite. ADEK-C accelerates overall mucous barrier recovery. Critical Respiratory Recovery Protocol: co-administer Tilfarsin/Doxypol alongside ADEK-C via fresh drinking water loops.",
    notesForFarmer: {
      en: "Tilfarsin, Doxypol, or Cincofar controls the deep respiratory infection. Diavitamin restores the flock's appetite and vitamins. ADEK-C helps rebuild the airway's protective lining. Important: give Tilfarsin/Doxypol together with ADEK-C in the same fresh drinking water.",
      ur: "ٹِلفارسن، ڈوکسی پول، یا سنکوفار سانس کی گہری انفیکشن کو کنٹرول کرتے ہیں۔ ڈیاوٹامن فلاک کی بھوک اور ضروری وٹامنز کو دوبارہ ٹھیک کرتا ہے۔ اے ڈی ای کے-سی سانس کی نالی کی حفاظتی تہہ کو بحال کرنے میں مدد کرتا ہے۔ ضروری بات: ٹِلفارسن/ڈوکسی پول کو اے ڈی ای کے-سی کے ساتھ ایک ہی تازہ پینے کے پانی میں دیں۔",
      "ur-roman":
        "Tilfarsin, Doxypol, ya Cincofar saans ki gehri infection ko control karte hain. Diavitamin flock ki bhookh aur zaroori vitamins ko dobara theek karta hai. ADEK-C saans ki nali ki hifazati parat ko bahaal karne mein madad karta hai. Zaroori baat: Tilfarsin/Doxypol ko ADEK-C ke saath ek hi taza peene ke pani mein den.",
      pa: "ٹِلفارسن، ڈوکسی پول، یا سنکوفار ساہ دی ڈونگھی انفیکشن نوں کنٹرول کردے نیں۔ ڈیاوٹامن فلاک دی بھُکھ تے ضروری وٹامنز نوں دوبارہ ٹھیک کردا اے۔ اے ڈی ای کے-سی ساہ دی نالی دی حفاظتی تہہ نوں بحال کرن وچ مدد کردا اے۔ ضروری گل: ٹِلفارسن/ڈوکسی پول نوں اے ڈی ای کے-سی نال اک ای تازہ پینے دے پانی وچ دیو۔",
    },
    isAntibiotic: true,
  },
  COCCIDIOSIS: {
    diseaseName: "Coccidiosis",
    medicines: ["Neofar", "ADEK-C Oral Solution"],
    notes:
      "Neofar combats protozoan replication cycles across intestinal epithelium sectors. CRITICAL COMBINATION — do not omit ADEK-C Oral Solution: its Vitamin K content actively stops field gut hemorrhages and bleeding, and Vitamin A mends local cell walls.",
    notesForFarmer: {
      en: "Neofar stops the parasite that's damaging the gut from multiplying. Important: don't skip ADEK-C Oral Solution — its Vitamin K stops the gut bleeding, and Vitamin A helps repair the damaged gut lining.",
      ur: "نیوفار آنتوں کے اندر کوکسیڈیا پیراسائٹ کی افزائش کو روکتا ہے۔ ضروری بات — اے ڈی ای کے-سی اورل سولوشن ضرور دیں: اس میں موجود وٹامن کے آنتوں کی خون ریزی کو روکتا ہے، اور وٹامن اے خراب ہوئی اندرونی تہہ کی مرمت کرتا ہے۔",
      "ur-roman":
        "Neofar aanton ke andar coccidia parasite ki afzaish ko rokta hai. Zaroori baat — ADEK-C Oral Solution zaroor den: is mein maujood Vitamin K aanton ki khoon rezi ko rokta hai, aur Vitamin A kharab hui andaruni tehon ki marammat karta hai.",
      pa: "نیوفار انتڑیاں دے اندر کوکسیڈیا پیراسائٹ دی افزائش نوں روکدا اے۔ ضروری گل — اے ڈی ای کے-سی اورل سولوشن ضرور دیو: اس وچ موجود وٹامن کے انتڑیاں دی خون ریزی نوں روکدا اے، تے وٹامن اے خراب ہوئی اندرونی تہہ دی مرمت کردا اے۔",
    },
    isAntibiotic: false,
  },
  AI_H9: {
    diseaseName: "Avian Influenza (AI / H9)",
    medicines: ["Mentofar", "Florozar", "Livdiana Oral Solution", "Vitamin C Pure Ascorbic Acid", "Super ESEL"],
    notes:
      "Dual treatment strategy of Mentofar + Florozar clears airway blockages while countering deep respiratory opportunists. Livdiana Oral Solution incentivizes immediate liver detoxification to avoid complete metabolic collapse. Vitamin C and Super ESEL provide broader supportive/immune care.",
    notesForFarmer: {
      en: "Mentofar together with Florozar clears the blocked airway and fights the deep infection. Livdiana Oral Solution helps the liver clean itself out quickly so the body doesn't shut down. Vitamin C and Super ESEL give broader support to the immune system and overall health.",
      ur: "مینٹوفار اور فلوروزار کا مجموعہ سانس کی نالی کی بندش کو کھولتا ہے اور گہری انفیکشن سے لڑتا ہے۔ لِوڈیانا اورل سولوشن جگر کو فوراً صاف کرنے میں مدد کرتا ہے تاکہ جسم کا نظام خراب نہ ہو۔ وٹامن سی اور سپر ایسل مدافعتی نظام اور مجموعی صحت کو سہارا دیتے ہیں۔",
      "ur-roman":
        "Mentofar aur Florozar ka combination saans ki nali ki bandish ko kholta hai aur gehri infection se larta hai. Livdiana Oral Solution jigar ko foran saaf karne mein madad karta hai taakay jism ka nizam kharab na ho. Vitamin C aur Super ESEL immune system aur majmoyi sehat ko sahara dete hain.",
      pa: "مینٹوفار تے فلوروزار دا مجموعہ ساہ دی نالی دی بندش نوں کھولدا اے تے ڈونگھی انفیکشن نال لڑدا اے۔ لِوڈیانا اورل سولوشن جگر نوں فوراً صاف کرن وچ مدد کردا اے تاکہ جسم دا نظام خراب نہ ہووے۔ وٹامن سی تے سپر ایسل مدافعتی نظام تے مجموعی صحت نوں سہارا دیندے نیں۔",
    },
    isAntibiotic: true,
  },
};

export const DISEASE_CODES = Object.keys(DISEASE_PROTOCOL) as Array<keyof typeof DISEASE_PROTOCOL>;

/** Every medicine name that is allowed to reach a farmer, for any disease. */
export function medicinesForDisease(code: DiseaseCode): ApprovedMedicine[] {
  if (code === "OTHER" || code === "UNKNOWN") return [];
  return DISEASE_PROTOCOL[code].medicines;
}
