"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function FarmerActions({ farmerId }: { farmerId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to send");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/farmers/${farmerId}`}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
        >
          View
        </Link>
        <button
          onClick={sendVideo}
          disabled={sending}
          className="flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {sending ? "Sending…" : sent ? "Accepted by Meta ✓" : "Send WhatsApp Message"}
        </button>
      </div>
      {error && <span className="max-w-[220px] text-right text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
