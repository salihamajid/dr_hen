import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const treatmentInputSchema = z.object({
  farmerId: z.string().min(1),
  flockId: z.string().optional(),
  diseaseCode: z.enum(["ND", "IB", "CRD", "COCCIDIOSIS", "AI_H9"]),
  medicinesGiven: z.array(z.string()),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]).optional(),
  nextActionAt: z.coerce.date().optional(),
  nextActionNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const treatments = await prisma.treatment.findMany({
    where: status ? { status: status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" } : undefined,
    orderBy: { createdAt: "desc" },
    include: { farmer: { select: { name: true, location: true } } },
  });
  return NextResponse.json({ treatments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = treatmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const treatment = await prisma.treatment.create({ data: parsed.data });
  return NextResponse.json({ treatment }, { status: 201 });
}
