import { after } from "next/server";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { notifyAdminChange } from "@/lib/realtime/bus";
import { runBroadcast } from "@/lib/whatsapp/broadcast";
import { isSessionWindowOpen } from "@/lib/whatsapp/sessionWindow";
import { broadcastSchema } from "@/lib/validators/broadcast";

/** A ceiling on one send, so a mis-click cannot start a job that runs for an hour. */
const MAX_RECIPIENTS = 500;

/**
 * Starts a WhatsApp broadcast on the number Dr. Hen already sends from.
 *
 * The rows are written and the response returns straight away; the sending itself happens in
 * after(), because talking to Meta once per farmer takes far longer than a page should wait.
 * The admin's dashboard follows along by itself over the live stream from phase B.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(req, broadcastSchema);
  if (!body.ok) return body.response;
  const { kind, title, body: text, mediaUrl, templateName, audience } = body.data;

  const farmers = await prisma.farmer.findMany({ select: { id: true }, take: MAX_RECIPIENTS });
  if (farmers.length === 0) return jsonError(400, "There are no farmers to send to.");

  // Working out the audience here rather than inside the send loop means the admin is told
  // up front that, say, only 2 of 11 farmers can actually be reached right now.
  let recipients = farmers;
  if (audience === "OPEN_WINDOW") {
    const open = await Promise.all(farmers.map(async (f) => ((await isSessionWindowOpen(f.id)) ? f : null)));
    recipients = open.filter((f): f is { id: string } => f !== null);
    if (recipients.length === 0) {
      return jsonError(
        400,
        "No farmer has messaged in the last 24 hours, so Meta would reject a free-form message to all of them. Choose every farmer and pick an approved template instead."
      );
    }
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      kind,
      title,
      body: text,
      mediaUrl: mediaUrl ?? null,
      templateName: templateName || null,
      status: "SENDING",
      recipientCount: recipients.length,
      createdById: auth.userId,
      recipients: { create: recipients.map((f) => ({ farmerId: f.id })) },
    },
    select: { id: true, recipientCount: true },
  });

  notifyAdminChange("broadcast");
  after(async () => {
    try {
      await runBroadcast(broadcast.id);
    } catch (err) {
      console.error("[broadcast] run failed:", err);
      await prisma.broadcast.update({ where: { id: broadcast.id }, data: { status: "FAILED" } }).catch(() => {});
      notifyAdminChange("broadcast");
    }
  });

  return NextResponse.json({ broadcast }, { status: 202 });
}
