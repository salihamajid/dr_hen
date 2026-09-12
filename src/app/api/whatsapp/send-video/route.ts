import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsapp } from "@/lib/whatsapp";

const INTRO_VIDEO_URL = process.env.INTRO_VIDEO_URL || "/videos/intro-demo.mp4";
const INTRO_CAPTION =
  "Hello, how is your chicken? Is it okay? Please send a picture, I will tell you.";

// One-click "send intro video" action from the Farmers Overview table.
export async function POST(req: NextRequest) {
  const { farmerId } = await req.json();
  if (!farmerId) return NextResponse.json({ error: "farmerId is required" }, { status: 400 });

  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const result = await whatsapp.sendMedia(farmer.whatsappNumber, INTRO_VIDEO_URL, INTRO_CAPTION);

  const message = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      direction: "OUTBOUND",
      senderType: "ADMIN",
      contentType: "VIDEO",
      textContent: INTRO_CAPTION,
      mediaUrl: INTRO_VIDEO_URL,
      whatsappMessageId: result.messageId,
    },
  });

  return NextResponse.json({ message });
}
