import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/dal";

export async function GET() {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const escalations = await prisma.vetEscalation.findMany({
    orderBy: { createdAt: "desc" },
    include: { farmer: { select: { name: true, location: true, whatsappNumber: true } }, fieldVet: true },
  });
  return NextResponse.json({ escalations });
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONTACTED", "RESOLVED"]),
});

export async function PATCH(req: NextRequest) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const escalation = await prisma.vetEscalation.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ escalation });
}
