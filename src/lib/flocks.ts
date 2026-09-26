const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Age in whole weeks today, from the flock's start date (Flock.ageWeeks is only the age when it was added). */
export function flockAgeWeeks(startDate: Date): number {
  return Math.max(0, Math.floor((Date.now() - startDate.getTime()) / WEEK_MS));
}

/** The start date that makes a flock `ageWeeks` old right now. */
export function startDateForAge(ageWeeks: number): Date {
  return new Date(Date.now() - ageWeeks * WEEK_MS);
}
