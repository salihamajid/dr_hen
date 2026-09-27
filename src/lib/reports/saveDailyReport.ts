import type { DailyReport, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAllowedEntryDate, parseDateOnly } from "./dates";

export type SaveResult =
  | { ok: true; report: DailyReport }
  | { ok: false; status: 400 | 404; error: string };

/**
 * The one writer for farmer daily data. Daily Entry and Attributes both call this,
 * so there is exactly one row per (farmer, flock, day) and a value shared by the
 * two screens (feed, water, temperature) can never exist twice with different numbers.
 * `fields` holds only what the calling screen owns; anything absent is left untouched.
 */
export async function saveDailyReport(
  farmerId: string,
  target: { flockId: string; date: string },
  fields: Omit<Prisma.DailyReportUncheckedUpdateInput, "farmerId" | "flockId" | "date" | "id">,
  opts: { checkMortalityAgainstFlock?: boolean } = {}
): Promise<SaveResult> {
  const date = parseDateOnly(target.date);
  if (!date || !isAllowedEntryDate(date)) return { ok: false, status: 400, error: "Choose a valid date (within the last year, not in the future)." };

  // The flock id from the request is only ever a filter beside the session's farmerId.
  const flock = await prisma.flock.findFirst({ where: { id: target.flockId, farmerId }, select: { id: true, sizeCount: true } });
  if (!flock) return { ok: false, status: 404, error: "Not found" };

  if (opts.checkMortalityAgainstFlock && typeof fields.mortalityCount === "number" && fields.mortalityCount > flock.sizeCount) {
    return { ok: false, status: 400, error: `Mortality can't be more than the ${flock.sizeCount.toLocaleString("en-IN")} birds in this flock.` };
  }

  // Drop undefined so "not provided" never overwrites an existing value.
  const data = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as typeof fields;

  const report = await prisma.dailyReport.upsert({
    where: { daily_report_farmer_flock_date: { farmerId, flockId: flock.id, date } },
    create: { ...(data as Prisma.DailyReportUncheckedCreateInput), farmerId, flockId: flock.id, date },
    update: data,
  });
  return { ok: true, report };
}

/**
 * Farm-wide stock for one day. Kept out of DailyReport because it is counted once for the whole
 * farm: storing it per shed would let two sheds hold different answers for the same question.
 */
export async function saveDailyStock(
  farmerId: string,
  dateStr: string,
  fields: { feedBags?: number; dieselLitres?: number }
): Promise<void> {
  const date = parseDateOnly(dateStr);
  if (!date) return;
  const data = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  if (Object.keys(data).length === 0) return;

  await prisma.dailyStock.upsert({
    where: { daily_stock_farmer_date: { farmerId, date } },
    create: { farmerId, date, ...data },
    update: data,
  });
}

/** The fields the two screens read and write, as plain JSON for the client. */
export function toEntryView(r: DailyReport | null, stock?: { feedBags: number | null; dieselLitres: number | null } | null) {
  return {
    feedKg: r?.feedKg ?? null,
    feedBags: r?.feedBags ?? null,
    waterLiters: r?.waterLiters ?? null,
    temperatureC: r?.temperatureC ?? null,
    mortalityCount: r ? r.mortalityCount : null,
    mortalityDay: r?.mortalityDay ?? null,
    mortalityNight: r?.mortalityNight ?? null,
    chickAgeDays: r?.chickAgeDays ?? null,
    remainingChicks: r?.remainingChicks ?? null,
    avgWeightGrams: r?.avgWeightGrams ?? null,
    medicineGiven: r?.medicineGiven ?? null,
    notes: r?.notes ?? null,
    humidityPct: r?.humidityPct ?? null,
    lightHours: r?.lightHours ?? null,
    ventilation: r?.ventilation ?? null,
    stockFeedBags: stock?.feedBags ?? null,
    dieselLitres: stock?.dieselLitres ?? null,
  };
}
