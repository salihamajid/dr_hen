import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { notifyFarmerChange } from "@/lib/realtime/bus";
import { MAX_OPEN_REQUESTS, vetRequestSchema } from "@/lib/validators/requests";

/**
 * "Request Vet" on the farmer dashboard.
 *
 * It writes the same VetEscalation row the WhatsApp "VET" keyword creates, so a request made
 * from the portal lands in exactly the same queue the field team already works from, rather
 * than in a second list nobody watches.
 */
export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, vetRequestSchema);
  if (!body.ok) return body.response;

  // A farm with a request already waiting does not need another; this also stops a stuck
  // button filling the admin queue with duplicates of the same problem.
  const open = await prisma.vetEscalation.count({ where: { farmerId: auth.farmerId, status: { in: ["PENDING", "CONTACTED"] } } });
  if (open >= MAX_OPEN_REQUESTS) {
    return jsonError(409, "You already have a vet request open. The team will be in touch.");
  }

  const fieldVet = await prisma.fieldVet.findFirst({ where: { active: true }, select: { id: true } });
  const escalation = await prisma.vetEscalation.create({
    data: { farmerId: auth.farmerId, fieldVetId: fieldVet?.id, status: "PENDING" },
    select: { id: true, status: true, createdAt: true },
  });

  // The farm's own screens and the admin's queue both move on this.
  notifyFarmerChange(auth.farmerId, "vet-escalation");
  return NextResponse.json({ escalation }, { status: 201 });
}
