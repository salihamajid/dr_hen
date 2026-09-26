import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { farmerInputSchema } from "@/lib/validators/farmer";
import { requireAdminApi } from "@/lib/auth/dal";

export async function GET(req: NextRequest) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "10");

  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        treatments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.farmer.count(),
  ]);

  return NextResponse.json({ farmers, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = farmerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const farmer = await prisma.farmer.create({ data: parsed.data });
  return NextResponse.json({ farmer }, { status: 201 });
}
