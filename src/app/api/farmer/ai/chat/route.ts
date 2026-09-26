import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError } from "@/lib/auth/http";
import { isLimited, recordAttempt, retryAfterSeconds } from "@/lib/auth/rateLimit";
import { inAppDelivery, respondToFarmerMessage } from "@/lib/whatsapp/handleInboundWebhook";

// The farmer's in-app "Chat with AI Assistant". It runs the SAME pipeline as a
// WhatsApp message (respondToFarmerMessage: VET shortcut, Gemini diagnosis,
// guardrailed buildFarmerReply, escalation, treatment tracking); only the delivery
// differs — the reply is stored for this page instead of pushed to the phone.

const MAX_MESSAGES_PER_WINDOW = 20; // per farmer, per 15 min: each one is a paid Gemini call
const MAX_IMAGE_DATA_URL = 3_000_000; // ~2.2 MB of image
const MAX_BODY_BYTES = MAX_IMAGE_DATA_URL + 10_000;

const bodySchema = z
  .object({
    text: z.string().trim().max(2000).optional(),
    imageDataUrl: z
      .string()
      .max(MAX_IMAGE_DATA_URL)
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Please attach a JPEG, PNG or WebP photo")
      .optional(),
  })
  .refine((b) => b.text || b.imageDataUrl, { message: "Type a message or attach a photo" });

const messageSelect = {
  id: true,
  direction: true,
  senderType: true,
  contentType: true,
  textContent: true,
  mediaUrl: true,
  detectedLanguage: true,
  createdAt: true,
} as const;

export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;
  const { farmerId } = auth;

  const limitKey = `farmer-chat:${farmerId}`;
  if (isLimited(limitKey, MAX_MESSAGES_PER_WINDOW)) {
    const res = jsonError(429, "You're sending messages very fast. Please wait a few minutes and try again.");
    res.headers.set("Retry-After", String(retryAfterSeconds(limitKey)));
    return res;
  }

  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonError(415, "Content-Type must be application/json");
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return jsonError(413, "That photo is too large");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "Request body is not valid JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid message");
  const { text, imageDataUrl } = parsed.data;
  recordAttempt(limitKey);

  // farmerId comes from the session only; there is no farmer id in the request.
  const farmer = await prisma.farmer.findFirst({ where: { id: farmerId } });
  if (!farmer) return jsonError(404, "Not found");

  const image = imageDataUrl?.match(/^data:(.+);base64,(.*)$/);
  const inbound = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      channel: "IN_APP",
      direction: "INBOUND",
      senderType: "FARMER",
      contentType: image ? "IMAGE" : "TEXT",
      // Placeholder for photo-only messages, like "[voice note]" on WhatsApp: keeps the
      // turn in the conversation history the AI replays.
      textContent: text || (image ? "[photo]" : null),
      mediaUrl: image ? imageDataUrl : null,
    },
  });

  try {
    await respondToFarmerMessage({
      farmer,
      inbound,
      textContent: text ?? "",
      resolvedImage: image ? { mimeType: image[1], base64: image[2] } : null,
      resolvedAudio: null,
      delivery: inAppDelivery,
    });
  } catch (err) {
    console.error("[farmer chat] processing failed:", err);
    return jsonError(500, "Something went wrong. Please try again.");
  }

  // Return the whole recent thread so the client just re-renders it.
  const messages = await prisma.message.findMany({
    where: { farmerId: farmer.id, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: messageSelect,
  });
  return NextResponse.json({ messages: messages.reverse() });
}
