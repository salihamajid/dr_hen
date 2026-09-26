// A minimal, dependency-free PDF writer (text, lines, filled rectangles; standard
// Helvetica fonts, A4). Reports are simple enough that this is all they need, and it
// avoids a new dependency. Only Latin text is supported: anything else prints as "?".

const PAGE_W = 595;
const PAGE_H = 842;

function esc(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === "\\" || ch === "(" || ch === ")") out += "\\" + ch;
    else if (c >= 32 && c <= 126) out += ch;
    else if (c === 0xb0) out += "\\260"; // degree sign, WinAnsi
    else out += "?";
  }
  return out;
}

export interface TextOpts {
  size?: number;
  bold?: boolean;
  gray?: number;
}

export class Pdf {
  private pages: string[][] = [[]];

  get page() {
    return this.pages.length - 1;
  }

  addPage() {
    this.pages.push([]);
  }

  text(x: number, y: number, s: string, { size = 10, bold = false, gray = 0 }: TextOpts = {}) {
    this.pages[this.page].push(`BT ${gray} g /${bold ? "F2" : "F1"} ${size} Tf ${x} ${PAGE_H - y} Td (${esc(s)}) Tj ET`);
  }

  line(x1: number, y1: number, x2: number, y2: number, gray = 0.8) {
    this.pages[this.page].push(`${gray} G 0.6 w ${x1} ${PAGE_H - y1} m ${x2} ${PAGE_H - y2} l S`);
  }

  /** Filled rectangle, top-left origin. Colour as [r,g,b] in 0..1. */
  rect(x: number, y: number, w: number, h: number, rgb: [number, number, number]) {
    this.pages[this.page].push(`${rgb.join(" ")} rg ${x} ${PAGE_H - y - h} ${w} ${h} re f`);
  }

  build(): Buffer {
    // Objects: 1 catalog, 2 pages, 3 Helvetica, 4 Helvetica-Bold, then (page, content) pairs.
    const objs: string[] = [];
    const kids: number[] = [];
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    let next = 5;
    for (const ops of this.pages) {
      const pageNo = next++;
      const contentNo = next++;
      kids.push(pageNo);
      const stream = ops.join("\n");
      objs[pageNo] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNo} 0 R >>`;
      objs[contentNo] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }
    objs[2] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

    let out = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let i = 1; i < objs.length; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    // Everything above is ASCII (esc() strips the rest), so string length === byte length.
    return Buffer.from(out, "latin1");
  }
}
