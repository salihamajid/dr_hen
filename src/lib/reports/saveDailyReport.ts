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

/** The fields the two screens read and write, as plain JSON for the client. */
export function toEntryView(r: DailyReport | null) {
  return {
    feedKg: r?.feedKg ?? null,
    waterLiters: r?.waterLiters ?? null,
    temperatureC: r?.temperatureC ?? null,
    mortalityCount: r ? r.mortalityCount : null,
    medicineGiven: r?.medicineGiven ?? null,
    notes: r?.notes ?? null,
    humidityPct: r?.humidityPct ?? null,
    lightHours: r?.lightHours ?? null,
    ventilation: r?.ventilation ?? null,
  };
}
