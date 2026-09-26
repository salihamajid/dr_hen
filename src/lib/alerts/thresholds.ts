// Every number that decides whether an alert fires lives here, so tuning a rule never
// means editing rule code.
//
// The mortality numbers were chosen with the client. The temperature bands are a
// generic broiler guide and NEED VET SIGN-OFF before they are relied on.

export const THRESHOLDS = {
  mortality: {
    /** Daily deaths as a % of birds remaining. Strictly above triggers. */
    alertPercent: 1,
    criticalPercent: 3,
  },
  mortalityTrend: {
    /** Three consecutive days each higher than the last, with the latest above this %. */
    minPercent: 0.5,
    days: 3,
  },
  temperature: {
    /** Outside the age band by at least this many °C is Critical, otherwise Alert. */
    criticalMarginC: 5,
    /** [from week, to week (inclusive), min °C, max °C] */
    bands: [
      [1, 1, 30, 35],
      [2, 2, 27, 32],
      [3, 3, 24, 29],
      [4, 99, 18, 28],
    ] as ReadonlyArray<readonly [number, number, number, number]>,
  },
  /** Only entries this recent can raise an alert, so backfilling old days doesn't flood the farmer. */
  recentDays: 3,
} as const;
