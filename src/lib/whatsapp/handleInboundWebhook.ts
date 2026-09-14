import { prisma } from "@/lib/prisma";
import { whatsapp } from "./index";
import type { MetaWebhookPayload, MetaInboundMessage } from "./types";
import { runDiagnosis, textTurn, imageTurn } from "@/lib/ai/diagnose";
import { buildFarmerReply } from "@/lib/ai/buildFarmerReply";
import { transcribeProvider } from "@/lib/ai/transcribe";
import type { DiseaseCode } from "@/lib/ai/diseaseProtocol";
import type { ChatTurn } from "@/lib/ai/provider";

const CONTENT_TYPE_MAP: Record<MetaInboundMessage["type"], "TEXT" | "IMAGE" | "VOICE" | "VIDEO"> = {
  text: "TEXT",
  image: "IMAGE",
  audio: "VOICE",
  video: "VIDEO",
};

function toE164(rawNumber: string): string {
  return rawNumber.startsWith("+") ? rawNumber : `+${rawNumber}`;
}

/**
 * The single code path driven by BOTH the real Meta webhook route and the demo's
 * /api/whatsapp/simulate route (which fabricates a payload in this exact shape).
 * This guarantees the demo exercises the real integration logic, not a shortcut.
 */
export async function handleInboundWebhook(payload: MetaWebhookPayload): Promise<{ handled: number }> {
  let handled = 0;

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      for (const msg of change.value.messages ?? []) {
        await processInboundMessage(msg);
        handled++;
      }
    }
  }

  return { handled };
}

async function processInboundMessage(msg: MetaInboundMessage) {
  // Dedupe on whatsappMessageId — a real Meta webhook can redeliver the same event.
  const existing = await prisma.message.findUnique({ where: { whatsappMessageId: msg.id } });
  if (existing) return;

  // Meta's Cloud API sends `from` as bare digits with country code (e.g.
  // "923126334747"), but every farmer is stored E.164-style with a leading
  // "+" (see FarmerForm/seed.ts) — an exact-match lookup on the raw value
  // silently missed every real inbound message, which the demo simulate
  // route never caught since it fabricates `from` from farmer.whatsappNumber
  // (already "+"-prefixed) rather than Meta's real wire format.
  const farmer = await prisma.farmer.findUnique({ where: { whatsappNumber: toE164(msg.from) } });
  if (!farmer) {
    console.warn(`[whatsapp] inbound message from unknown number ${msg.from}, ignoring`);
    return;
  }

  const contentType = CONTENT_TYPE_MAP[msg.type];
  let textContent = msg.text?.body ?? "";
  let mediaUrl: string | null = null;
  let resolvedImage: { base64: string; mimeType: string } | null = null;

  if (msg.type === "image") {
    const resolved = await resolveInboundMedia(msg.image);
    if (resolved) {
      mediaUrl = resolved.dataUrl;
      resolvedImage = resolved;
    }
  } else if (msg.type === "audio") {
    const resolved = await resolveInboundMedia(msg.audio);
    if (resolved) mediaUrl = resolved.dataUrl;
    textContent = await transcribeProvider.transcribe(
      resolved
        ? { base64: resolved.base64, mimeType: resolved.mimeType }
        : { mimeType: msg.audio?.mime_type ?? "audio/ogg" },
      msg.audio?.caption
    );
  } else if (msg.type === "video") {
    mediaUrl = msg.video?.link ?? null;
  }

  const inbound = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      direction: "INBOUND",
      senderType: "FARMER",
      contentType,
      textContent: textContent || null,
      mediaUrl,
      whatsappMessageId: msg.id,
      rawWebhookPayload: msg as unknown as object,
    },
  });

  // "VET" trigger — short-circuit straight to escalation without calling the AI.
  if (/\bvet\b/i.test(textContent)) {
    const ackText =
      "Connecting you with our Field Vet team — they will reach out to you shortly.\n" +
      "میں آپ کو ہماری فیلڈ ویٹرنری ٹیم سے جوڑ رہا ہوں، وہ جلد آپ سے رابطہ کریں گے۔";
    const sendResult = await whatsapp.sendText(farmer.whatsappNumber, ackText);
    await prisma.message.create({
      data: {
        farmerId: farmer.id,
        direction: "OUTBOUND",
        senderType: "AI_AGENT",
        contentType: "TEXT",
        textContent: ackText,
        whatsappMessageId: sendResult.messageId,
      },
    });
    await escalateToFieldVet(farmer.id, inbound.id);
    return;
  }

  const history = await prisma.message.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const conversation: ChatTurn[] = history
    .filter((m) => m.textContent)
    .map((m) => textTurn(m.senderType === "FARMER" ? "user" : "assistant", m.textContent!));

  let turns = conversation;
  if (resolvedImage) {
    turns = [
      ...conversation.slice(0, -1),
      imageTurn(resolvedImage.base64, resolvedImage.mimeType, textContent || "Please analyze this photo for signs of poultry disease."),
    ];
  }

  let diagnosis;
  try {
    diagnosis = await runDiagnosis(turns);
  } catch (err) {
    // Even with retries (see geminiProvider.ts), the AI call can still fail —
    // without this, the farmer's message vanishes with zero reply and no
    // visible error. A short bilingual apology beats total silence, and
    // doesn't require a language to already be known since diagnosis never ran.
    console.error("[whatsapp] runDiagnosis failed after retries:", err);
    const fallbackText =
      "Sorry, I'm having trouble responding right now. Please try again in a moment, or reply VET to reach our team directly.\n\n" +
      "Maazrat, is waqt jawab dene mein masla ho raha hai. Baraye meherbani thori dair baad dobara koshish karen, ya 'VET' likh kar hamari team se raabta karen.";
    const sendResult = await whatsapp.sendText(farmer.whatsappNumber, fallbackText);
    await prisma.message.create({
      data: {
        farmerId: farmer.id,
        direction: "OUTBOUND",
        senderType: "AI_AGENT",
        contentType: "TEXT",
        textContent: fallbackText,
        whatsappMessageId: sendResult.messageId,
      },
    });
    return;
  }
  const reply = buildFarmerReply(diagnosis);

  console.log("SENDING REPLY:", reply.text);
  const sendResult = await whatsapp.sendText(farmer.whatsappNumber, reply.text);

  const outbound = await prisma.message.create({
    data: {
      farmerId: farmer.id,
      direction: "OUTBOUND",
      senderType: "AI_AGENT",
      contentType: "TEXT",
      textContent: reply.text,
      detectedLanguage: diagnosis.detectedLanguage,
      aiDiagnosis: diagnosis as unknown as object,
      whatsappMessageId: sendResult.messageId,
    },
  });

  if (diagnosis.escalateToVet) {
    await escalateToFieldVet(farmer.id, inbound.id);
    return;
  }

  if (reply.diseaseCode !== "OTHER" && reply.diseaseCode !== "UNKNOWN") {
    await createTreatmentFromDiagnosis(farmer.id, reply.diseaseCode, reply.medicines, outbound.id);
    await prisma.farmer.update({ where: { id: farmer.id }, data: { status: "UNDER_TREATMENT" } });
  }
}

