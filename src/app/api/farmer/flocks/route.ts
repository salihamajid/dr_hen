import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { startDateForAge } from "@/lib/flocks";
import { flockCreateSchema, MAX_FLOCKS_PER_FARMER } from "@/lib/validators/flock";

export async function GET() {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const flocks = await prisma.flock.findMany({
    where: { farmerId: auth.farmerId },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, breed: true, sizeCount: true, ageWeeks: true, startDate: true, active: true },
  });
  return NextResponse.json({ flocks });
}

export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, flockCreateSchema);
  if (!body.ok) return body.response;

  // Bounds junk creation by a logged-in account.
  const existing = await prisma.flock.count({ where: { farmerId: auth.farmerId } });
  if (existing >= MAX_FLOCKS_PER_FARMER) {
    return jsonError(400, `You can have up to ${MAX_FLOCKS_PER_FARMER} flocks.`);
  }

  const { name, breed, sizeCount, ageWeeks } = body.data;
  const flock = await prisma.flock.create({
    data: { farmerId: auth.farmerId, name, breed, sizeCount, ageWeeks, startDate: startDateForAge(ageWeeks) },
    select: { id: true, name: true },
  });
  return NextResponse.json({ flock }, { status: 201 });
}
