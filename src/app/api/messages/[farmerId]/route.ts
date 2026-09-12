import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ farmerId: string }> }) {
  const { farmerId } = await params;
  const messages = await prisma.message.findMany({
    where: { farmerId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}