async function createTreatmentFromDiagnosis(
  farmerId: string,
  diseaseCode: Exclude<DiseaseCode, "OTHER" | "UNKNOWN">,
  medicinesGiven: string[],
  sourceMessageId: string
) {
  await prisma.treatment.create({
    data: {
      farmerId,
      diseaseCode,
      medicinesGiven: medicinesGiven as unknown as object,
      status: "SCHEDULED",
      sourceMessageId,
      nextActionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      nextActionNote: "Follow-up round",
    },
  });
}

/**
 * Resolves an inbound media reference to actual bytes + a data: URL for storage.
 * Demo/simulated messages carry the bytes inline as a data: URL already (see
 * /api/whatsapp/simulate); genuine Meta messages only ever include an `id`, which
 * requires a real fetch via provider.fetchMedia() (see metaCloudProvider.ts).
 */
async function resolveInboundMedia(
  media: { id: string; mime_type: string; link?: string } | undefined
): Promise<{ base64: string; mimeType: string; dataUrl: string } | null> {
  if (!media) return null;

  const inlineMatch = media.link?.match(/^data:(.+);base64,(.*)$/);
  if (inlineMatch) {
    return { mimeType: inlineMatch[1], base64: inlineMatch[2], dataUrl: media.link! };
  }

  const fetched = await whatsapp.fetchMedia(media.id);
  return { ...fetched, dataUrl: `data:${fetched.mimeType};base64,${fetched.base64}` };
}

async function escalateToFieldVet(farmerId: string, triggerMessageId: string) {
  const fieldVet = await prisma.fieldVet.findFirst({ where: { active: true } });
  await prisma.vetEscalation.create({
    data: { farmerId, fieldVetId: fieldVet?.id, triggerMessageId, status: "PENDING" },
  });
  await prisma.farmer.update({ where: { id: farmerId }, data: { status: "ESCALATED" } });
}
