import type { Rule } from "../types";
import { missedEntry } from "./missedEntry";
import { mortalitySpike } from "./mortality";
import { mortalityTrend } from "./mortalityTrend";
import { temperatureOutOfRange } from "./temperature";

// Adding a rule = one file exporting a Rule + one entry here. Nothing else changes.
export const RULES: readonly Rule[] = [mortalitySpike, mortalityTrend, temperatureOutOfRange, missedEntry];
