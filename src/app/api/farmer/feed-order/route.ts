import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { notifyFarmerChange } from "@/lib/realtime/bus";
import { feedOrderSchema, MAX_OPEN_REQUESTS } from "@/lib/validators/requests";

/**
 * "Order Feed" on the farmer dashboard.
 *
 * It records a request for the Dr. Hen team rather than messaging the farmer on WhatsApp.
 * Meta only allows a business-initiated message outside the farmer's 24-hour reply window
 * through an approved template, so an order confirmation sent that way would silently fail
 * for most farmers. The admin sees the request and answers however they normally would.
 */
export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, feedOrderSchema);
  if (!body.ok) return body.response;

  const open = await prisma.feedOrder.count({ where: { farmerId: auth.farmerId, status: { in: ["REQUESTED", "CONFIRMED"] } } });
  if (open >= MAX_OPEN_REQUESTS) {
    return jsonError(409, "You already have feed orders waiting. Please wait for those to arrive.");
  }

  const order = await prisma.feedOrder.create({
    // status is NOT taken from the request: a farmer may ask, not mark their own order delivered.
    data: { farmerId: auth.farmerId, bags: body.data.bags, note: body.data.note ?? null },
    select: { id: true, bags: true, status: true, createdAt: true },
  });

  notifyFarmerChange(auth.farmerId, "feed-order");
  return NextResponse.json({ order }, { status: 201 });
}
