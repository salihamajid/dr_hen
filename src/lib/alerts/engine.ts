import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfUtcDay } from "@/lib/reports/dates";
import { RULES } from "./rules";
import { SEVERITY_RANK, type AlertCandidate, type RuleContext } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 10; // enough for the 3-day trend plus the recent-days cutoff

const dedupeKey = (farmerId: string, flockId: string, c: Pick<AlertCandidate, "code" | "dateKey">) =>
  `${farmerId}:${flockId}:${c.code}:${c.dateKey}`;

/**
 * Runs every rule for the farmer's active flocks (or just one) and stores what fires.
 *
 * Idempotent by construction: the dedupeKey is unique, so evaluating the same data 50 times
 * gives one alert. An existing alert is only ever touched to ESCALATE its severity (a
 * correction that makes a day worse), and never if the farmer already resolved it, so a
 * dismissed alert can't come back.
 *
 * farmerId must come from the session, never from a request.
 */
export async function evaluateAlerts(farmerId: string, opts: { flockId?: string } = {}): Promise<{ created: number }> {
  const today = startOfUtcDay(new Date());
  const windowStart = new Date(today.getTime() - (WINDOW_DAYS - 1) * DAY_MS);

  const flocks = await prisma.flock.findMany({
    where: { farmerId, active: true, ...(opts.flockId ? { id: opts.flockId } : {}) },
    select: { id: true, name: true, breed: true, sizeCount: true, startDate: true },
  });
  if (flocks.length === 0) return { created: 0 };

  const [reports, earlier] = await Promise.all([
    prisma.dailyReport.findMany({
      where: { farmerId, flockId: { in: flocks.map((f) => f.id) }, date: { gte: windowStart, lte: today } },
      orderBy: { date: "asc" },
      select: { flockId: true, date: true, mortalityCount: true, temperatureC: true },
    }),
    prisma.dailyReport.groupBy({
      by: ["flockId"],
      where: { farmerId, flockId: { in: flocks.map((f) => f.id) }, date: { lt: windowStart } },
      _sum: { mortalityCount: true },
    }),
  ]);
  const deathsBefore = new Map(earlier.map((e) => [e.flockId, e._sum.mortalityCount ?? 0]));

  let created = 0;
  for (const flock of flocks) {
    const ctx: RuleContext = {
      flock,
      today,
      reports: reports.filter((r) => r.flockId === flock.id),
      deathsBeforeWindow: deathsBefore.get(flock.id) ?? 0,
    };

    for (const rule of RULES) {
      for (const dateKey of rule.resolves?.(ctx) ?? []) {
        await prisma.alert.updateMany({
          where: { farmerId, flockId: flock.id, dedupeKey: dedupeKey(farmerId, flock.id, { code: rule.code, dateKey }), status: { not: "RESOLVED" } },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }
      for (const c of rule.evaluate(ctx)) created += await store(farmerId, flock.id, c);
    }
  }
  return { created };
}

async function store(farmerId: string, flockId: string, c: AlertCandidate): Promise<number> {
  const key = dedupeKey(farmerId, flockId, c);
  const existing = await prisma.alert.findUnique({ where: { dedupeKey: key }, select: { id: true, severity: true, status: true } });

  // Both languages are stored now, so the alert reads correctly whichever language the farmer uses.
  const text = { titleEn: c.titleEn, titleUr: c.titleUr, bodyEn: c.bodyEn, bodyUr: c.bodyUr, metrics: c.metrics as Prisma.InputJsonValue };

  if (existing) {
    if (existing.status !== "RESOLVED" && SEVERITY_RANK[c.severity] > SEVERITY_RANK[existing.severity]) {
      // Same event, now worse: raise it and mark it unread again. Never lowers, never reopens a resolved one.
      await prisma.alert.updateMany({ where: { id: existing.id, farmerId }, data: { severity: c.severity, readAt: null, ...text } });
    }
    return 0;
  }

  try {
    await prisma.alert.create({ data: { farmerId, flockId, code: c.code, severity: c.severity, dedupeKey: key, ...text } });
    return 1;
  } catch (err) {
    // Lost a race with a simultaneous evaluation: the alert exists, which is the goal.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return 0;
    throw err;
  }
}

// Render's free plan has no Cron Jobs, so the "nothing was entered" rules are evaluated
// lazily when a farmer opens the portal, at most once per farmer per interval.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const g = globalThis as unknown as { __drHenSweeps?: Map<string, number> };
const lastSweep = (g.__drHenSweeps ??= new Map<string, number>());

export async function sweepAlertsIfDue(farmerId: string): Promise<void> {
  const now = Date.now();
  if (now - (lastSweep.get(farmerId) ?? 0) < SWEEP_INTERVAL_MS) return;
  lastSweep.set(farmerId, now);
  try {
    await evaluateAlerts(farmerId);
  } catch (err) {
    lastSweep.delete(farmerId);
    console.error("[alerts] sweep failed:", err);
  }
}

/** Called after a farmer saves data. Alert trouble must never fail the save itself. */
export async function evaluateAfterSave(farmerId: string, flockId: string): Promise<void> {
  try {
    await evaluateAlerts(farmerId, { flockId });
  } catch (err) {
    console.error("[alerts] evaluation after save failed:", err);
  }
}
