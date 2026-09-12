import type { FetchedMedia, SendResult } from "./types";

// All app code depends on this interface only — never on mockProvider or
// metaCloudProvider directly — so going live with real WhatsApp later is an env
// var change (WHATSAPP_PROVIDER=meta), not a code change. See index.ts.
export interface WhatsAppProvider {
  sendTemplate(to: string, templateName: string, params?: Record<string, string>): Promise<SendResult>;
  sendText(to: string, body: string): Promise<SendResult>;
  sendMedia(to: string, mediaUrl: string, caption?: string): Promise<SendResult>;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  /**
   * Resolves an inbound media id (from a webhook's messages[].image.id /
   * .audio.id) to actual bytes. Real WhatsApp webhooks never include a direct
   * download link — only an id — so this is required for the real provider;
   * the mock provider never needs it since simulated messages carry inline
   * data: URLs already.
   */
  fetchMedia(mediaId: string): Promise<FetchedMedia>;
}
