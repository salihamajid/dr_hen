import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { evaluateAfterSave } from "@/lib/alerts/engine";
import { parseDateOnly } from "@/lib/reports/dates";
import { shedTotals } from "@/lib/reports/shed";
import { saveDailyReport, saveDailyStock, toEntryView } from "@/lib/reports/saveDailyReport";
import { dailyEntrySchema } from "@/lib/validators/dailyReport";

// Pre-fill for BOTH the Daily Entry and Attributes screens: they share one row per
// (flock, day), so a value entered on either shows up on the other.
export async function GET(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const flockId = req.nextUrl.searchParams.get("flockId") ?? "";
  const date = parseDateOnly(req.nextUrl.searchParams.get("date") ?? "");
  if (!flockId || !date) return jsonError(400, "flockId and date (YYYY-MM-DD) are required");

  const flock = await prisma.flock.findFirst({ where: { id: flockId, farmerId: auth.farmerId }, select: { id: true, sizeCount: true, startDate: true } });
  if (!flock) return jsonError(404, "Not found");

  const [report, stock, totals] = await Promise.all([
    prisma.dailyReport.findFirst({ where: { farmerId: auth.farmerId, flockId: flock.id, date } }),
    prisma.dailyStock.findFirst({ where: { farmerId: auth.farmerId, date } }),
    shedTotals(auth.farmerId, flock, date),
  ]);

  // chickAgeDays and remaining are derived, never typed: two farmers' arithmetic can't disagree
  // with the saved mortality, and the paper form's read-only lines stay read-only here.
  return NextResponse.json({ exists: !!report, entry: toEntryView(report, stock), derived: totals });
}

export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, dailyEntrySchema);
  if (!body.ok) return body.response;
  const {
    flockId,
    date,
    feedKg,
    feedBags,
    waterLiters,
    temperatureC,
    mortalityDay,
    mortalityNight,
    chickAgeDays,
    remainingChicks,
    avgWeightGrams,
    medicineGiven,
    notes,
    stockFeedBags,
    dieselLitres,
  } = body.data;

  // The total is derived from the two rounds, so it can never contradict them.
  const mortalityCount = mortalityDay + mortalityNight;

  const result = await saveDailyReport(
    auth.farmerId,
    { flockId, date },
    { feedKg, feedBags, waterLiters, temperatureC, mortalityDay, mortalityNight, mortalityCount, chickAgeDays, remainingChicks, avgWeightGrams, medicineGiven, notes },
    { checkMortalityAgainstFlock: true }
  );
  if (!result.ok) return jsonError(result.status, result.error);

  await saveDailyStock(auth.farmerId, date, { feedBags: stockFeedBags, dieselLitres });
  await evaluateAfterSave(auth.farmerId, flockId);

  const [stock, flock] = await Promise.all([
    prisma.dailyStock.findFirst({ where: { farmerId: auth.farmerId, date: result.report.date } }),
    prisma.flock.findFirst({ where: { id: flockId, farmerId: auth.farmerId }, select: { id: true, sizeCount: true, startDate: true } }),
  ]);
  const derived = flock ? await shedTotals(auth.farmerId, flock, result.report.date) : null;
  return NextResponse.json({ entry: toEntryView(result.report, stock), derived });
}
