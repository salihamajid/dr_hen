import { translate, type I18nKey } from "@/lib/i18n";
import type { DailyReportView } from "./queries";

/**
 * The farm's paper Daily Report, as data.
 *
 * Labels are bilingual ("Chick Age | مرغی کی عمر") whatever language the farmer picked, because
 * that is how the printed sheet reads and because a sheet forwarded on WhatsApp gets opened by
 * whoever the farmer sends it to. The `en` mode exists for the PDF, whose writer draws Latin
 * glyphs only.
 */
export type LabelMode = "bilingual" | "en";

const label = (mode: LabelMode, key: I18nKey) =>
  mode === "en" ? translate("EN", key) : `${translate("EN", key)} | ${translate("UR", key)}`;

export interface SheetRow {
  label: string;
  value: string;
  /** Rendered as a pair on one line, like the sheet's Day / Night row. */
  second?: { label: string; value: string };
}

export interface SheetShed {
  /** "Shed 1 | شیڈ 1" — the sheet's own numbering. */
  heading: string;
  /** The flock's real name and breed, so the numbering can't hide which shed this is. */
  subtitle: string;
  hasEntry: boolean;
  rows: SheetRow[];
  /** Values the app records that the paper sheet has no line for. Empty when none were entered. */
  extras: string;
}

export interface DailySheet {
  title: string;
  dateLabel: string;
  date: string;
  farmLabel: string;
  farmName: string;
  sheds: SheetShed[];
  stockHeading: string;
  stockRow: SheetRow;
  notesLabel: string;
  notes: string;
  signatureLabel: string;
  signature: string;
  footer: string;
}

export function buildDailySheet(r: DailyReportView, mode: LabelMode = "bilingual"): DailySheet {
  const L = (key: I18nKey) => label(mode, key);
  const num = (v: number | null, unit: string) => (v === null ? "—" : `${v.toLocaleString("en-IN")}${unit}`);

  const sheds: SheetShed[] = r.sheds.map((s, i) => {
    const shedNo = i + 1;
    const extras: string[] = [];
    if (s.temperatureC !== null) extras.push(`${translate("EN", "rep.temperature")}: ${s.temperatureC} °C`);
    if (s.avgWeightGrams !== null) extras.push(`${translate("EN", "rep.avgWeight")}: ${s.avgWeightGrams} g`);
    // Farmer-reported history, never a recommendation.
    if (s.medicineGiven) extras.push(`${translate("EN", "rep.medicine")}: ${s.medicineGiven}`);

    return {
      heading: mode === "en" ? `Shed ${shedNo}` : `Shed ${shedNo} | شیڈ ${shedNo}`,
      subtitle: `${s.name} · ${s.breed}`,
      hasEntry: s.hasEntry,
      extras: extras.join(" · "),
      rows: [
        { label: L("rep.chickAge"), value: `${s.chickAgeDays} ${translate("EN", "unit.days")}` },
        {
          label: `${L("rep.mortality")} — ${L("rep.day")}`,
          value: num(s.mortalityDay, ""),
          second: { label: L("rep.night"), value: num(s.mortalityNight, "") },
        },
        { label: L("rep.total"), value: String(s.mortalityTotal) },
        { label: L("rep.remaining"), value: s.remaining.toLocaleString("en-IN") },
        { label: L("rep.feedBags"), value: num(s.feedBags, ` ${translate("EN", "unit.bags")}`) },
      ],
    };
  });

  // The sheet has one Notes line for the whole day, so per-shed remarks are gathered here.
  const notes = r.sheds
    .filter((s) => s.notes)
    .map((s) => (r.sheds.length > 1 ? `${s.name}: ${s.notes}` : s.notes))
    .join(" · ");

  return {
    title: mode === "en" ? "Daily Report" : "Daily Report | روزانہ رپورٹ",
    dateLabel: L("common.date"),
    date: r.date,
    farmLabel: L("rep.farmName"),
    farmName: r.farmName,
    sheds,
    stockHeading: mode === "en" ? "Stock" : `${translate("EN", "rep.stock")} | ${translate("UR", "rep.stock")}`,
    stockRow: {
      label: L("rep.feedBags"),
      value: num(r.stock.feedBags, ` ${translate("EN", "unit.bags")}`),
      second: { label: L("rep.diesel"), value: num(r.stock.dieselLitres, " L") },
    },
    notesLabel: L("rep.notes"),
    notes: notes || "—",
    signatureLabel: L("rep.signature"),
    signature: r.farmName,
    footer: label(mode, "rep.sheetFooter"),
  };
}

/** The sheet as a WhatsApp message, keeping the paper layout's order and its bilingual labels. */
export function dailySheetToText(sheet: DailySheet): string {
  const lines = [`*${sheet.title}*`, `${sheet.dateLabel}: ${sheet.date}`, `${sheet.farmLabel}: ${sheet.farmName}`];
  for (const shed of sheet.sheds) {
    lines.push("", `*${shed.heading}* — ${shed.subtitle}`);
    for (const row of shed.rows) {
      lines.push(row.second ? `${row.label}: ${row.value}   ${row.second.label}: ${row.second.value}` : `${row.label}: ${row.value}`);
    }
    if (shed.extras) lines.push(shed.extras);
  }
  lines.push("", `*${sheet.stockHeading}*`, `${sheet.stockRow.label}: ${sheet.stockRow.value}`);
  if (sheet.stockRow.second) lines.push(`${sheet.stockRow.second.label}: ${sheet.stockRow.second.value}`);
  lines.push("", `${sheet.notesLabel}: ${sheet.notes}`, `${sheet.signatureLabel}: ${sheet.signature}`);
  return lines.join("\n");
}
