"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, MessageCircle } from "lucide-react";

export function FarmerActions({ farmerId }: { farmerId: string }) {
  const [sending, setSending] = useState(false);
  const [sentVia, setSentVia] = useState<"mock" | "meta" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendVideo() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/send-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to send");
      }
      // The route returns 200 whether it ran through the mock provider or a
      // real Meta send — only the latter actually reached WhatsApp, so the
      // label has to reflect which one happened.
      setSentVia(body?.provider === "meta" ? "meta" : "mock");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  // Label lives in title/aria-label rather than visible text: the full wording
  // ("Sent (mock — no real message)") is far too wide for a dashboard table
  // column and was pushing Status and Actions off the right edge.
  const label = sending
    ? "Sending…"
    : sentVia === "meta"
      ? "Accepted by Meta"
      : sentVia === "mock"
        ? "Sent (mock — no real message)"
        : "Send WhatsApp intro video";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/farmers/${farmerId}`}
          className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5"
        >
          View
        </Link>
        <button
          onClick={sendVideo}
          disabled={sending || sentVia !== null}
          title={label}
          aria-label={label}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-60 ${
            sentVia === "meta" ? "bg-green-600" : sentVia === "mock" ? "bg-black/40" : "bg-brand-green hover:opacity-90"
          }`}
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : sentVia ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>
      {error && <span className="max-w-[200px] text-right text-[11px] leading-tight text-red-600">{error}</span>}
    </div>
  );
}
