import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleInboundWebhook } from "@/lib/whatsapp/handleInboundWebhook";
import type { MetaWebhookPayload, MetaInboundMessage } from "@/lib/whatsapp/types";

// Dev-only: fabricates a Meta-webhook-shaped payload and drives it through the
// exact same handler a real Meta POST would use — see SimulateIncomingPanel.tsx.
// This is how the full pipeline is demonstrated without real WhatsApp credentials.

interface SimulateBody {
  farmerId: string;
  contentType: "text" | "image" | "voice";
  text?: string;
  /** data:<mime>;base64,<data> for images */
  imageDataUrl?: string;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Simulate endpoint is disabled outside demo mode" }, { status: 403 });
  }

  const body = (await req.json()) as SimulateBody;
  const farmer = await prisma.farmer.findUnique({ where: { id: body.farmerId } });
  if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const messageId = `sim.wamid.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = String(Math.floor(Date.now() / 1000));

  let message: MetaInboundMessage;
  if (body.contentType === "image") {
    message = {
      id: messageId,
      from: farmer.whatsappNumber,
      timestamp,
      type: "image",
      image: { id: messageId, mime_type: "image/jpeg", link: body.imageDataUrl, caption: body.text },
      text: body.text ? { body: body.text } : undefined,
    };
  } else if (body.contentType === "voice") {
    message = {
      id: messageId,
      from: farmer.whatsappNumber,
      timestamp,
      type: "audio",
      audio: { id: messageId, mime_type: "audio/ogg", caption: body.text },
    };
  } else {
    message = {
      id: messageId,
      from: farmer.whatsappNumber,
      timestamp,
      type: "text",
      text: { body: body.text ?? "" },
    };
  }

  const payload: MetaWebhookPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "simulated-waba",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "demo", phone_number_id: "demo" },
              messages: [message],
            },
          },
        ],
      },
    ],
  };

  try {
    const result = await handleInboundWebhook(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Same reasoning as send-video/route.ts — surface the real error instead
    // of an opaque bodyless 500, so a failure in the demo panel is debuggable.
    console.error("[whatsapp simulate] processing failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Simulate processing failed" }, { status: 500 });
  }
}
