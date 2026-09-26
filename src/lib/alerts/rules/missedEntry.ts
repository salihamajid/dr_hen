import { THRESHOLDS } from "../thresholds";
import type { Rule } from "../types";
import { iso } from "./mortality";

const DAY_MS = 24 * 60 * 60 * 1000;

// Yesterday has no saved entry. This is the rule that needs the lazy sweep, because
// nothing is written on a day the farmer does nothing.
export const missedEntry: Rule = {
  code: "MISSED_ENTRY",
  evaluate(ctx) {
    const yesterday = new Date(ctx.today.getTime() - DAY_MS);
    const flockStartDay = Date.UTC(ctx.flock.startDate.getUTCFullYear(), ctx.flock.startDate.getUTCMonth(), ctx.flock.startDate.getUTCDate());
    if (flockStartDay > yesterday.getTime()) return []; // the flock didn't exist yet
    if (ctx.reports.some((r) => r.date.getTime() === yesterday.getTime())) return [];

    return [
      {
        code: "MISSED_ENTRY",
        severity: "INFO",
        dateKey: iso(yesterday),
        titleEn: `No entry for ${ctx.flock.name} on ${iso(yesterday)}`,
        bodyEn:
          `You haven't recorded feed, water, deaths or temperature for ${ctx.flock.name} on ${iso(yesterday)}. ` +
          `You can still add it from Daily Entry. Regular entries keep your reports and alerts accurate.`,
        metrics: { date: iso(yesterday) },
      },
    ];
  },
  // A late entry for one of the last few days makes the "missed" alert for that day untrue.
  resolves(ctx) {
    const since = ctx.today.getTime() - THRESHOLDS.recentDays * DAY_MS;
    return ctx.reports.filter((r) => r.date.getTime() >= since).map((r) => iso(r.date));
  },
};
