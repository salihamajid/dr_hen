import type { WhatsAppProvider } from "./WhatsAppProvider";
import type { FetchedMedia, SendResult } from "./types";

function fakeMessageId(): string {
  return `mock.wamid.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

// No network call, always succeeds — used for the demo. Callers (API routes) are
// responsible for persisting the outbound Message row with the right farmerId/
// senderType/contentType, since this provider only knows a phone number, not the
// app's data model.
export const mockProvider: WhatsAppProvider = {
  async sendTemplate(to, templateName, options): Promise<SendResult> {
    console.log(`[mock-whatsapp] sendTemplate to=${to} template=${templateName}`, options ?? {});
    return { messageId: fakeMessageId() };
  },

  async sendText(to, body): Promise<SendResult> {
    console.log(`[mock-whatsapp] sendText to=${to}: ${body.slice(0, 120)}`);
    return { messageId: fakeMessageId() };
  },

  async sendMedia(to, mediaUrl, caption): Promise<SendResult> {
    console.log(`[mock-whatsapp] sendMedia to=${to} mediaUrl=${mediaUrl} caption=${caption ?? ""}`);
    return { messageId: fakeMessageId() };
  },

  verifyWebhookSignature(): boolean {
    // No real signature to verify in mock mode.
    return true;
  },

  async fetchMedia(): Promise<FetchedMedia> {
    throw new Error(
      "mockProvider.fetchMedia() should never be called — simulated messages carry inline data: URLs already."
    );
  },
};
