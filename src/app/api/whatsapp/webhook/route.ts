import { NextRequest, NextResponse, after } from "next/server";
import { handleInboundWebhook } from "@/lib/whatsapp/handleInboundWebhook";
import { recordDeliveryStatuses } from "@/lib/whatsapp/deliveryStatus";
import { whatsapp } from "@/lib/whatsapp";
import type { MetaWebhookPayload } from "@/lib/whatsapp/types";

// Real Meta Cloud API webhook handler. The verification handshake (GET) and
// payload shape (POST) match Meta's documented contract exactly, so switching
// WHATSAPP_PROVIDER=meta later needs no changes here — only real credentials and
// registering this URL with Meta.

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  console.log("WEBHOOK HIT:", rawBody);

  const signature = req.headers.get("x-hub-signature-256");

  if (process.env.WHATSAPP_PROVIDER === "meta" && !whatsapp.verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as MetaWebhookPayload;

  // Delivery-status callbacks (sent/delivered/read/failed) for messages WE sent.
  // This is the ONLY place a real delivery failure shows up — the synchronous
  // send response only confirms Meta *accepted* the request, not that the
  // recipient's phone actually got it.
  const statuses = payload.entry.flatMap((e) => e.changes.flatMap((c) => c.value.statuses ?? []));

  // Meta expects a fast 200 OK and retries (with backoff, over up to 36h) on
  // failure or timeout — the AI diagnosis + WhatsApp send can take several
  // seconds, so we ack immediately and do the real work after responding.
  // handleInboundWebhook() already dedupes on whatsappMessageId, so a Meta
  // retry landing after this is a safe no-op.
  after(async () => {
    try {
      // Persisted after the ack, like the inbound work: Meta wants a fast 200 and
      // retries the whole payload if we are slow.
      if (statuses.length) await recordDeliveryStatuses(statuses);
      await handleInboundWebhook(payload);
    } catch (err) {
      console.error("[whatsapp webhook] processing failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
