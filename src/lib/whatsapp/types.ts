// Types shaped after the real Meta WhatsApp Cloud API webhook payload, so the
// mock provider / simulate route and a future real Meta webhook produce/consume
// identical shapes — swapping providers later requires no changes to this file
// or to handleInboundWebhook.ts.

export type InboundMessageType = "text" | "image" | "audio" | "video";

export interface MetaWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      field: "messages";
      value: {
        messaging_product: "whatsapp";
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<MetaInboundMessage>;
      };
    }>;
  }>;
}

export interface MetaInboundMessage {
  id: string;
  from: string; // farmer's WhatsApp number, no "+"
  timestamp: string;
  type: InboundMessageType;
  text?: { body: string };
  // NOTE: `link` is NOT a real Meta field — real inbound webhooks only ever
  // include `id` + `mime_type` for media, never a direct URL (confirmed against
  // Meta's Cloud API docs). `link` here is a demo-only convenience used by the
  // /api/whatsapp/simulate route to carry an inline `data:<mime>;base64,...` URL
  // so the mock path never needs a real fetch. handleInboundWebhook.ts checks
  // for this data: URL first and only calls provider.fetchMedia(id) when it's
  // absent — i.e. only for genuine Meta-originated messages.
  image?: { id: string; mime_type: string; caption?: string; link?: string };
  audio?: { id: string; mime_type: string; link?: string; caption?: string };
  video?: { id: string; mime_type: string; link?: string };
}

export interface SendResult {
  messageId: string;
}

export interface FetchedMedia {
  base64: string;
  mimeType: string;
}
