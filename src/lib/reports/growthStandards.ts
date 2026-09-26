// Expected body weight by age, used only for the Growth report's "Expected Weight".
//
// NEEDS CLIENT SIGN-OFF. This project had no growth-target data, so the broiler
// curve below is an APPROXIMATE generic commercial-broiler reference (in the range
// published in the Cobb 500 / Ross 308 performance guides). Replace it with the
// targets Dr. Hen's vets actually want farmers measured against. Other breeds
// (layer, desi, ...) have no reference here, and the report says so rather than
// inventing one.

const DAY_MS = 24 * 60 * 60 * 1000;

/** [age in days, target grams] */
const BROILER_REFERENCE: ReadonlyArray<readonly [number, number]> = [
  [0, 42],
  [7, 190],
  [14, 475],
  [21, 950],
  [28, 1500],
  [35, 2150],
  [42, 2800],
  [49, 3400],
  [56, 3900],
];

export const GROWTH_REFERENCE_NOTE =
  "Reference targets are an approximate commercial-broiler guide, not a substitute for your breed's own performance sheet or your vet's advice.";

export function hasGrowthReference(breed: string): boolean {
  return /broiler|cobb|ross|hubbard/i.test(breed);
}

/** Linear interpolation between the reference points; null when there is no reference for the breed/age. */
export function expectedWeightGrams(breed: string, ageDays: number): number | null {
  if (!hasGrowthReference(breed) || ageDays < 0) return null;
  const first = BROILER_REFERENCE[0];
  const last = BROILER_REFERENCE[BROILER_REFERENCE.length - 1];
  if (ageDays > last[0]) return null;
  for (let i = 1; i < BROILER_REFERENCE.length; i++) {
    const [d1, g1] = BROILER_REFERENCE[i];
    if (ageDays <= d1) {
      const [d0, g0] = BROILER_REFERENCE[i - 1];
      return Math.round(g0 + ((g1 - g0) * (ageDays - d0)) / (d1 - d0));
    }
  }
  return first[1];
}

// Thresholds for the "Growth Rate" status: actual weight as a share of expected.
export const GROWTH_STATUS_BANDS = { above: 1.03, onTarget: 0.97, slightlyBelow: 0.9 } as const;

export type GrowthStatus = "ABOVE_TARGET" | "ON_TARGET" | "SLIGHTLY_BELOW" | "BELOW_TARGET";

export function growthStatus(actual: number, expected: number): GrowthStatus {
  const ratio = actual / expected;
  if (ratio >= GROWTH_STATUS_BANDS.above) return "ABOVE_TARGET";
  if (ratio >= GROWTH_STATUS_BANDS.onTarget) return "ON_TARGET";
  if (ratio >= GROWTH_STATUS_BANDS.slightlyBelow) return "SLIGHTLY_BELOW";
  return "BELOW_TARGET";
}

export const GROWTH_STATUS_LABEL: Record<GrowthStatus, string> = {
  ABOVE_TARGET: "Above target",
  ON_TARGET: "On target",
  SLIGHTLY_BELOW: "Slightly below target",
  BELOW_TARGET: "Below target",
};

// Whole calendar days, comparing UTC dates: a flock's startDate carries a time of day, but report
// dates are UTC midnight, so the raw difference would be a fraction of a day short.
export function ageInDays(startDate: Date, on: Date): number {
  const startDay = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  return Math.max(0, Math.round((on.getTime() - startDay) / DAY_MS));
}
