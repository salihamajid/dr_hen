import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";

const bodySchema = z.object({ language: z.enum(["EN", "UR"]) });

export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) return body.response;

  // userId is from the verified session; the request can only choose the value.
  const result = await prisma.user.updateMany({ where: { id: auth.userId, role: "FARMER" }, data: { language: body.data.language } });
  if (result.count !== 1) return jsonError(404, "Not found");
  return NextResponse.json({ language: body.data.language });
}
