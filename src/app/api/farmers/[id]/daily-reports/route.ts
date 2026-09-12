import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dailyReportInputSchema } from "@/lib/validators/farmer";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reports = await prisma.dailyReport.findMany({
    where: { farmerId: id },
    orderBy: { date: "desc" },
    take: 30,
  });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = dailyReportInputSchema.safeParse({ ...body, farmerId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await prisma.dailyReport.create({ data: parsed.data });
  return NextResponse.json({ report }, { status: 201 });
}
