import { NextRequest, NextResponse, after } from "next/server";
import { handleInboundWebhook } from "@/lib/whatsapp/handleInboundWebhook";
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
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      for (const status of change.value.statuses ?? []) {
        console.log(
          `STATUS UPDATE: wamid=${status.id} to=${status.recipient_id} status=${status.status}` +
            (status.errors?.length ? ` errors=${JSON.stringify(status.errors)}` : "")
        );
      }
    }
  }

  // Meta expects a fast 200 OK and retries (with backoff, over up to 36h) on
  // failure or timeout — the AI diagnosis + WhatsApp send can take several
  // seconds, so we ack immediately and do the real work after responding.
  // handleInboundWebhook() already dedupes on whatsappMessageId, so a Meta
  // retry landing after this is a safe no-op.
  after(async () => {
    try {
      await handleInboundWebhook(payload);
    } catch (err) {
      console.error("[whatsapp webhook] processing failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
