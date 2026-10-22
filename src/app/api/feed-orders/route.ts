import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { notifyFarmerChange } from "@/lib/realtime/bus";

// Admin side of "Order Feed". Only an admin moves an order along; the farmer's own endpoint
// (/api/farmer/feed-order) can create one but never set its status.
const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["REQUESTED", "CONFIRMED", "DELIVERED", "CANCELLED"]),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const orders = await prisma.feedOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { farmer: { select: { name: true, location: true, whatsappNumber: true } } },
  });
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, updateSchema);
  if (!body.ok) return body.response;

  const order = await prisma.feedOrder.update({
    where: { id: body.data.id },
    data: { status: body.data.status },
    select: { id: true, status: true, farmerId: true },
  });
  if (!order) return jsonError(404, "Not found");

  // The farmer's dashboard shows this order's state, so tell their stream as well as the admin's.
  notifyFarmerChange(order.farmerId, "feed-order");
  return NextResponse.json({ order });
}
