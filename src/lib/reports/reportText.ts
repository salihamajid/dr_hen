import { GROWTH_STATUS_LABEL, GROWTH_REFERENCE_NOTE } from "./growthStandards";
import type { LoadedReport } from "./queries";

const n = (v: number | null | undefined, unit = "") => (v === null || v === undefined ? "not recorded" : `${v.toLocaleString("en-IN")}${unit}`);
const VENT: Record<string, string> = { POOR: "Poor", AVERAGE: "Average", GOOD: "Good" };

/** The report as ordered label/value rows: the single source for the WhatsApp text and the PDF. */
export function reportRows(r: LoadedReport): { title: string; subtitle: string; rows: [string, string][] } {
  const who = `${r.flock.name} (${r.flock.breed})`;

  if (r.type === "mortality") {
    return {
      title: "Mortality Report",
      subtitle: `${who}, ${r.from} to ${r.to}`,
      rows: [
        ["Total birds", n(r.totalBirds)],
        ["Total mortality", `${n(r.totalDeaths)} birds`],
        ["Mortality %", `${r.percent}%`],
        ["Days with an entry", `${r.entryDays} of ${r.days.length}`],
      ],
    };
  }

  if (r.type === "growth") {
    const rows: [string, string][] = [
      ["Current weight", r.current ? `${n(r.current.grams, " g")} (day ${r.current.ageDays}, ${r.current.date})` : "no weight recorded"],
      ["Expected weight", r.expectedGrams ? n(r.expectedGrams, " g") : r.hasReference ? "n/a" : "no reference for this breed"],
      ["Growth rate", r.status ? GROWTH_STATUS_LABEL[r.status] : "n/a"],
    ];
    return { title: "Growth Report", subtitle: `${who}, ${r.period === "all" ? "all weeks" : `weeks ${r.period}`}`, rows };
  }

  const e = r.entry;
  return {
    title: "Daily Report",
    subtitle: `${who}, ${r.date}`,
    rows: e
      ? [
          ["Feed used", n(e.feedKg, " kg")],
          ["Water used", n(e.waterLiters, " L")],
          ["Mortality", `${e.mortalityCount} birds`],
          ["Average weight", n(e.avgWeightGrams, " g")],
          ["Temperature", n(e.temperatureC, " °C")],
          ["Humidity", n(e.humidityPct, "%")],
          ["Light", n(e.lightHours, " hours")],
          ["Ventilation", e.ventilation ? VENT[e.ventilation] : "not recorded"],
          // Farmer-reported history only, labelled as such. Never a recommendation.
          ["Medicine given (as recorded by you)", e.medicineGiven || "none recorded"],
          ["Remarks", e.notes || "none"],
        ]
      : [["Status", "No entry saved for this day"]],
  };
}

export function reportToText(r: LoadedReport, farmerName: string): string {
  const { title, subtitle, rows } = reportRows(r);
  const lines = [`*Dr. Hen: ${title}*`, `${farmerName}`, subtitle, "", ...rows.map(([k, v]) => `${k}: ${v}`)];
  if (r.type === "growth" && r.hasReference) lines.push("", GROWTH_REFERENCE_NOTE);
  lines.push("", "This report summarises your own records. It does not replace a vet's assessment.");
  return lines.join("\n");
}
