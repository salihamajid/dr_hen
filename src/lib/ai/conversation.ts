import { textTurn } from "./diagnose";
import type { ChatTurn } from "./provider";

export interface HistoryRow {
  senderType: "FARMER" | "AI_AGENT" | "ADMIN" | "FIELD_VET";
  contentType: "TEXT" | "IMAGE" | "VOICE" | "VIDEO" | "TEMPLATE";
  textContent: string | null;
}

const PLACEHOLDER: Record<HistoryRow["contentType"], string> = {
  TEXT: "",
  IMAGE: "[photo]",
  VOICE: "[voice note]",
  VIDEO: "[video]",
  TEMPLATE: "[message]",
};

/**
 * Turns stored messages into the prior conversation for the model.
 *
 * Gemini rejects a request outright — no retry helps — when the turns don't start with the farmer
 * or when they end on a model turn: "Requests ending with a model turn are not supported." Two
 * things used to produce exactly that. Photos are stored with no text, so filtering empty messages
 * left the model's replies sitting next to each other; and a window of messages can easily begin
 * midway through an exchange.
 *
 * The result always starts with a farmer turn, strictly alternates, and ends on a model turn — a
 * run of complete exchanges — so the caller can append the farmer's new message and be certain the
 * request is well formed.
 */
export function priorConversation(rows: HistoryRow[]): ChatTurn[] {
  const turns: { role: "user" | "assistant"; text: string }[] = [];

  for (const row of rows) {
    const text = (row.textContent ?? "").trim() || PLACEHOLDER[row.contentType];
    if (!text) continue;
    const role = row.senderType === "FARMER" ? "user" : "assistant";
    const last = turns[turns.length - 1];
    // Merge rather than drop: two replies in a row still carry what was said.
    if (last?.role === role) last.text = `${last.text}\n${text}`;
    else turns.push({ role, text });
  }

  while (turns.length && turns[0].role === "assistant") turns.shift();
  // A trailing farmer turn is an exchange still in progress; the caller's new message continues it.
  while (turns.length && turns[turns.length - 1].role === "user") turns.pop();

  return turns.map((t) => textTurn(t.role, t.text));
}
