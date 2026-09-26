const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Every farmer-written DailyReport.date is a UTC-midnight timestamp. The default
 * `now()` timestamp would defeat the (farmer, flock, date) unique constraint,
 * so all writes normalise through here.
 */
export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** "YYYY-MM-DD" -> UTC midnight, or null if it isn't a real calendar date. */
export function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === value ? d : null;
}

/**
 * Entries may be for up to a year back and up to tomorrow (UTC): a farmer in
 * Pakistan (UTC+5) is a calendar day ahead of UTC for the first hours of their day.
 */
export function isAllowedEntryDate(date: Date, now = Date.now()): boolean {
  const today = startOfUtcDay(new Date(now)).getTime();
  const t = date.getTime();
  return t <= today + DAY_MS && t >= today - 365 * DAY_MS;
}
