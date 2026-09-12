"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Send } from "lucide-react";

export function FarmerActions({ farmerId }: { farmerId: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendVideo() {
    setSending(true);
    try {
      await fetch("/api/whatsapp/send-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId }),
      });
      setSent(true);
    } finally {
      setSending(false);
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/farmers/${farmerId}`}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
      >
        View
      </Link>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-1.5 hover:bg-black/5"
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-black/10 bg-white py-1 text-sm shadow-lg">
            <button
              onClick={sendVideo}
              disabled={sending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending…" : sent ? "Sent ✓" : "Send Intro Video"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
