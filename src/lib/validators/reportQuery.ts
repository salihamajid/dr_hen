import { z } from "zod";

const flockId = z.string().min(1, "Choose a flock").max(64);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const GROWTH_PERIODS = ["all", "1-4", "5-8"] as const;

// One shape shared by the share route (JSON body) and the PDF route (query string),
// so the two can never disagree about what a report request is. farmerId is never part of it.
export const reportRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mortality"), flockId, from: dateStr, to: dateStr }),
  z.object({ type: z.literal("growth"), flockId, period: z.enum(GROWTH_PERIODS).default("all") }),
  z.object({ type: z.literal("daily"), flockId, date: dateStr }),
]);

export type ReportRequest = z.infer<typeof reportRequestSchema>;
