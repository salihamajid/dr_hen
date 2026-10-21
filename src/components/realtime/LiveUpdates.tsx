"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SSE_CHANGE, SSE_HELLO } from "@/lib/realtime/events";

/** A burst of writes (a daily entry plus the alerts it fires) should cost one re-read. */
const DEBOUNCE_MS = 400;
/** Floor between two re-reads, so a busy farm can't make the dashboard thrash. */
const MIN_GAP_MS = 2_500;
/** Safety net while the stream is down: slow, but the figures still move. */
const OFFLINE_POLL_MS = 60_000;
/** How long to wait out someone who is typing. */
const BUSY_RETRY_MS = 2_000;

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

/**
 * Keeps whatever is on screen in step with the database, with no refresh button and no polling.
 *
 * It listens on the role's own event stream and calls router.refresh() when the server says
 * something changed. refresh() re-runs the server components and swaps in the new markup while
 * keeping client state — scroll position, an open dialog, a half-typed form — so a farmer
 * doesn't lose their place because an alert fired somewhere else.
 *
 * Mounted once in each area's layout, so a single connection covers every page and survives
 * navigation between them.
 */
export function LiveUpdates({ stream }: { stream: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastRefresh = 0;
    let pending = false;
    let connected = false;
    let disposed = false;

    const run = () => {
      timer = undefined;
      if (disposed) return;
      // Nobody is looking. Remember it and catch up when the tab comes back, rather than
      // keeping a sleeping free-plan instance busy for a dashboard in a background tab.
      if (document.hidden) {
        pending = true;
        return;
      }
      // Mid-sentence in Daily Entry: re-rendering now would feel like the page fighting back.
      if (isTyping()) {
        pending = true;
        timer = setTimeout(run, BUSY_RETRY_MS);
        return;
      }
      pending = false;
      lastRefresh = Date.now();
      router.refresh();
    };

    const schedule = () => {
      if (disposed || timer) return; // already coalescing into the next re-read
      timer = setTimeout(run, Math.max(DEBOUNCE_MS, MIN_GAP_MS - (Date.now() - lastRefresh)));
    };

    const source = new EventSource(stream);
    const onOpen = () => {
      connected = true;
    };
    // The server sends "change" instead of "hello" when the stream's event id moved on while
    // we were disconnected, so a dropped connection catches up with exactly one re-read.
    const onChange = () => {
      connected = true;
      schedule();
    };
    source.addEventListener("open", onOpen);
    source.addEventListener(SSE_HELLO, onOpen);
    source.addEventListener(SSE_CHANGE, onChange);
    source.addEventListener("error", () => {
      connected = false;
    });

    const onVisible = () => {
      if (!document.hidden && pending) schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Only fires while the stream is unusable. A rejected handshake (an expired session, or
    // the connection cap) closes an EventSource for good by spec, with no reconnect, so
    // without this the page would sit on stale numbers until someone reloaded it.
    const fallback = setInterval(() => {
      if (!connected || source.readyState === EventSource.CLOSED) schedule();
    }, OFFLINE_POLL_MS);

    return () => {
      disposed = true;
      clearInterval(fallback);
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      source.close();
    };
  }, [stream, router]);

  return null;
}
