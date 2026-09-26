import { z } from "zod";

// Blank form fields arrive as "" — treat them as "not provided", not as 0.
const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const num = (label: string, min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: `${label}: enter a number` }).min(min, `${label}: at least ${min}`).max(max, `${label}: at most ${max}`).optional());

const text = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const target = {
  flockId: z.string().min(1, "Choose a flock").max(64),
  // YYYY-MM-DD; the calendar/range check lives in dates.ts so both schemas share it.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
};

// The two screens share feed / water / temperature. Both write the same DailyReport row,
// and each only sends the fields it owns, so saving one screen never wipes the other's data.
const shared = {
  feedKg: num("Feed", 0, 100_000),
  waterLiters: num("Water", 0, 1_000_000),
  temperatureC: num("Temperature", -10, 60),
};

export const dailyEntrySchema = z.object({
  ...target,
  ...shared,
  // Required. A blank box must fail, not quietly coerce to 0 deaths.
  mortalityCount: z.preprocess(blankToUndefined, z.coerce.number({ error: "Mortality: enter a number" }).int("Mortality: whole birds only").min(0).max(5_000_000)),
  // What the farmer says they gave. A record only: it never reaches the AI or the medicine guardrail.
  medicineGiven: text(200),
  notes: text(1000),
});

export const parametersSchema = z.object({
  ...target,
  ...shared,
  humidityPct: num("Humidity", 0, 100),
  lightHours: num("Light hours", 0, 24),
  ventilation: z.preprocess(blankToUndefined, z.enum(["POOR", "AVERAGE", "GOOD"]).optional()),
});

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;
export type ParametersInput = z.infer<typeof parametersSchema>;
