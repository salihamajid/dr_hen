import { THRESHOLDS } from "../thresholds";
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
      const direction = below > 0 ? "too low" : "too high";
      out.push({
        code: "TEMPERATURE_OUT_OF_RANGE",
        severity,
        dateKey: iso(r.date),
        titleEn: `Temperature ${direction}: ${r.temperatureC}°C on ${iso(r.date)}`,
        bodyEn:
          `${ctx.flock.name} recorded ${r.temperatureC}°C on ${iso(r.date)}. For birds in week ${band.week} a comfortable range is about ` +
          `${band.min}–${band.max}°C, so this is ${direction}. Check heating, ventilation and the birds' behaviour. ` +
          `If the birds look distressed, contact your vet.`,
        metrics: { temperatureC: r.temperatureC, week: band.week, min: band.min, max: band.max },
      });
    }
    return out;
  },
};
