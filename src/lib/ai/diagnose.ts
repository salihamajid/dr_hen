import { aiProvider } from "./providers";
import type { ChatTurn, DiagnosisResult, Role } from "./provider";

// The single entry point every caller (dashboard AI routes, WhatsApp webhook
// handler) uses — nobody else imports providers/ or provider.ts's AIProvider
// directly. This is what keeps the AI vendor swappable via AI_PROVIDER alone.
export async function runDiagnosis(turns: ChatTurn[]): Promise<DiagnosisResult> {
  return aiProvider.runDiagnosis(turns);
}

export function textTurn(role: Role, text: string): ChatTurn {
  return { role, text };
}

export function imageTurn(base64Data: string, mimeType: string, caption: string): ChatTurn {
  return { role: "user", text: caption, image: { base64: base64Data, mimeType } };
}

export function audioTurn(base64Data: string, mimeType: string, caption: string): ChatTurn {
  return { role: "user", text: caption, audio: { base64: base64Data, mimeType } };
}
