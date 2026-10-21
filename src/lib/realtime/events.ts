// Shared by the server bus and the browser component, so it must stay free of
// "server-only" imports.

/**
 * What changed. The client refreshes the whole page either way today, but carrying the
 * kind keeps the server log readable and lets a later phase refresh one card instead.
 */
export type RealtimeKind =
  | "daily-entry"
  | "alert"
  | "flock"
  | "message"
  | "delivery"
  | "broadcast"
  | "treatment"
  | "vaccination"
  | "vet-escalation"
  | "feed-order"
  | "farmer";

export interface RealtimeEvent {
  kind: RealtimeKind;
  /** Epoch ms, for the log and for ordering in the browser console. */
  at: number;
}

/** The two streams. A farmer's own data and the whole-platform feed are different URLs
 *  on purpose: each is authorised by its own role, so no query string can cross them. */
export const ADMIN_STREAM = "/api/events";
export const FARMER_STREAM = "/api/farmer/events";

/** Named SSE events. "change" means re-read; "hello" only confirms the stream is live. */
export const SSE_CHANGE = "change";
export const SSE_HELLO = "hello";
