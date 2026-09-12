import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalFarmers, birdsAgg, treatmentsGiven, messagesSent, treatmentsByStatus, treatmentsByDisease] =
    await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.aggregate({ _sum: { flockSize: true } }),
      prisma.treatment.count(),
      prisma.message.count({ where: { direction: "OUTBOUND" } }),
      prisma.treatment.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.treatment.groupBy({ by: ["diseaseCode"], _count: { diseaseCode: true } }),
    ]);

  return NextResponse.json({
    totalFarmers,
    totalBirds: birdsAgg._sum.flockSize ?? 0,
    treatmentsGiven,
    messagesSent,
    treatmentsByStatus: treatmentsByStatus.map((t) => ({ status: t.status, count: t._count.status })),
    treatmentsByDisease: treatmentsByDisease.map((t) => ({ diseaseCode: t.diseaseCode, count: t._count.diseaseCode })),
  });
}
