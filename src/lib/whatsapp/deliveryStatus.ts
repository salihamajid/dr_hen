import type { MessageDeliveryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MetaMessageStatus } from "./types";

const MAP: Record<MetaMessageStatus["status"], MessageDeliveryStatus> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
};

// Meta can deliver these receipts out of order, so a later "sent" must not undo an
// earlier "read". FAILED sits at the top: once a send has failed, that is the outcome.
const RANK: Record<MessageDeliveryStatus, number> = { SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };

/**
 * Records Meta's asynchronous delivery receipts for messages we sent.
 *
 * The synchronous send response only proves Meta accepted the request. Whether the farmer's
 * phone actually received it arrives later, on this same webhook, and until now it was only
 * written to the server log — so nothing in the product could show a delivery state.
 */
export async function recordDeliveryStatuses(statuses: MetaMessageStatus[]): Promise<void> {
  for (const s of statuses) {
    const next = MAP[s.status];
    if (!next) continue;

    try {
      const message = await prisma.message.findUnique({
        where: { whatsappMessageId: s.id },
        select: { id: true, deliveryStatus: true },
      });
      // A receipt for something we never stored (or a send from another tool) is not an error.
      if (!message) continue;
      if (message.deliveryStatus && RANK[message.deliveryStatus] >= RANK[next]) continue;

      const error = s.errors?.length ? s.errors.map((e) => `${e.code} ${e.title}`).join("; ").slice(0, 500) : null;
      await prisma.message.update({
        where: { id: message.id },
        data: {
          deliveryStatus: next,
          deliveredAt: next === "DELIVERED" || next === "READ" ? new Date(Number(s.timestamp) * 1000) : undefined,
          deliveryError: next === "FAILED" ? error : null,
        },
      });

      await syncBroadcastRecipient(message.id, next, error);
    } catch (err) {
      // One bad receipt must never cost us the rest of the batch.
      console.error(`[whatsapp] could not record delivery status for ${s.id}:`, err);
    }
  }
}

/** Mirrors the receipt onto the broadcast that produced the message, and recounts its totals. */
async function syncBroadcastRecipient(messageId: string, status: MessageDeliveryStatus, error: string | null) {
  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { messageId },
    select: { id: true, broadcastId: true },
  });
  if (!recipient) return;

  await prisma.broadcastRecipient.update({ where: { id: recipient.id }, data: { status, error } });

  const [delivered, failed, total] = await Promise.all([
    prisma.broadcastRecipient.count({ where: { broadcastId: recipient.broadcastId, status: { in: ["DELIVERED", "READ"] } } }),
    prisma.broadcastRecipient.count({ where: { broadcastId: recipient.broadcastId, status: "FAILED" } }),
    prisma.broadcastRecipient.count({ where: { broadcastId: recipient.broadcastId } }),
  ]);

  await prisma.broadcast.update({
    where: { id: recipient.broadcastId },
    data: {
      deliveredCount: delivered,
      failedCount: failed,
      // "Partial" is the honest word when some farmers got it and some did not.
      status: failed === 0 ? "SENT" : failed === total ? "FAILED" : "PARTIAL",
    },
  });
}
