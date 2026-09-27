import { z } from "zod";

// Blank form fields arrive as "" — treat them as "not provided", not as 0.
const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const num = (label: string, min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: `${label}: enter a number` }).min(min, `${label}: at least ${min}`).max(max, `${label}: at most ${max}`).optional());

const text = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

/** Required whole number. A blank box must fail, not quietly coerce to 0 birds. */
const requiredCount = (label: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: `${label}: enter a number` }).int(`${label}: whole birds only`).min(0, `${label}: at least 0`).max(5_000_000, `${label}: at most 5000000`)
  );

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

// Mirrors the paper Daily Report: losses are counted in a day round and a night round, and the
// total is derived rather than typed, so the three numbers can never contradict each other.
export const dailyEntrySchema = z.object({
  ...target,
  ...shared,
  mortalityDay: requiredCount("Mortality (day)"),
  mortalityNight: requiredCount("Mortality (night)"),
  feedBags: num("Feed bags", 0, 100_000),
  // Offered pre-filled from the flock's records, but the farmer can overwrite either one.
  chickAgeDays: z.preprocess(blankToUndefined, z.coerce.number({ error: "Chick age: enter a number" }).int("Chick age: whole days only").min(0).max(1000).optional()),
  remainingChicks: z.preprocess(blankToUndefined, z.coerce.number({ error: "Remaining chicks: enter a number" }).int("Remaining chicks: whole birds only").min(0).max(5_000_000).optional()),
  avgWeightGrams: num("Average weight", 1, 10_000),
  // What the farmer says they gave. A record only: it never reaches the AI or the medicine guardrail.
  medicineGiven: text(200),
  notes: text(1000),
  // Farm-wide, counted once a day. Saved to DailyStock, not to the shed's row.
  stockFeedBags: num("Feed bags in stock", 0, 1_000_000),
  dieselLitres: num("Diesel", 0, 1_000_000),
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
