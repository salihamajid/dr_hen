import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsapp } from "@/lib/whatsapp";

// Before a farmer has ever messaged Dr. Hen, there is no open WhatsApp
// "customer service window", so the FIRST message to them must go through an
// approved Message Template (freeform text/media is rejected by Meta outside
// that window). But once they've messaged us — real webhook inbound, not the
// demo simulate panel — Meta opens a 24h window in which freeform media needs
// no template/approval at all, which is what testing/demo numbers want.
const INTRO_TEMPLATE_NAME = process.env.INTRO_VIDEO_TEMPLATE_NAME;
const INTRO_VIDEO_URL = process.env.INTRO_VIDEO_URL;
const INTRO_VIDEO_MEDIA_ID = process.env.INTRO_VIDEO_MEDIA_ID;
const INTRO_CAPTION = "Hello, how is your chicken? Is it okay? Please send a picture, I will tell you.";
const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { farmerId } = await req.json();
  if (!farmerId) return NextResponse.json({ error: "farmerId is required" }, { status: 400 });

  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  // Simulated inbound messages (whatsappMessageId "sim.*", from the demo panel)
  // never reached Meta, so they can't have opened a real session window there —
  // only a genuine webhook-received message counts.
  const lastRealInbound = await prisma.message.findFirst({
    where: { farmerId: farmer.id, direction: "INBOUND", NOT: { whatsappMessageId: { startsWith: "sim." } } },
    orderBy: { createdAt: "desc" },
  });
  const windowOpen = !!lastRealInbound && Date.now() - lastRealInbound.createdAt.getTime() < CUSTOMER_SERVICE_WINDOW_MS;

  if (!windowOpen && process.env.WHATSAPP_PROVIDER === "meta") {
    if (!INTRO_TEMPLATE_NAME) {
      return NextResponse.json(
        { error: "INTRO_VIDEO_TEMPLATE_NAME is not set — create and get an approved video-header template in Meta's WhatsApp Manager first." },
        { status: 500 }
      );
    }
    if (!INTRO_VIDEO_MEDIA_ID && !/^https:\/\//.test(INTRO_VIDEO_URL ?? "")) {
      return NextResponse.json(
        { error: "Set INTRO_VIDEO_MEDIA_ID, or INTRO_VIDEO_URL to a full https:// URL Meta's servers can fetch — a relative path only works in mock mode." },
        { status: 500 }
      );
    }
  }

  let result;
  try {
    result = windowOpen
      ? await whatsapp.sendMedia(farmer.whatsappNumber, INTRO_VIDEO_URL ?? "/videos/intro-demo.mp4", INTRO_CAPTION)
      : await whatsapp.sendTemplate(farmer.whatsappNumber, INTRO_TEMPLATE_NAME ?? "dr_hen_intro", {
          headerVideo: INTRO_VIDEO_MEDIA_ID ? { id: INTRO_VIDEO_MEDIA_ID } : { link: INTRO_VIDEO_URL ?? "/videos/intro-demo.mp4" },
        });
  } catch (err) {
    // Without this, Next.js swallows the thrown error into an opaque, bodyless
    // 500 in production — masking exactly the Meta error detail (bad token,
    // unapproved template, closed window, etc.) callers need to fix a failed send.
    return NextResponse.json({ error: err instanceof Error ? err.message : "WhatsApp send failed" }, { status: 502 });
  }

  const message = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      direction: "OUTBOUND",
      senderType: "ADMIN",
      contentType: windowOpen ? "VIDEO" : "TEMPLATE",
      textContent: INTRO_CAPTION,
      mediaUrl: INTRO_VIDEO_URL ?? "/videos/intro-demo.mp4",
      whatsappMessageId: result.messageId,
    },
  });

  return NextResponse.json({
    message,
    provider: process.env.WHATSAPP_PROVIDER === "meta" ? "meta" : "mock",
    channel: windowOpen ? "freeform" : "template",
  });
}
