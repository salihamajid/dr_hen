import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One row per farmer with their most recent message — powers the Messages list page.
export async function GET() {
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
