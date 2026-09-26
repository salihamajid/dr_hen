import { NextResponse, type NextRequest } from "next/server";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { evaluateAfterSave } from "@/lib/alerts/engine";
import { saveDailyReport, toEntryView } from "@/lib/reports/saveDailyReport";
import { parametersSchema } from "@/lib/validators/dailyReport";

// Attributes / Parameters screen. Writes the SAME per-(flock, day) row as Daily Entry,
// touching only its own fields. Pre-fill reads go through GET /api/farmer/daily-entry.
export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, parametersSchema);
  if (!body.ok) return body.response;
  const { flockId, date, feedKg, waterLiters, temperatureC, humidityPct, lightHours, ventilation } = body.data;

  const result = await saveDailyReport(auth.farmerId, { flockId, date }, { feedKg, waterLiters, temperatureC, humidityPct, lightHours, ventilation });
  if (!result.ok) return jsonError(result.status, result.error);
  await evaluateAfterSave(auth.farmerId, flockId);
  return NextResponse.json({ entry: toEntryView(result.report) });
}
