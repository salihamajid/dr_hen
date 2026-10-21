import type { NextRequest } from "next/server";
import { requireFarmerApi } from "@/lib/auth/dal";
import { farmerTopic } from "@/lib/realtime/bus";
import { eventStream } from "@/lib/realtime/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One farm's live feed. The topic is built from the session's farmerId and nothing else:
 * there is no id in the path or the query string, so a farmer cannot subscribe to another
 * farm even by guessing an id, and the admin feed is a different URL behind requireAdminApi().
 */
export async function GET(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;
  return eventStream(farmerTopic(auth.farmerId), req);
}
