import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/dal";
import { eventStream } from "@/lib/realtime/stream";

// Long-lived response: no caching layer may sit in front of it, and it needs Node's
// sockets rather than the edge runtime's short-lived request model.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The admin live feed: anything that happens on any farm.
 *
 * Deliberately a separate file from the farmer stream rather than one endpoint with a
 * role switch — the topic each role may read is decided by which handler answered, so
 * there is no parameter anywhere that could be pointed at someone else's farm.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  return eventStream("admin", req);
}
