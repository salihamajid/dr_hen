import { prisma } from "@/lib/prisma";
import { ageInDays, expectedWeightGrams, growthStatus, hasGrowthReference, type GrowthStatus } from "./growthStandards";
import { parseDateOnly } from "./dates";
import type { ReportRequest } from "@/lib/validators/reportQuery";

// Every query here takes farmerId from the caller (always the session) and puts it
// in the WHERE beside any id from the request, so a report can only ever contain
// the logged-in farmer's own data.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;
const iso = (d: Date) => d.toISOString().slice(0, 10);

interface FlockInfo {
  id: string;
  name: string;
  breed: string;
  sizeCount: number;
  startDate: Date;
}

const flockSelect = { id: true, name: true, breed: true, sizeCount: true, startDate: true } as const;

export interface MortalityReport {
  type: "mortality";
  flock: FlockInfo;
  from: string;
  to: string;
  totalBirds: number;
  totalDeaths: number;
  /** Days in the range that have a saved entry. */
  entryDays: number;
  /** Deaths as a % of the birds placed in the flock. */
  percent: number;
  /** One item per calendar day; deaths is null when no entry was saved that day (not the same as zero deaths). */
  days: { date: string; deaths: number | null }[];
}

export interface GrowthReport {
  type: "growth";
  flock: FlockInfo;
  period: string;
  hasReference: boolean;
  current: { grams: number; date: string; ageDays: number } | null;
  expectedGrams: number | null;
  status: GrowthStatus | null;
  /** Ascending by age. `actual` only where the farmer recorded a weight; `expected` from the reference curve. */
  points: { ageDays: number; date: string | null; actual: number | null; expected: number | null }[];
}

/** One shed's line on the daily sheet. Chick age and remaining are derived, never typed. */
export interface ShedLine {
  flockId: string;
  name: string;
  breed: string;
  hasEntry: boolean;
  chickAgeDays: number;
  birdsPlaced: number;
  remaining: number;
  mortalityDay: number | null;
  mortalityNight: number | null;
  mortalityTotal: number;
  feedBags: number | null;
  avgWeightGrams: number | null;
  temperatureC: number | null;
  medicineGiven: string | null;
  notes: string | null;
}

/** The paper Daily Report: one day, every shed, plus the farm's stock. */
export interface DailyReportView {
  type: "daily";
  date: string;
  farmName: string;
  sheds: ShedLine[];
  stock: { feedBags: number | null; dieselLitres: number | null };
}

export type LoadedReport = MortalityReport | GrowthReport | DailyReportView;
export type LoadResult = { ok: true; report: LoadedReport } | { ok: false; status: 400 | 404; error: string };

