import { z } from "zod";

export const farmerInputSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  whatsappNumber: z.string().min(8),
  flockSize: z.coerce.number().int().positive(),
  numberOfSheds: z.coerce.number().int().positive(),
  flockAgeWeeks: z.coerce.number().int().nonnegative(),
  breed: z.string().min(1),
  status: z.enum(["HEALTHY", "AT_RISK", "UNDER_TREATMENT", "ESCALATED"]).optional(),
});

export type FarmerInput = z.infer<typeof farmerInputSchema>;

export const dailyReportInputSchema = z.object({
  farmerId: z.string().min(1),
  flockId: z.string().optional(),
  fcr: z.coerce.number().optional(),
  avgWeightGrams: z.coerce.number().optional(),
  mortalityCount: z.coerce.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});
