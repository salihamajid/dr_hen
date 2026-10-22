import "server-only";

import { prisma } from "@/lib/prisma";
import { startOfUtcDay } from "@/lib/reports/dates";

/**
 * Everything on the farmer's dashboard, read from this farm's own rows.
 *
 * farmerId comes from requireFarmer() and is a filter on every query here — never a lookup by
 * id alone — so there is no path by which one farm's figures could reach another's screen.
 *
 * As on the admin side, each derived number carries its definition. A farmer acting on
 * "18 days of feed left" deserves to know it is an estimate from their own recent use.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const UNRESOLVED = { not: "RESOLVED" } as const;
/** 50 kg a bag — the standard sack on Pakistani broiler farms, and what the paper sheet counts. */
export const KG_PER_FEED_BAG = 50;

export interface HealthBand {
  healthyBirds: number;
  mildBirds: number;
  atRiskBirds: number;
  liveBirds: number;
}

export interface VaccinationRow {
  id: string;
  name: string;
  date: string;
  /** Negative = overdue, 0 = today. */
  daysAway: number | null;
  state: "DONE" | "UPCOMING" | "OVERDUE";
  flockName: string;
}

/**
 * A row carries its kind and its numbers, not finished sentences: the dashboard is bilingual,
 * so the wording is chosen on the page from the farmer's language, never fixed here.
 * The one exception is an alert, whose wording was frozen in both languages when it fired.
 */
export interface ActivityRow {
  id: string;
  kind: "ENTRY" | "VACCINATION" | "VET" | "FEED_ORDER" | "ALERT_CLEARED";
  at: Date;
  flockName?: string;
  count?: number;
  name?: string;
  state?: string;
  textEn?: string;
  textUr?: string;
}

export interface FeedStock {
  /** null when no stock has been recorded. */
  bags: number | null;
  /** null when there is not enough recent use to estimate from. */
  daysLeft: number | null;
  kg: number | null;
  averageBagsPerDay: number | null;
}

export interface FarmerDashboard {
  farmName: string;
  flockCount: number;
  placedBirds: number;
  liveBirds: number;
  deaths: number;
  health: HealthBand;
  /** Share of live birds in flocks with nothing open against them. null when there are no birds. */
  healthPercent: number | null;
  openAlerts: number;
  criticalAlerts: number;
  feed: FeedStock;
  nextVaccination: VaccinationRow | null;
  vaccinations: VaccinationRow[];
  activities: ActivityRow[];
  entriesThisWeek: number;
  deathsThisWeek: number;
  /** Today's entry is already saved for every active flock. */
  todayRecorded: boolean;
}

