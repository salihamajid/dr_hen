import { getT, type I18nKey, type T } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LoadedReport } from "./queries";

const EN: T = getT("EN");

/** The report as ordered label/value rows: the single source for the screen, the WhatsApp text and the PDF. */
export function reportRows(r: LoadedReport, t: T = EN): { title: string; subtitle: string; rows: [string, string][] } {
  const n = (v: number | null | undefined, unit = "") => (v === null || v === undefined ? t("rep.notRecorded") : `${v.toLocaleString("en-IN")}${unit}`);
  const who = `${r.flock.name} (${r.flock.breed})`;
  // Units stay Latin (g, kg, L, °C) in both languages: they are what the farm scales and jugs are marked with.

  if (r.type === "mortality") {
    return {
      title: t("rep.title.mortality"),
      subtitle: t("rep.subRange", { who, from: r.from, to: r.to }),
      rows: [
        [t("rep.totalBirds"), r.totalBirds.toLocaleString("en-IN")],
        [t("rep.totalMortality"), t("rep.nBirds", { n: r.totalDeaths.toLocaleString("en-IN") })],
        [t("rep.mortalityPct"), `${r.percent}%`],
        [t("rep.daysWithEntry"), t("rep.aOfB", { a: r.entryDays, b: r.days.length })],
      ],
    };
  }

  if (r.type === "growth") {
    const rows: [string, string][] = [
      [
        t("rep.currentWeight"),
        r.current ? t("rep.currentWeightVal", { g: r.current.grams.toLocaleString("en-IN"), d: r.current.ageDays, date: r.current.date }) : t("rep.noWeight"),
      ],
      [t("rep.expectedWeight"), r.expectedGrams ? `${r.expectedGrams.toLocaleString("en-IN")} g` : r.hasReference ? t("common.na") : t("rep.noRefBreedShort")],
      [t("rep.growthRate"), r.status ? t(`growth.${r.status}` as I18nKey) : t("common.na")],
    ];
    return {
      title: t("rep.title.growth"),
      subtitle: `${who}, ${r.period === "all" ? t("rep.allWeeks") : t("rep.weeksOf", { p: r.period })}`,
      rows,
    };
  }

  const e = r.entry;
  return {
    title: t("rep.title.daily"),
    subtitle: `${who}, ${r.date}`,
    rows: e
      ? [
          [t("rep.feedUsed"), n(e.feedKg, " kg")],
          [t("rep.waterUsed"), n(e.waterLiters, " L")],
          [t("rep.mortality"), t("rep.nBirds", { n: e.mortalityCount })],
          [t("rep.avgWeight"), n(e.avgWeightGrams, " g")],
          [t("rep.temperature"), n(e.temperatureC, " °C")],
          [t("rep.humidity"), n(e.humidityPct, "%")],
          [t("rep.light"), e.lightHours === null ? t("rep.notRecorded") : t("rep.lightVal", { n: e.lightHours })],
          [t("rep.ventilation"), e.ventilation ? t(`vent.${e.ventilation}` as I18nKey) : t("rep.notRecorded")],
          // Farmer-reported history only, labelled as such. Never a recommendation.
          [t("rep.medicine"), e.medicineGiven || t("rep.noneRecorded")],
          [t("rep.remarks"), e.notes || t("rep.none")],
        ]
      : [[t("rep.status"), t("rep.noEntryDay")]],
  };
}

export function reportToText(r: LoadedReport, farmerName: string, lang: Lang = "EN"): string {
  const t = getT(lang);
  const { title, subtitle, rows } = reportRows(r, t);
  const lines = [`*${t("rep.whatsappTitle", { title })}*`, farmerName, subtitle, "", ...rows.map(([k, v]) => `${k}: ${v}`)];
  if (r.type === "growth" && r.hasReference) lines.push("", t("reports.refNote"));
  lines.push("", t("rep.footer"));
  return lines.join("\n");
}
