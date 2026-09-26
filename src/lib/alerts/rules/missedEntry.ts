import { THRESHOLDS } from "../thresholds";
import { both } from "../messages";
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

    const vars = () => ({ flock: ctx.flock.name, date: iso(yesterday) });
    const title = both("alertmsg.missedTitle", vars);
    const body = both("alertmsg.missedBody", vars);
    return [
      {
        code: "MISSED_ENTRY",
        severity: "INFO",
        dateKey: iso(yesterday),
        titleEn: title.en,
        titleUr: title.ur,
        bodyEn: body.en,
        bodyUr: body.ur,
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
