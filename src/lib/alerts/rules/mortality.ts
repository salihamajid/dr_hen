import { THRESHOLDS } from "../thresholds";
import type { AlertCandidate, Rule, RuleContext, Severity } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Each report's deaths as a % of the birds still alive at the start of that day. */
export function dailyMortality(ctx: RuleContext) {
  let alive = ctx.flock.sizeCount - ctx.deathsBeforeWindow;
  return ctx.reports.map((r) => {
    const base = Math.max(1, alive);
    alive -= r.mortalityCount;
    return { date: r.date, deaths: r.mortalityCount, alive: base, percent: (r.mortalityCount / base) * 100 };
  });
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export const mortalitySpike: Rule = {
  code: "MORTALITY_SPIKE",
  evaluate(ctx) {
    const cutoff = ctx.today.getTime() - (THRESHOLDS.recentDays - 1) * DAY_MS;
    const out: AlertCandidate[] = [];
    for (const d of dailyMortality(ctx)) {
      if (d.date.getTime() < cutoff) continue;
      const { alertPercent, criticalPercent } = THRESHOLDS.mortality;
      const severity: Severity | null = d.percent > criticalPercent ? "CRITICAL" : d.percent > alertPercent ? "ALERT" : null;
      if (!severity) continue;
      const level = severity === "CRITICAL" ? criticalPercent : alertPercent;
      out.push({
        code: "MORTALITY_SPIKE",
        severity,
        dateKey: iso(d.date),
        titleEn: `${severity === "CRITICAL" ? "Critical" : "High"} mortality: ${round1(d.percent)}% on ${iso(d.date)}`,
        bodyEn:
          `${d.deaths} birds died in ${ctx.flock.name} on ${iso(d.date)}, which is ${round1(d.percent)}% of the ${d.alive.toLocaleString("en-IN")} birds remaining ` +
          `(alert level is above ${level}%). Please check the flock for signs of disease. ` +
          `Ask the Dr. Hen AI Assistant, or type VET in the chat to reach a Field Vet. A sudden rise in deaths should be reviewed by a qualified vet.`,
        metrics: { deaths: d.deaths, birdsRemaining: d.alive, percent: round1(d.percent), threshold: level },
      });
    }
    return out;
  },
};
