import { NextRequest, NextResponse } from "next/server";
import { runDiagnosis, imageTurn } from "@/lib/ai/diagnose";
import { buildFarmerReply } from "@/lib/ai/buildFarmerReply";

// Standalone image-analysis endpoint for the admin chat widget / manual testing.
// Same pipeline as the WhatsApp image path in handleInboundWebhook.ts.
export async function POST(req: NextRequest) {
  const { imageDataUrl, caption } = (await req.json()) as { imageDataUrl: string; caption?: string };

  const match = imageDataUrl?.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    return NextResponse.json({ error: "imageDataUrl must be a base64 data URL" }, { status: 400 });
  }

  const [, mediaType, base64Data] = match;

  try {
    const diagnosis = await runDiagnosis([
      imageTurn(base64Data, mediaType, caption || "Please analyze this photo for signs of poultry disease."),
    ]);
    const reply = buildFarmerReply(diagnosis);
    return NextResponse.json({ diagnosis, reply: reply.text, escalateToVet: reply.escalateToVet });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
