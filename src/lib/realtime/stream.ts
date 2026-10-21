import "server-only";
import { sequenceOf, subscribe, totalSubscribers, type Topic } from "./bus";
import { SSE_CHANGE, SSE_HELLO, type RealtimeEvent } from "./events";

/** Comment line every 25s. Render's proxy closes a connection that says nothing for
 *  about a minute, and so do many mobile carriers, so the stream has to breathe. */
const HEARTBEAT_MS = 25_000;

/** Closed and reopened on purpose every quarter hour. EventSource reconnects by itself,
 *  so nothing is lost, and a connection leaked by a crashed tab can't live for days on
 *  a 512 MB instance. */
const MAX_LIFETIME_MS = 15 * 60 * 1000;

/** A ceiling, not a target: ~2 KB of buffer each, so this is a small slice of the free
 *  plan's memory. Past it a new listener is refused rather than tipping the instance over. */
const MAX_CONNECTIONS = 120;

const encoder = new TextEncoder();

/**
 * Opens a Server-Sent Events stream for one topic.
 *
 * SSE rather than WebSockets: the traffic is one-way (the server says "something changed",
 * the browser re-reads through the pages it already has), EventSource reconnects on its own
 * over a dropped mobile connection, and it is plain HTTP — so the session cookie, src/proxy.ts
 * and the Capacitor WebView all keep working with no second authentication path.
 *
 * The caller has already proved which topic it may read. Nothing in the request chooses it.
 */
export function eventStream(topic: Topic, req: Request): Response {
  if (totalSubscribers() >= MAX_CONNECTIONS) {
    // 503 + Retry-After: EventSource will come back, and the dashboard's slow fallback
    // refresh keeps the figures moving meanwhile.
    return new Response("Too many live connections", { status: 503, headers: { "Retry-After": "30" } });
  }

  // Set by the browser automatically on a reconnect. If the topic has moved on since,
  // the dashboard is stale and needs one re-read immediately.
  const lastSeen = Number(req.headers.get("last-event-id") ?? NaN);
  const missed = Number.isFinite(lastSeen) && lastSeen !== sequenceOf(topic);

  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;

      const write = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The socket went away between the abort and this write. Nothing to report.
          close();
        }
      };

      const close = () => {
        if (!open) return;
        open = false;
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
        if (lifetime) clearTimeout(lifetime);
        if (onAbort) req.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime; the cleanup above is what mattered.
        }
      };

      // Tells the browser how long to wait before reconnecting. Without it browsers
      // use their own default (3s in most, but it is not guaranteed).
      write("retry: 5000\n\n");
      // Carries the topic's current id so the browser's Last-Event-ID is in step from here on;
      // otherwise a restarted process would be reported as "missed" on every single reconnect.
      const opening = JSON.stringify({ reason: missed ? "reconnected" : "connected", at: Date.now() });
      write(`id: ${sequenceOf(topic)}\nevent: ${missed ? SSE_CHANGE : SSE_HELLO}\ndata: ${opening}\n\n`);

      unsubscribe = subscribe(topic, (event: RealtimeEvent, seq: number) => {
        write(`id: ${seq}\nevent: ${SSE_CHANGE}\ndata: ${JSON.stringify(event)}\n\n`);
      });

      heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);
      lifetime = setTimeout(close, MAX_LIFETIME_MS);

      onAbort = close;
      // The tab was closed or navigated away. Without this the subscription and its
      // heartbeat would stay behind for every dashboard ever opened.
      if (req.signal.aborted) close();
      else req.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
      if (lifetime) clearTimeout(lifetime);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform matters as much as no-cache: a proxy that gzips this would buffer
      // it, and every update would arrive in a clump minutes late.
      "Cache-Control": "private, no-cache, no-store, no-transform, must-revalidate",
      Connection: "keep-alive",
      // Nginx-family proxies (Render's included) buffer responses by default.
      "X-Accel-Buffering": "no",
    },
  });
}
