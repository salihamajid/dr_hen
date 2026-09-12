import type { AIProvider } from "../provider";
import { geminiProvider } from "./geminiProvider";

// The one place that decides which AI vendor is active — mirrors
// lib/whatsapp/index.ts's WHATSAPP_PROVIDER pattern. Every other file must import
// runDiagnosis from ../diagnose, never a concrete provider directly, so adding a
// new vendor later is: write providers/newProvider.ts implementing AIProvider,
// add a branch here, flip AI_PROVIDER — zero changes anywhere else.
function selectProvider(): AIProvider {
  const selected = process.env.AI_PROVIDER || "gemini";
  switch (selected) {
    case "gemini":
      return geminiProvider;
    default:
      throw new Error(`Unknown AI_PROVIDER "${selected}" — supported: gemini`);
  }
}

export const aiProvider: AIProvider = selectProvider();