export async function loadReport(farmerId: string, req: ReportRequest): Promise<LoadResult> {
  if (req.type === "daily") return loadDailySheet(farmerId, req.date);

  // The flock id from the request is only ever a filter beside the session's farmerId.
  const flock = await prisma.flock.findFirst({ where: { id: req.flockId, farmerId }, select: flockSelect });
  if (!flock) return { ok: false, status: 404, error: "Not found" };

  if (req.type === "mortality") {
    const from = parseDateOnly(req.from);
    const to = parseDateOnly(req.to);
    if (!from || !to) return { ok: false, status: 400, error: "Choose valid dates." };
    if (from > to) return { ok: false, status: 400, error: "The start date must be before the end date." };
    if ((to.getTime() - from.getTime()) / DAY_MS >= MAX_RANGE_DAYS) return { ok: false, status: 400, error: "Choose a range of up to a year." };

    const rows = await prisma.dailyReport.findMany({
      where: { farmerId, flockId: flock.id, date: { gte: from, lte: to } },
      select: { date: true, mortalityCount: true },
    });
    const byDay = new Map(rows.map((r) => [iso(r.date), r.mortalityCount]));
    const days: MortalityReport["days"] = [];
    for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
      const key = iso(new Date(t));
      days.push({ date: key, deaths: byDay.has(key) ? byDay.get(key)! : null });
    }
    const totalDeaths = rows.reduce((s, r) => s + r.mortalityCount, 0);
    return {
      ok: true,
      report: {
        type: "mortality",
        flock,
        from: req.from,
        to: req.to,
        totalBirds: flock.sizeCount,
        totalDeaths,
        entryDays: rows.length,
        percent: flock.sizeCount > 0 ? Math.round((totalDeaths / flock.sizeCount) * 10000) / 100 : 0,
        days,
      },
    };
  }

  if (req.type === "growth") {
    const rows = await prisma.dailyReport.findMany({
      where: { farmerId, flockId: flock.id, avgWeightGrams: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, avgWeightGrams: true },
    });
    const [w0, w1] = req.period === "1-4" ? [1, 4] : req.period === "5-8" ? [5, 8] : [1, 1000];
    const inPeriod = (ageDays: number) => Math.floor(ageDays / 7) + 1 >= w0 && Math.floor(ageDays / 7) + 1 <= w1;

    const actual = rows
      .map((r) => ({ date: iso(r.date), ageDays: ageInDays(flock.startDate, r.date), grams: r.avgWeightGrams! }))
      .filter((r) => inPeriod(r.ageDays));

    // Weekly reference marks inside the period, so the target line is a curve even between measurements.
    const pointMap = new Map<number, GrowthReport["points"][number]>();
    if (hasGrowthReference(flock.breed)) {
      const lastDay = w1 >= 1000 ? Math.max(56, ...actual.map((a) => a.ageDays)) : w1 * 7 - 1;
      for (let d = (w0 - 1) * 7; d <= Math.min(lastDay, 56); d += 7) {
        pointMap.set(d, { ageDays: d, date: null, actual: null, expected: expectedWeightGrams(flock.breed, d) });
      }
    }
    for (const a of actual) {
      pointMap.set(a.ageDays, { ageDays: a.ageDays, date: a.date, actual: a.grams, expected: expectedWeightGrams(flock.breed, a.ageDays) });
    }
    const points = [...pointMap.values()].sort((a, b) => a.ageDays - b.ageDays);

    const latest = actual.at(-1) ?? null;
    const expectedGrams = latest ? expectedWeightGrams(flock.breed, latest.ageDays) : null;
    return {
      ok: true,
      report: {
        type: "growth",
        flock,
        period: req.period,
        hasReference: hasGrowthReference(flock.breed),
        current: latest,
        expectedGrams,
        status: latest && expectedGrams ? growthStatus(latest.grams, expectedGrams) : null,
        points,
      },
    };
  }

  return { ok: false, status: 400, error: "Unknown report." };
}

async function loadDailySheet(farmerId: string, dateStr: string): Promise<LoadResult> {
  const date = parseDateOnly(dateStr);
  if (!date) return { ok: false, status: 400, error: "Choose a valid date." };

  const [farmer, flocks, entries, stock] = await Promise.all([
    prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true } }),
    prisma.flock.findMany({ where: { farmerId, active: true }, orderBy: { startDate: "asc" }, select: flockSelect }),
    prisma.dailyReport.findMany({ where: { farmerId, date } }),
    prisma.dailyStock.findFirst({ where: { farmerId, date } }),
  ]);
  if (!farmer) return { ok: false, status: 404, error: "Not found" };

  // Deaths up to and including the day, per shed, for the "remaining chicks" line.
  const deadToDate = await prisma.dailyReport.groupBy({
    by: ["flockId"],
    where: { farmerId, flockId: { in: flocks.map((f) => f.id) }, date: { lte: date } },
    _sum: { mortalityCount: true },
  });
  const deadBy = new Map(deadToDate.map((d) => [d.flockId, d._sum.mortalityCount ?? 0]));
  const entryBy = new Map(entries.filter((e) => e.flockId).map((e) => [e.flockId!, e]));

  const sheds: ShedLine[] = flocks.map((f) => {
    const e = entryBy.get(f.id) ?? null;
    return {
      flockId: f.id,
      name: f.name,
      breed: f.breed,
      hasEntry: !!e,
      // The farmer's own figure wins; the worked-out one is the fallback.
      chickAgeDays: e?.chickAgeDays ?? ageInDays(f.startDate, date),
      birdsPlaced: f.sizeCount,
      remaining: e?.remainingChicks ?? Math.max(0, f.sizeCount - (deadBy.get(f.id) ?? 0)),
      mortalityDay: e?.mortalityDay ?? null,
      mortalityNight: e?.mortalityNight ?? null,
      mortalityTotal: e?.mortalityCount ?? 0,
      feedBags: e?.feedBags ?? null,
      avgWeightGrams: e?.avgWeightGrams ?? null,
      temperatureC: e?.temperatureC ?? null,
      medicineGiven: e?.medicineGiven ?? null,
      notes: e?.notes ?? null,
    };
  });

  return {
    ok: true,
    report: {
      type: "daily",
      date: dateStr,
      farmName: farmer.name,
      sheds,
      stock: { feedBags: stock?.feedBags ?? null, dieselLitres: stock?.dieselLitres ?? null },
    },
  };
}
