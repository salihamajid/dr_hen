import type { WhatsAppProvider } from "./WhatsAppProvider";
import { mockProvider } from "./mockProvider";
import { metaCloudProvider } from "./metaCloudProvider";

// The one place that decides mock vs real. Every route/component must import
// `whatsapp` from here — never mockProvider/metaCloudProvider directly — so going
// live is WHATSAPP_PROVIDER=meta + credentials, with zero code changes elsewhere.
export const whatsapp: WhatsAppProvider =
  process.env.WHATSAPP_PROVIDER === "meta" ? metaCloudProvider : mockProvider;

export * from "./WhatsAppProvider";
export * from "./types";
