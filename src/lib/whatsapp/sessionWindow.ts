import { prisma } from "@/lib/prisma";

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Whether Meta's 24h customer-service window is open for this farmer, i.e. whether a
 * freeform (non-template) message will be accepted. Only a genuine WhatsApp message
 * from the farmer opens it: simulated ones (whatsappMessageId "sim.*") and in-app chat
 * messages never reached Meta, so they don't count.
 */
export async function isSessionWindowOpen(farmerId: string): Promise<boolean> {
  const lastRealInbound = await prisma.message.findFirst({
    where: { farmerId, channel: "WHATSAPP", direction: "INBOUND", NOT: { whatsappMessageId: { startsWith: "sim." } } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return !!lastRealInbound && Date.now() - lastRealInbound.createdAt.getTime() < CUSTOMER_SERVICE_WINDOW_MS;
}
