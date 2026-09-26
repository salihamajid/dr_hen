import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError } from "@/lib/auth/http";
import { loadReport } from "@/lib/reports/queries";
import { reportToPdf } from "@/lib/reports/reportPdf";
import { reportRequestSchema } from "@/lib/validators/reportQuery";

// A real server-generated PDF (Content-Disposition: attachment). window.print() is a
// no-op inside the Android WebView, so a print-to-PDF button would not work in the app.
export async function GET(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const parsed = reportRequestSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError(400, "Invalid report request");

  const [loaded, farmer] = await Promise.all([
    loadReport(auth.farmerId, parsed.data),
    prisma.farmer.findFirst({ where: { id: auth.farmerId }, select: { name: true } }),
  ]);
  if (!loaded.ok) return jsonError(loaded.status, loaded.error);

  const pdf = reportToPdf(loaded.report, farmer?.name ?? "Farmer", new Date().toISOString().slice(0, 10));
  const filename = `dr-hen-${loaded.report.type}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
