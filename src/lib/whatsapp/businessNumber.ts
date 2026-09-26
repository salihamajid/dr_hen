// The dialable number of the WhatsApp Business number Dr. Hen already sends from.
// WHATSAPP_PHONE_NUMBER_ID is Meta's internal id and can't be dialed, so the
// display number is looked up from the same Meta number using the credentials
// the app already has, and cached. WHATSAPP_BUSINESS_NUMBER, if set, wins.

const GRAPH_API_VERSION = "v20.0";
const CACHE_MS = 12 * 60 * 60 * 1000;

let cached: { digits: string; at: number } | null = null;

export async function getBusinessNumberDigits(): Promise<string | null> {
  const override = (process.env.WHATSAPP_BUSINESS_NUMBER ?? "").replace(/\D/g, "");
  if (override.length >= 8) return override;

  if (cached && Date.now() - cached.at < CACHE_MS) return cached.digits;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (process.env.WHATSAPP_PROVIDER !== "meta" || !phoneNumberId || !accessToken) return null;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=display_phone_number`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_phone_number?: string };
    const digits = (data.display_phone_number ?? "").replace(/\D/g, "");
    if (digits.length < 8) return null;
    cached = { digits, at: Date.now() };
    return digits;
  } catch {
    // A failed lookup just hides the button; it must never break the dashboard.
    return null;
  }
}

export async function whatsappChatLink(prefill = "Hello Dr. Hen"): Promise<string | null> {
  const digits = await getBusinessNumberDigits();
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}` : null;
}
