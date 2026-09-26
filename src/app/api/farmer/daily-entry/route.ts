import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { parseDateOnly } from "@/lib/reports/dates";
import { saveDailyReport, toEntryView } from "@/lib/reports/saveDailyReport";
import { dailyEntrySchema } from "@/lib/validators/dailyReport";

// Pre-fill for BOTH the Daily Entry and Attributes screens: they share one row per
// (flock, day), so a value entered on either shows up on the other.
export async function GET(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const flockId = req.nextUrl.searchParams.get("flockId") ?? "";
  const date = parseDateOnly(req.nextUrl.searchParams.get("date") ?? "");
  if (!flockId || !date) return jsonError(400, "flockId and date (YYYY-MM-DD) are required");

  const flock = await prisma.flock.findFirst({ where: { id: flockId, farmerId: auth.farmerId }, select: { id: true } });
  if (!flock) return jsonError(404, "Not found");

  const report = await prisma.dailyReport.findFirst({ where: { farmerId: auth.farmerId, flockId: flock.id, date } });
  return NextResponse.json({ exists: !!report, entry: toEntryView(report) });
}

export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, dailyEntrySchema);
  if (!body.ok) return body.response;
  const { flockId, date, feedKg, waterLiters, temperatureC, mortalityCount, medicineGiven, notes } = body.data;

  const result = await saveDailyReport(
    auth.farmerId,
    { flockId, date },
    { feedKg, waterLiters, temperatureC, mortalityCount, medicineGiven, notes },
    { checkMortalityAgainstFlock: true }
  );
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ entry: toEntryView(result.report) });
}
