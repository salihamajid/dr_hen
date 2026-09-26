import { THRESHOLDS } from "../thresholds";
import { both } from "../messages";
import type { Rule } from "../types";
import { dailyMortality, iso } from "./mortality";

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Info-level early warning: losses rising three days running, even if no single day crossed the alert line.
export const mortalityTrend: Rule = {
  code: "MORTALITY_TREND",
  evaluate(ctx) {
    const { days, minPercent } = THRESHOLDS.mortalityTrend;
    const daily = dailyMortality(ctx);
    if (daily.length < days) return [];
    const last = daily.slice(-days);

    const consecutive = last.every((d, i) => i === 0 || d.date.getTime() - last[i - 1].date.getTime() === DAY_MS);
    const rising = last.every((d, i) => i === 0 || d.percent > last[i - 1].percent);
    const latest = last[last.length - 1];
    const recent = latest.date.getTime() >= ctx.today.getTime() - (THRESHOLDS.recentDays - 1) * DAY_MS;
    if (!consecutive || !rising || !recent || latest.percent <= minPercent) return [];

    const series = last.map((d) => `${round2(d.percent)}%`).join(" → ");
    const title = both("alertmsg.trendTitle", () => ({ days, flock: ctx.flock.name }));
    const body = both("alertmsg.trendBody", () => ({ flock: ctx.flock.name, series }));
    return [
      {
        code: "MORTALITY_TREND",
        severity: "INFO",
        dateKey: iso(latest.date),
        titleEn: title.en,
        titleUr: title.ur,
        bodyEn: body.en,
        bodyUr: body.ur,
        metrics: { latestPercent: round2(latest.percent), series },
      },
    ];
  },
};
