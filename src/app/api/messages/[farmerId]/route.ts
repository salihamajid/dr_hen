import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/dal";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ farmerId: string }> }) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { farmerId } = await params;
  const messages = await prisma.message.findMany({
    where: { farmerId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}
