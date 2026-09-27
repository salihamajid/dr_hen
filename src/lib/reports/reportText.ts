import { getT, type I18nKey, type Lang, type T } from "@/lib/i18n";
import type { LoadedReport } from "./queries";

const EN: T = getT("EN");

export interface ReportSection {
  /** Shown as a sub-heading; null for a report that is just one block of rows. */
  heading: string | null;
  rows: [string, string][];
}

export interface ReportView {
  title: string;
  subtitle: string;
  sections: ReportSection[];
  /** Small print under the report: disclaimers, who recorded it. */
  footnotes: string[];
}

/**
 * The single description of a report, used by the screen, the WhatsApp text and the PDF, so the
 * three can never drift apart. Units stay Latin (g, kg, L, °C) in both languages: that is how
 * farm scales, jugs and thermometers are marked.
 */
export function buildReport(r: LoadedReport, t: T = EN): ReportView {
  const n = (v: number | null | undefined, unit = "") => (v === null || v === undefined ? t("rep.notRecorded") : `${v.toLocaleString("en-IN")}${unit}`);

  if (r.type === "mortality") {
    const who = `${r.flock.name} (${r.flock.breed})`;
    return {
      title: t("rep.title.mortality"),
      subtitle: t("rep.subRange", { who, from: r.from, to: r.to }),
      sections: [
        {
          heading: null,
          rows: [
            [t("rep.totalBirds"), r.totalBirds.toLocaleString("en-IN")],
            [t("rep.totalMortality"), t("rep.nBirds", { n: r.totalDeaths.toLocaleString("en-IN") })],
            [t("rep.mortalityPct"), `${r.percent}%`],
            [t("rep.daysWithEntry"), t("rep.aOfB", { a: r.entryDays, b: r.days.length })],
          ],
        },
      ],
      footnotes: [t("rep.footer")],
    };
  }

  if (r.type === "growth") {
    const who = `${r.flock.name} (${r.flock.breed})`;
    return {
      title: t("rep.title.growth"),
      subtitle: `${who}, ${r.period === "all" ? t("rep.allWeeks") : t("rep.weeksOf", { p: r.period })}`,
      sections: [
        {
          heading: null,
          rows: [
            [
              t("rep.currentWeight"),
              r.current ? t("rep.currentWeightVal", { g: r.current.grams.toLocaleString("en-IN"), d: r.current.ageDays, date: r.current.date }) : t("rep.noWeight"),
            ],
            [t("rep.expectedWeight"), r.expectedGrams ? `${r.expectedGrams.toLocaleString("en-IN")} g` : r.hasReference ? t("common.na") : t("rep.noRefBreedShort")],
            [t("rep.growthRate"), r.status ? t(`growth.${r.status}` as I18nKey) : t("common.na")],
          ],
        },
      ],
      footnotes: r.hasReference ? [t("reports.refNote"), t("rep.footer")] : [t("rep.footer")],
    };
  }

  // The paper Daily Report: a block per shed, then the farm's stock.
  const sections: ReportSection[] = r.sheds.map((s) => ({
    heading: `${s.name} (${s.breed})`,
    rows: s.hasEntry
      ? ([
          [t("rep.chickAge"), t("rep.days", { n: s.chickAgeDays })],
          [t("rep.mortalityDay"), s.mortalityDay === null ? t("rep.notRecorded") : t("rep.nBirds", { n: s.mortalityDay })],
          [t("rep.mortalityNight"), s.mortalityNight === null ? t("rep.notRecorded") : t("rep.nBirds", { n: s.mortalityNight })],
          [t("rep.mortalityTotal"), t("rep.nBirds", { n: s.mortalityTotal })],
          [t("rep.remaining"), t("rep.nBirds", { n: s.remaining.toLocaleString("en-IN") })],
          [t("rep.feedBags"), s.feedBags === null ? t("rep.notRecorded") : t("rep.bags", { n: s.feedBags })],
          [t("rep.avgWeight"), n(s.avgWeightGrams, " g")],
          [t("rep.temperature"), n(s.temperatureC, " °C")],
          // Farmer-reported history only, labelled as such. Never a recommendation.
          [t("rep.medicine"), s.medicineGiven || t("rep.noneRecorded")],
          [t("rep.remarks"), s.notes || t("rep.none")],
        ] as [string, string][])
      : ([
          [t("rep.chickAge"), t("rep.days", { n: s.chickAgeDays })],
          [t("rep.status"), t("rep.noEntryShed")],
        ] as [string, string][]),
  }));

  sections.push({
    heading: t("rep.stock"),
    rows: [
      [t("rep.feedBags"), r.stock.feedBags === null ? t("rep.notRecorded") : t("rep.bags", { n: r.stock.feedBags })],
      [t("rep.diesel"), r.stock.dieselLitres === null ? t("rep.notRecorded") : t("rep.litres", { n: r.stock.dieselLitres })],
    ],
  });

  return {
    title: t("rep.title.daily"),
    subtitle: t("rep.dailyForDate", { date: r.date }),
    sections,
    footnotes: [`${t("rep.recordedBy")}: ${r.farmName}`, t("rep.footer")],
  };
}

export function reportToText(r: LoadedReport, farmerName: string, lang: Lang = "EN"): string {
  const t = getT(lang);
  const view = buildReport(r, t);
  const lines = [`*${t("rep.whatsappTitle", { title: view.title })}*`, farmerName, view.subtitle];
  for (const section of view.sections) {
    lines.push("");
    if (section.heading) lines.push(`*${section.heading}*`);
    for (const [k, v] of section.rows) lines.push(`${k}: ${v}`);
  }
  lines.push("", ...view.footnotes);
  return lines.join("\n");
}
