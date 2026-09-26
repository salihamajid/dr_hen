import { THRESHOLDS } from "../thresholds";
import { both, word } from "../messages";
import type { AlertCandidate, Rule } from "../types";
import { iso } from "./mortality";

const DAY_MS = 24 * 60 * 60 * 1000;

function flockStartDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function temperatureBand(ageDays: number): { week: number; min: number; max: number } | null {
  const week = Math.floor(ageDays / 7) + 1;
  const band = THRESHOLDS.temperature.bands.find(([from, to]) => week >= from && week <= to);
  return band ? { week, min: band[2], max: band[3] } : null;
}

export const temperatureOutOfRange: Rule = {
  code: "TEMPERATURE_OUT_OF_RANGE",
  evaluate(ctx) {
    const cutoff = ctx.today.getTime() - (THRESHOLDS.recentDays - 1) * DAY_MS;
    const out: AlertCandidate[] = [];
    for (const r of ctx.reports) {
      if (r.temperatureC === null || r.date.getTime() < cutoff) continue;
      const ageDays = Math.max(0, Math.round((r.date.getTime() - flockStartDay(ctx.flock.startDate)) / DAY_MS));
      const band = temperatureBand(ageDays);
      if (!band) continue;

      const below = band.min - r.temperatureC;
      const above = r.temperatureC - band.max;
      const outBy = Math.max(below, above);
      if (outBy <= 0) continue;

      const severity = outBy >= THRESHOLDS.temperature.criticalMarginC ? "CRITICAL" : "ALERT";
      const dirKey = below > 0 ? "alertmsg.tempLow" : "alertmsg.tempHigh";
      const vars = (l: "EN" | "UR") => ({
        direction: word(l, dirKey),
        temp: r.temperatureC as number,
        date: iso(r.date),
        flock: ctx.flock.name,
        week: band.week,
        min: band.min,
        max: band.max,
      });
      const title = both("alertmsg.tempTitle", vars);
      const body = both("alertmsg.tempBody", vars);
      out.push({
        code: "TEMPERATURE_OUT_OF_RANGE",
        severity,
        dateKey: iso(r.date),
        titleEn: title.en,
        titleUr: title.ur,
        bodyEn: body.en,
        bodyUr: body.ur,
        metrics: { temperatureC: r.temperatureC, week: band.week, min: band.min, max: band.max },
      });
    }
    return out;
  },
};
