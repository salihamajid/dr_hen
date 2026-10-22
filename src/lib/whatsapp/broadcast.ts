import "server-only";

import { prisma } from "@/lib/prisma";
import { notifyAdminChange, notifyFarmerChange } from "@/lib/realtime/bus";
import { whatsapp } from "./index";
import { isSessionWindowOpen } from "./sessionWindow";

/**
 * Sends one broadcast over the WhatsApp connection the app already uses.
 *
 * META'S RULE, which shapes all of this: a business may only send a farmer a free-form
 * message inside the 24 hours after that farmer last messaged in. Outside that window the
 * only thing Meta accepts is a pre-approved template. So each recipient is checked
 * individually and takes whichever route is open to them:
 *
 *   window open    -> the message or video itself, no template needed
 *   window closed  -> the chosen template, if one was given
 *   neither        -> recorded as skipped, with the reason, instead of a silent failure
 *
 * Sends run one at a time. Meta rate-limits per number, and a free-plan instance has one
 * core; a burst of parallel requests buys nothing and risks tripping the limit.
 */
export async function runBroadcast(broadcastId: string): Promise<void> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    select: { id: true, kind: true, title: true, body: true, mediaUrl: true, templateName: true },
  });
  if (!broadcast) return;

  const recipients = await prisma.broadcastRecipient.findMany({
    where: { broadcastId, sentAt: null },
    select: { id: true, farmerId: true, farmer: { select: { whatsappNumber: true } } },
  });

  for (const recipient of recipients) {
    try {
      await sendToOne(broadcast, recipient);
    } catch (err) {
      // One farmer's failure must never stop the rest of the broadcast.
      const message = err instanceof Error ? err.message : "Send failed";
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED", error: message.slice(0, 500), sentAt: new Date() },
      });
      console.error(`[broadcast] send failed for farmer ${recipient.farmerId}:`, err);
    }
  }

  await finalise(broadcastId);
}

type LoadedBroadcast = { id: string; kind: "MESSAGE" | "VIDEO" | "TEMPLATE"; title: string; body: string | null; mediaUrl: string | null; templateName: string | null };
type LoadedRecipient = { id: string; farmerId: string; farmer: { whatsappNumber: string } };

async function sendToOne(broadcast: LoadedBroadcast, recipient: LoadedRecipient) {
  const to = recipient.farmer.whatsappNumber;
  const open = await isSessionWindowOpen(recipient.farmerId);
  const text = broadcast.body ?? broadcast.title;

  let messageId: string | null = null;
  let contentType: "TEXT" | "VIDEO" | "TEMPLATE" = "TEXT";

  if (open && broadcast.kind === "VIDEO" && broadcast.mediaUrl) {
    messageId = (await whatsapp.sendMedia(to, broadcast.mediaUrl, text)).messageId;
    contentType = "VIDEO";
  } else if (open) {
    messageId = (await whatsapp.sendText(to, text)).messageId;
  } else if (broadcast.templateName) {
    messageId = (await whatsapp.sendTemplate(to, broadcast.templateName)).messageId;
    contentType = "TEMPLATE";
  } else {
    // Not an error on our side, and not a delivery either. Saying so is the whole point:
    // a silent skip would make the delivered count look like an unexplained shortfall.
    await prisma.broadcastRecipient.update({
      where: { id: recipient.id },
      data: {
        status: "FAILED",
        error: "Outside the 24-hour window and no template was chosen, so Meta would reject this message.",
        sentAt: new Date(),
      },
    });
    return;
  }

  const message = await prisma.message.create({
    data: {
      farmerId: recipient.farmerId,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      senderType: "ADMIN",
      contentType,
      textContent: text,
      mediaUrl: contentType === "VIDEO" ? broadcast.mediaUrl : null,
      whatsappMessageId: messageId,
      // Meta accepted it; whether the phone received it arrives later on the webhook and
      // is written by recordDeliveryStatuses.
      deliveryStatus: "SENT",
    },
    select: { id: true },
  });

  await prisma.broadcastRecipient.update({
    where: { id: recipient.id },
    data: { messageId: message.id, status: "SENT", error: null, sentAt: new Date() },
  });

  // The farmer's own message thread changed too, not just the admin's broadcast list.
  notifyFarmerChange(recipient.farmerId, "message");
}

/** Recounts from the recipient rows, so a crash midway leaves honest totals behind. */
async function finalise(broadcastId: string) {
  const [delivered, failed, total] = await Promise.all([
    prisma.broadcastRecipient.count({ where: { broadcastId, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    prisma.broadcastRecipient.count({ where: { broadcastId, status: "FAILED" } }),
    prisma.broadcastRecipient.count({ where: { broadcastId } }),
  ]);

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      deliveredCount: delivered,
      failedCount: failed,
      status: failed === 0 ? "SENT" : failed === total ? "FAILED" : "PARTIAL",
      sentAt: new Date(),
    },
  });
  notifyAdminChange("broadcast");
}
