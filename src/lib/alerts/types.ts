export type Severity = "INFO" | "ALERT" | "CRITICAL";

export const SEVERITY_RANK: Record<Severity, number> = { INFO: 0, ALERT: 1, CRITICAL: 2 };

export interface FlockLite {
  id: string;
  name: string;
  breed: string;
  sizeCount: number;
  startDate: Date;
}

export interface ReportLite {
  /** UTC midnight. */
  date: Date;
  mortalityCount: number;
  temperatureC: number | null;
}

/** Everything a rule may look at. Rules are pure: they never touch the database or the clock. */
export interface RuleContext {
  flock: FlockLite;
  /** Today at UTC midnight. */
  today: Date;
  /** This flock's reports for the last few days, ascending by date. */
  reports: ReportLite[];
  /** Deaths recorded for this flock before the first report in `reports`, so the "birds remaining" base is right. */
  deathsBeforeWindow: number;
}

export interface AlertCandidate {
  code: string;
  severity: Severity;
  /** YYYY-MM-DD the alert is about. With flock + code it makes the dedupe key, so re-evaluating never duplicates. */
  dateKey: string;
  titleEn: string;
  bodyEn: string;
  metrics: Record<string, number | string | null>;
}

export interface Rule {
  code: string;
  evaluate(ctx: RuleContext): AlertCandidate[];
  /** Optional: alerts of this rule's code that are no longer true (e.g. a missed entry that was later filled in). */
  resolves?(ctx: RuleContext): string[];
}
