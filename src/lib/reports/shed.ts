import { prisma } from "@/lib/prisma";
import { ageInDays } from "./growthStandards";

export interface ShedTotals {
  /** Age of the birds on that date, from the flock's start date. */
  chickAgeDays: number;
  /** Birds placed, minus every death recorded up to and including that date. */
  remaining: number;
  birdsPlaced: number;
}

/**
 * The two figures the paper Daily Report asks for that the app already knows: chick age and
 * remaining chicks. Deriving them means a farmer can't file a "remaining" that contradicts the
 * mortality they entered.
 */
export async function shedTotals(
  farmerId: string,
  flock: { id: string; sizeCount: number; startDate: Date },
  date: Date
): Promise<ShedTotals> {
  const dead = await prisma.dailyReport.aggregate({
    where: { farmerId, flockId: flock.id, date: { lte: date } },
    _sum: { mortalityCount: true },
  });
  return {
    chickAgeDays: ageInDays(flock.startDate, date),
    birdsPlaced: flock.sizeCount,
    remaining: Math.max(0, flock.sizeCount - (dead._sum.mortalityCount ?? 0)),
  };
}
