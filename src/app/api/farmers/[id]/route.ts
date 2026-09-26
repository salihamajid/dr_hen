import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { farmerInputSchema } from "@/lib/validators/farmer";
import { requireAdminApi } from "@/lib/auth/dal";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      flocks: true,
      dailyReports: { orderBy: { date: "desc" }, take: 30 },
      treatments: { orderBy: { createdAt: "desc" } },
      vaccinations: { orderBy: { scheduledDate: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
      vetEscalations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
  return NextResponse.json({ farmer });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = farmerInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const farmer = await prisma.farmer.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ farmer });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.farmer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
