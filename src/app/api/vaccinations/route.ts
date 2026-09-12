import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const vaccinationInputSchema = z.object({
  farmerId: z.string().min(1),
  flockId: z.string().optional(),
  vaccineName: z.string().min(1),
  scheduledDate: z.coerce.date(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const vaccinations = await prisma.vaccination.findMany({
    orderBy: { scheduledDate: "asc" },
    include: { farmer: { select: { name: true, location: true } } },
  });
  return NextResponse.json({ vaccinations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = vaccinationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const vaccination = await prisma.vaccination.create({ data: parsed.data });
  return NextResponse.json({ vaccination }, { status: 201 });
}
