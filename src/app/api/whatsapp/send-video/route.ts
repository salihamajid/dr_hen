import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsapp } from "@/lib/whatsapp";

// This is the FIRST message to a farmer — before they've ever messaged Dr. Hen,
// there is no open WhatsApp "customer service window", so this MUST go through
// an approved Message Template (freeform text/video is rejected by Meta outside
// that window). The template itself (its name, video header, and body copy)
// has to already exist and be approved in Meta's WhatsApp Manager — this route
// only fills in the video for that template's header.
const INTRO_TEMPLATE_NAME = process.env.INTRO_VIDEO_TEMPLATE_NAME;
const INTRO_VIDEO_URL = process.env.INTRO_VIDEO_URL;
const INTRO_VIDEO_MEDIA_ID = process.env.INTRO_VIDEO_MEDIA_ID;
const INTRO_CAPTION = "Hello, how is your chicken? Is it okay? Please send a picture, I will tell you.";

export async function POST(req: NextRequest) {
  const { farmerId } = await req.json();
  if (!farmerId) return NextResponse.json({ error: "farmerId is required" }, { status: 400 });

  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  if (process.env.WHATSAPP_PROVIDER === "meta") {
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

  const result = await whatsapp.sendTemplate(farmer.whatsappNumber, INTRO_TEMPLATE_NAME ?? "dr_hen_intro", {
    headerVideo: INTRO_VIDEO_MEDIA_ID ? { id: INTRO_VIDEO_MEDIA_ID } : { link: INTRO_VIDEO_URL ?? "/videos/intro-demo.mp4" },
  });

  const message = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      direction: "OUTBOUND",
      senderType: "ADMIN",
      contentType: "TEMPLATE",
      textContent: INTRO_CAPTION,
      mediaUrl: INTRO_VIDEO_URL ?? "/videos/intro-demo.mp4",
      whatsappMessageId: result.messageId,
    },
  });

  return NextResponse.json({ message });
}
