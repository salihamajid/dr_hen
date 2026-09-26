import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";

const bodySchema = z.object({ action: z.enum(["read", "acknowledge", "resolve"]) });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) return body.response;
  const { id } = await ctx.params;
  const now = new Date();

  // updateMany with farmerId in the WHERE: another farmer's alert simply matches nothing.
  const where = { id, farmerId: auth.farmerId };
  const result =
    body.data.action === "read"
      ? await prisma.alert.updateMany({ where: { ...where, readAt: null }, data: { readAt: now } })
      : body.data.action === "acknowledge"
        ? await prisma.alert.updateMany({ where: { ...where, status: "OPEN" }, data: { status: "ACKNOWLEDGED", readAt: now } })
        : await prisma.alert.updateMany({ where: { ...where, status: { not: "RESOLVED" } }, data: { status: "RESOLVED", resolvedAt: now, readAt: now } });

  if (result.count === 0) {
    // Nothing changed: either it isn't this farmer's alert (404) or it was already in that state (fine).
    const exists = await prisma.alert.findFirst({ where, select: { id: true } });
    if (!exists) return jsonError(404, "Not found");
  }
  return NextResponse.json({ ok: true });
}
