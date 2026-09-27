import { Pdf } from "./pdf";
import { buildReport } from "./reportText";
import type { LoadedReport } from "./queries";

const LEFT = 50;
const RIGHT = 545;
const BOTTOM = 790;

export function reportToPdf(r: LoadedReport, farmerName: string, generatedOn: string): Buffer {
  // English only: the PDF writer draws Latin glyphs, and Urdu needs joined script, so an Urdu
  // PDF would print as question marks. The screen and the WhatsApp summary do follow the
  // farmer's language.
  const view = buildReport(r);
  const pdf = new Pdf();
  let y = 60;

  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      pdf.addPage();
      y = 60;
    }
  };

  pdf.text(LEFT, y, "Dr. Hen", { size: 11, bold: true, gray: 0.35 });
  y += 26;
  pdf.text(LEFT, y, view.title, { size: 20, bold: true });
  y += 22;
  pdf.text(LEFT, y, view.subtitle, { size: 11, gray: 0.3 });
  y += 15;
  pdf.text(LEFT, y, `Farm: ${farmerName}    Generated: ${generatedOn}`, { size: 9, gray: 0.5 });
  y += 12;
  pdf.line(LEFT, y, RIGHT, y);
  y += 22;

  for (const section of view.sections) {
    if (section.heading) {
      ensure(30);
      pdf.rect(LEFT, y - 11, RIGHT - LEFT, 20, [0.91, 0.96, 0.92]);
      pdf.text(LEFT + 8, y + 3, section.heading, { size: 11, bold: true });
      y += 26;
    }
    for (const [k, v] of section.rows) {
      const wrapped = v.match(/.{1,60}(\s|$)|\S+/g) ?? [v];
      ensure(16 * wrapped.length);
      pdf.text(LEFT + 8, y, k, { size: 10, bold: true });
      wrapped.forEach((part, i) => pdf.text(260, y + i * 14, part.trim(), { size: 10 }));
      y += 16 * Math.max(1, wrapped.length);
    }
    y += 8;
  }

  if (r.type === "mortality") {
    ensure(150);
    pdf.text(LEFT, y, "Daily mortality (birds)", { size: 11, bold: true });
    y += 12;
    const chartH = 90;
    const max = Math.max(1, ...r.days.map((d) => d.deaths ?? 0));
    const slot = (RIGHT - LEFT) / Math.max(1, r.days.length);
    r.days.forEach((d, i) => {
      if (d.deaths === null) return;
      const h = (d.deaths / max) * chartH;
      pdf.rect(LEFT + i * slot + slot * 0.15, y + chartH - h, Math.max(1, slot * 0.7), h, [0.12, 0.48, 0.3]);
    });
    pdf.line(LEFT, y + chartH, RIGHT, y + chartH, 0.5);
    pdf.text(LEFT, y + chartH + 12, `Peak ${max} birds. Days with no entry are left blank.`, { size: 8, gray: 0.5 });
    y += chartH + 34;

    pdf.text(LEFT, y, "Date", { size: 9, bold: true });
    pdf.text(180, y, "Deaths", { size: 9, bold: true });
    y += 6;
    pdf.line(LEFT, y, 260, y);
    y += 14;
    for (const d of r.days) {
      ensure(14);
      pdf.text(LEFT, y, d.date, { size: 9 });
      pdf.text(180, y, d.deaths === null ? "-" : String(d.deaths), { size: 9 });
      y += 13;
    }
  }

  if (r.type === "growth") {
    ensure(60);
    pdf.text(LEFT, y, "Age (days)", { size: 9, bold: true });
    pdf.text(150, y, "Date", { size: 9, bold: true });
    pdf.text(250, y, "Actual (g)", { size: 9, bold: true });
    pdf.text(340, y, "Expected (g)", { size: 9, bold: true });
    y += 6;
    pdf.line(LEFT, y, 430, y);
    y += 14;
    for (const p of r.points) {
      ensure(14);
      pdf.text(LEFT, y, String(p.ageDays), { size: 9 });
      pdf.text(150, y, p.date ?? "-", { size: 9 });
      pdf.text(250, y, p.actual === null ? "-" : String(p.actual), { size: 9 });
      pdf.text(340, y, p.expected === null ? "-" : String(p.expected), { size: 9 });
      y += 13;
    }
  }

  ensure(20 * view.footnotes.length + 20);
  y += 10;
  for (const note of view.footnotes) {
    for (const part of note.match(/.{1,110}(\s|$)|\S+/g) ?? [note]) {
      pdf.text(LEFT, y, part.trim(), { size: 8, gray: 0.5 });
      y += 11;
    }
  }
  return pdf.build();
}
