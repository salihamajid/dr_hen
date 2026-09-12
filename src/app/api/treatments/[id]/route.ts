import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const treatmentUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]).optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  nextActionAt: z.coerce.date().optional(),
  nextActionNote: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = treatmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const treatment = await prisma.treatment.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ treatment });
}
