import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/dal";

// One row per farmer with their most recent message — powers the Messages list page.
export async function GET() {
  // Defence in depth: src/proxy.ts is only a first filter, so every admin handler re-checks the session.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const farmers = await prisma.farmer.findMany({
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const threads = farmers
    .filter((f) => f.messages.length > 0)
    .map((f) => ({
      farmerId: f.id,
      farmerName: f.name,
      location: f.location,
      status: f.status,
      lastMessage: f.messages[0],
    }));

  return NextResponse.json({ threads });
}
