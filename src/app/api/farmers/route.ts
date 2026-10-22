import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { farmerInputSchema } from "@/lib/validators/farmer";
import { requireAdminApi } from "@/lib/auth/dal";
import { notifyAdminChange } from "@/lib/realtime/bus";

export async function GET(req: NextRequest) {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "10");
  // This used to accept a search term and quietly ignore it, so a filtered request came back
  // as the full list and looked like a result. It now filters, on the same fields as the page.
  const q = (req.nextUrl.searchParams.get("q") ?? req.nextUrl.searchParams.get("search") ?? "").trim();
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
          { whatsappNumber: { contains: q } },
        ],
      }
    : {};

  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        treatments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.farmer.count({ where }),
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
  // Admin feed only: a farm nobody has logged into yet has no portal to update.
  notifyAdminChange("farmer");
  return NextResponse.json({ farmer }, { status: 201 });
}
