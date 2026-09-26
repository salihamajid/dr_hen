import { Pdf } from "./pdf";
import { GROWTH_REFERENCE_NOTE } from "./growthStandards";
import { reportRows } from "./reportText";
import type { LoadedReport } from "./queries";

const LEFT = 50;
const RIGHT = 545;
const BOTTOM = 790;

export function reportToPdf(r: LoadedReport, farmerName: string, generatedOn: string): Buffer {
  const { title, subtitle, rows } = reportRows(r);
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
  pdf.text(LEFT, y, title, { size: 20, bold: true });
  y += 22;
  pdf.text(LEFT, y, subtitle, { size: 11, gray: 0.3 });
  y += 15;
  pdf.text(LEFT, y, `Farmer: ${farmerName}    Generated: ${generatedOn}`, { size: 9, gray: 0.5 });
  y += 12;
  pdf.line(LEFT, y, RIGHT, y);
  y += 22;

  for (const [k, v] of rows) {
    // Long values (remarks) wrap at ~70 chars.
    const wrapped = v.match(/.{1,70}(\s|$)|\S+/g) ?? [v];
    ensure(16 * wrapped.length);
    pdf.text(LEFT, y, k, { size: 10, bold: true });
    wrapped.forEach((part, i) => pdf.text(230, y + i * 14, part.trim(), { size: 10 }));
    y += 16 * Math.max(1, wrapped.length);
  }

  if (r.type === "mortality") {
    y += 14;
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
    y += 14;
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
    if (r.hasReference) {
      y += 8;
      ensure(30);
      pdf.text(LEFT, y, GROWTH_REFERENCE_NOTE.slice(0, 95), { size: 8, gray: 0.5 });
      pdf.text(LEFT, y + 10, GROWTH_REFERENCE_NOTE.slice(95), { size: 8, gray: 0.5 });
      y += 22;
    }
  }

  ensure(40);
  y += 16;
  pdf.text(LEFT, y, "This report summarises the farmer's own records. It does not replace a veterinary assessment.", { size: 8, gray: 0.5 });
  return pdf.build();
}
