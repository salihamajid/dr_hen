import crypto from "crypto";
import type { WhatsAppProvider } from "./WhatsAppProvider";
import type { FetchedMedia, SendResult, TemplateOptions } from "./types";

// Real Meta WhatsApp Cloud API implementation. Correctly shaped against the
// documented Graph API endpoints, but will 401 without real credentials — that's
// expected, since it's not on the demo's runtime path (WHATSAPP_PROVIDER=mock is
// the default). Switch WHATSAPP_PROVIDER=meta and supply the env vars below once
// a Meta Business-verified WABA + phone number exist.

const GRAPH_API_VERSION = "v20.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when WHATSAPP_PROVIDER=meta`);
  }
  return value;
}

async function graphPost(body: Record<string, unknown>): Promise<SendResult> {
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = requireEnv("WHATSAPP_ACCESS_TOKEN");

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`WhatsApp Cloud API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  return { messageId: data.messages?.[0]?.id ?? "" };
}

export const metaCloudProvider: WhatsAppProvider = {
  /**
   * Templates are the ONLY message type WhatsApp allows outside an open 24h
   * customer-service window — i.e. the only way to message a farmer who
   * hasn't contacted you first. The template itself (name, header type, body
   * copy) must already exist and be approved in Meta's WhatsApp Manager;
   * this just fills in its variable parts per send.
   */
  async sendTemplate(to, templateName, options): Promise<SendResult> {
    const components: Record<string, unknown>[] = [];

    if (options?.headerVideo) {
      components.push({
        type: "header",
        parameters: [{ type: "video", video: options.headerVideo }],
      });
    }
    if (options?.bodyParams?.length) {
      components.push({
        type: "body",
        parameters: options.bodyParams.map((text) => ({ type: "text", text })),
      });
    }

    return graphPost({
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: options?.languageCode ?? "en" },
        ...(components.length ? { components } : {}),
      },
    });
  },

  async sendText(to, body): Promise<SendResult> {
    return graphPost({ to, type: "text", text: { body } });
  },

  async sendMedia(to, mediaUrl, caption): Promise<SendResult> {
    return graphPost({ to, type: "video", video: { link: mediaUrl, caption } });
  },

  verifyWebhookSignature(rawBody, signature): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret || !signature) return false;
    const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  },

  /**
   * Real inbound webhooks never include a media URL — only an id. Per Meta's
   * Media API: step 1 resolves the id to a temporary URL (expires in 5 min,
   * requires phone_number_id + Bearer token); step 2 downloads the bytes from
   * that URL (also requires the Bearer token). The media id itself expires
   * after 7 days if never resolved.
   */
  async fetchMedia(mediaId: string): Promise<FetchedMedia> {
    const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
    const accessToken = requireEnv("WHATSAPP_ACCESS_TOKEN");

    const metaRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}?phone_number_id=${phoneNumberId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaRes.ok) {
      throw new Error(`Failed to resolve media id ${mediaId}: ${metaRes.status} ${await metaRes.text()}`);
    }
    const { url, mime_type: mimeType } = (await metaRes.json()) as { url: string; mime_type: string };

    const downloadRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!downloadRes.ok) {
      throw new Error(`Failed to download media ${mediaId}: ${downloadRes.status}`);
    }
    const buffer = Buffer.from(await downloadRes.arrayBuffer());

    return { base64: buffer.toString("base64"), mimeType };
  },
};
