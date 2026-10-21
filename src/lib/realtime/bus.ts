import "server-only";
import type { RealtimeEvent, RealtimeKind } from "./events";

/**
 * The in-process notice board that makes both dashboards live.
 *
 * WHY NOT POSTGRES LISTEN/NOTIFY: DATABASE_URL points at Neon's pooled endpoint, which runs
 * PgBouncer in transaction mode. A LISTEN there is bound to whichever backend the pool hands
 * out next, so notifications arrive on a connection nobody is holding. It cannot work without
 * a second, direct, long-lived connection — and Neon's free tier suspends idle computes, so
 * that connection would keep the database awake and still drop. Polling was the alternative:
 * every open dashboard waking a sleeping free-plan instance every few seconds is exactly the
 * load this plan can't carry.
 *
 * WHAT THIS ASSUMES: one Node process. True today — Render's free plan runs a single instance,
 * and every writer (the farmer portal, the admin pages, the WhatsApp webhook) is that same
 * process. If the service is ever scaled past one instance, a farmer connected to instance A
 * stops seeing changes written on instance B, and this file is where a shared broker
 * (Redis pub/sub, or Postgres NOTIFY over DIRECT_URL) has to replace the Map below.
 */

/** "admin" is every admin dashboard; a farm's own topic is only ever its own farmer. */
export type Topic = "admin" | `farmer:${string}`;

type Listener = (event: RealtimeEvent, seq: number) => void;

interface Channel {
  listeners: Set<Listener>;
  /** Counted per topic and sent as the SSE id, so a reconnecting browser can tell
   *  whether anything happened while it was away. Resets when the process restarts,
   *  which reads as "something may have changed" — the honest answer after a restart. */
  seq: number;
}

// Kept on globalThis like the Prisma client: `next dev` re-evaluates this module on
// hot reload, and a fresh Map would strand every open connection on the old copy.
const g = globalThis as unknown as { __drHenRealtime?: Map<Topic, Channel> };
const channels = (g.__drHenRealtime ??= new Map<Topic, Channel>());

function channelFor(topic: Topic): Channel {
  let c = channels.get(topic);
  if (!c) channels.set(topic, (c = { listeners: new Set(), seq: 0 }));
  return c;
}

export const farmerTopic = (farmerId: string): Topic => `farmer:${farmerId}`;

export function subscribe(topic: Topic, listener: Listener): () => void {
  const c = channelFor(topic);
  c.listeners.add(listener);
  return () => {
    c.listeners.delete(listener);
    // Don't leave an entry per farmer who ever opened the portal. The seq is only
    // useful while somebody is listening, so dropping it with the last listener is safe.
    if (c.listeners.size === 0) channels.delete(topic);
  };
}

/** The topic's current event number, for the SSE id and the Last-Event-ID comparison. */
export function sequenceOf(topic: Topic): number {
  return channels.get(topic)?.seq ?? 0;
}

export function totalSubscribers(): number {
  let n = 0;
  for (const c of channels.values()) n += c.listeners.size;
  return n;
}

/**
 * Announces a change on one topic.
 *
 * Deliberately synchronous and never throwing: this is called from the middle of save
 * handlers and the WhatsApp webhook, and a broken dashboard connection must not be able
 * to fail a farmer's daily entry.
 */
export function publish(topic: Topic, kind: RealtimeKind): void {
  const c = channels.get(topic);
  if (!c || c.listeners.size === 0) return;
  const event: RealtimeEvent = { kind, at: Date.now() };
  c.seq += 1;
  for (const listener of c.listeners) {
    try {
      listener(event, c.seq);
    } catch (err) {
      console.error(`[realtime] listener on ${topic} threw:`, err);
    }
  }
}

/**
 * One farm's data changed. Nearly everything a farmer does is also an admin's business,
 * so this tells both — the farm's own topic and the platform feed — and callers can't
 * forget one half.
 */
export function notifyFarmerChange(farmerId: string, kind: RealtimeKind): void {
  publish(farmerTopic(farmerId), kind);
  publish("admin", kind);
}

/** Something only the admin side shows (a broadcast, a new farmer, a delivery receipt). */
export function notifyAdminChange(kind: RealtimeKind): void {
  publish("admin", kind);
}