export async function loadFarmerDashboard(farmerId: string): Promise<FarmerDashboard> {
  const now = new Date();
  const today = startOfUtcDay(now);
  const weekStart = new Date(today.getTime() - 7 * DAY_MS);

  const [farmer, flocks, deathsAgg, weekAgg, openAlertRows, stock, recentFeed, vaccinations, recentReports, clearedAlerts, vetRequests, feedOrders, todayEntries] =
    await Promise.all([
      prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true } }),
      prisma.flock.findMany({
        where: { farmerId, active: true },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, sizeCount: true, createdAt: true },
      }),
      prisma.dailyReport.aggregate({ where: { farmerId }, _sum: { mortalityCount: true } }),
      prisma.dailyReport.aggregate({ where: { farmerId, date: { gte: weekStart } }, _count: { _all: true }, _sum: { mortalityCount: true } }),
      prisma.alert.groupBy({ by: ["flockId", "severity"], where: { farmerId, status: UNRESOLVED }, _count: { _all: true } }),

      prisma.dailyStock.findFirst({ where: { farmerId }, orderBy: { date: "desc" }, select: { feedBags: true, date: true } }),
      // Feed actually used, per shed per day, over the last week — the only basis we have for
      // "how long will the stock last".
      prisma.dailyReport.findMany({
        where: { farmerId, date: { gte: weekStart }, feedBags: { not: null } },
        select: { date: true, feedBags: true },
      }),

      prisma.vaccination.findMany({
        where: { farmerId },
        orderBy: { scheduledDate: "desc" },
        take: 8,
        select: { id: true, vaccineName: true, scheduledDate: true, administeredDate: true, status: true, flock: { select: { name: true } } },
      }),

      // The activity feed is derived from what the farm already records. Farmers are not asked
      // to log chores twice just to fill a panel.
      prisma.dailyReport.findMany({
        where: { farmerId },
        orderBy: { date: "desc" },
        take: 4,
        select: { id: true, date: true, updatedAt: true, mortalityCount: true, feedBags: true, flock: { select: { name: true } } },
      }),
      prisma.alert.findMany({
        where: { farmerId, status: "RESOLVED", resolvedAt: { not: null } },
        orderBy: { resolvedAt: "desc" },
        take: 3,
        select: { id: true, titleEn: true, titleUr: true, resolvedAt: true },
      }),
      prisma.vetEscalation.findMany({ where: { farmerId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, status: true, createdAt: true } }),
      prisma.feedOrder.findMany({ where: { farmerId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, bags: true, status: true, createdAt: true } }),
      prisma.dailyReport.groupBy({ by: ["flockId"], where: { farmerId, date: today, flockId: { not: null } } }),
    ]);

  const placedBirds = flocks.reduce((s, f) => s + f.sizeCount, 0);
  const deaths = deathsAgg._sum.mortalityCount ?? 0;
  const liveBirds = Math.max(0, placedBirds - deaths);

  // --- health bands, by bird, from each flock's open alerts
  const worstByFlock = new Map<string, "CRITICAL" | "ALERT" | "INFO">();
  const RANK = { INFO: 1, ALERT: 2, CRITICAL: 3 } as const;
  let openAlerts = 0;
  let criticalAlerts = 0;
  for (const row of openAlertRows) {
    openAlerts += row._count._all;
    if (row.severity === "CRITICAL") criticalAlerts += row._count._all;
    if (!row.flockId) continue;
    const next = row.severity as "CRITICAL" | "ALERT" | "INFO";
    const current = worstByFlock.get(row.flockId);
    if (!current || RANK[next] > RANK[current]) worstByFlock.set(row.flockId, next);
  }

  // Deaths are not attributed per flock here, so each flock's living birds are estimated by
  // its share of the placed total. Stated plainly rather than implied.
  const survival = placedBirds === 0 ? 1 : liveBirds / placedBirds;
  const health: HealthBand = { healthyBirds: 0, mildBirds: 0, atRiskBirds: 0, liveBirds };
  for (const flock of flocks) {
    const alive = Math.round(flock.sizeCount * survival);
    const worst = worstByFlock.get(flock.id);
    // Severity matters, not merely "something is open". An INFO alert is paperwork — a day
    // with no entry recorded — and letting that paint every bird as unwell would make the
    // figure useless on exactly the farms that most need it to mean something.
    if (worst === "CRITICAL") health.atRiskBirds += alive;
    else if (worst === "ALERT") health.mildBirds += alive;
    else health.healthyBirds += alive;
  }
  const bandTotal = health.healthyBirds + health.mildBirds + health.atRiskBirds;
  const healthPercent = bandTotal === 0 ? null : Math.round((health.healthyBirds / bandTotal) * 100);

  // --- feed stock
  const daysWithFeed = new Set(recentFeed.map((r) => r.date.toISOString().slice(0, 10)));
  const totalBagsUsed = recentFeed.reduce((s, r) => s + (r.feedBags ?? 0), 0);
  const averageBagsPerDay = daysWithFeed.size > 0 && totalBagsUsed > 0 ? totalBagsUsed / daysWithFeed.size : null;
  const bags = stock?.feedBags ?? null;
  const feed: FeedStock = {
    bags,
    averageBagsPerDay,
    kg: bags === null ? null : Math.round(bags * KG_PER_FEED_BAG),
    daysLeft: bags === null || averageBagsPerDay === null ? null : Math.max(0, Math.floor(bags / averageBagsPerDay)),
  };

  // --- vaccinations
  const toRow = (v: (typeof vaccinations)[number]): VaccinationRow => {
    const due = startOfUtcDay(v.scheduledDate);
    const daysAway = Math.round((due.getTime() - today.getTime()) / DAY_MS);
    const done = v.status === "COMPLETED" || v.administeredDate !== null;
    return {
      id: v.id,
      name: v.vaccineName,
      date: v.scheduledDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      daysAway: done ? null : daysAway,
      state: done ? "DONE" : daysAway < 0 ? "OVERDUE" : "UPCOMING",
      flockName: v.flock?.name ?? "",
    };
  };
  const rows = vaccinations.map(toRow);
  // Soonest first among what is still outstanding; an overdue dose outranks a future one.
  const pending = rows.filter((r) => r.state !== "DONE").sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
  const nextVaccination = pending.find((r) => r.state === "OVERDUE") ?? pending[0] ?? null;

  // --- recent activity, merged from what already exists
  const vaccinationById = new Map(vaccinations.map((v) => [v.id, v]));
  const activities: ActivityRow[] = [
    ...recentReports.map((r) => ({
      id: `entry-${r.id}`,
      kind: "ENTRY" as const,
      flockName: r.flock?.name,
      count: r.mortalityCount,
      at: r.updatedAt ?? r.date,
    })),
    ...rows
      .filter((r) => r.state === "DONE")
      .slice(0, 2)
      .map((r) => ({
        id: `vacc-${r.id}`,
        kind: "VACCINATION" as const,
        name: r.name,
        // The date it was actually given, not the date it was scheduled for.
        at: vaccinationById.get(r.id)?.administeredDate ?? (vaccinationById.get(r.id)?.scheduledDate as Date),
      })),
    ...clearedAlerts.map((a) => ({
      id: `alert-${a.id}`,
      kind: "ALERT_CLEARED" as const,
      textEn: a.titleEn,
      textUr: a.titleUr,
      at: a.resolvedAt as Date,
    })),
    ...vetRequests.map((v) => ({ id: `vet-${v.id}`, kind: "VET" as const, state: v.status, at: v.createdAt })),
    ...feedOrders.map((f) => ({ id: `feed-${f.id}`, kind: "FEED_ORDER" as const, count: f.bags, state: f.status, at: f.createdAt })),
  ]
    .filter((a) => a.at instanceof Date && !Number.isNaN(a.at.getTime()))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  return {
    farmName: farmer?.name ?? "",
    flockCount: flocks.length,
    placedBirds,
    liveBirds,
    deaths,
    health,
    healthPercent,
    openAlerts,
    criticalAlerts,
    feed,
    nextVaccination,
    vaccinations: [...pending, ...rows.filter((r) => r.state === "DONE")].slice(0, 4),
    activities,
    entriesThisWeek: weekAgg._count._all,
    deathsThisWeek: weekAgg._sum.mortalityCount ?? 0,
    todayRecorded: flocks.length > 0 && todayEntries.length >= flocks.length,
  };
}
